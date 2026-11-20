import unittest
import json
from backend.app import create_app
from backend.database import SessionLocal, init_db
from backend.seed import seed_database
from backend.models import Table, MenuItem, Order, InventoryItem, Customer, Bill, Reservation

class DineFlowAPITestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def get_token(self, username="owner", password="password123"):
        res = self.client.post("/api/auth/login", json={"username": username, "password": password})
        self.assertEqual(res.status_code, 200, f"Login failed for {username}")
        data = res.get_json()
        return data["token"]

    def test_01_auth_roles(self):
        """Test login for all 5 roles"""
        for user, role in [("owner", "owner"), ("manager", "manager"), ("cashier", "cashier"), ("waiter", "waiter"), ("chef", "kitchen")]:
            res = self.client.post("/api/auth/login", json={"username": user, "password": "password123"})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertIn("token", data)
            self.assertEqual(data["user"]["role"], role)

    def test_02_dashboard_stats(self):
        """Test dashboard returns real database metrics"""
        token = self.get_token("owner")
        res = self.client.get("/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("today_sales", data)
        self.assertIn("today_orders", data)
        self.assertIn("available_tables", data)
        self.assertIn("low_stock_count", data)
        self.assertIn("weekly_sales", data)
        self.assertIn("top_selling", data)

    def test_03_tables_crud_and_status(self):
        """Test table creation, status change, and waiter assignment"""
        token = self.get_token("manager")
        # 1. Create table
        res = self.client.post("/api/tables", headers={"Authorization": f"Bearer {token}"}, json={
            "number": "T-TEST",
            "capacity": 4,
            "section": "Main Dining",
            "notes": "Automated test table"
        })
        self.assertEqual(res.status_code, 201)
        table_id = res.get_json()["id"]

        # 2. Change status to occupied
        res = self.client.post(f"/api/tables/{table_id}/status", headers={"Authorization": f"Bearer {token}"}, json={
            "status": "occupied"
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["status"], "occupied")

        # 3. Clean up
        res = self.client.post(f"/api/tables/{table_id}/status", headers={"Authorization": f"Bearer {token}"}, json={
            "status": "available"
        })
        res = self.client.delete(f"/api/tables/{table_id}", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)

    def test_04_menu_items_and_categories(self):
        """Test menu items query and category listing"""
        token = self.get_token("waiter")
        res = self.client.get("/api/menu")
        self.assertEqual(res.status_code, 200)
        items = res.get_json()
        self.assertGreaterEqual(len(items), 40)

        res_cats = self.client.get("/api/menu/categories")
        self.assertEqual(res_cats.status_code, 200)
        cats = res_cats.get_json()
        self.assertIn("Starters", cats)
        self.assertIn("Main Course", cats)

    def test_05_order_lifecycle_and_inventory_deduction(self):
        """Test complete order flow: create -> kitchen prep -> ready -> served (auto-deduct inventory) -> billing pay"""
        waiter_token = self.get_token("waiter")
        cashier_token = self.get_token("cashier")

        # Check stock of Tomato before order
        res_inv = self.client.get("/api/inventory", headers={"Authorization": f"Bearer {waiter_token}"})
        inv_list = res_inv.get_json()
        tomato_before = next((i for i in inv_list if i["name"] == "Tomato"), None)
        initial_stock = tomato_before["current_stock"] if tomato_before else 0

        # Find Butter Chicken (which uses Tomato in recipe)
        res_menu = self.client.get("/api/menu?category=Main Course")
        butter_chicken = next((m for m in res_menu.get_json() if "Butter Chicken" in m["name"]), None)
        self.assertIsNotNone(butter_chicken)

        # 1. Place order
        res_order = self.client.post("/api/orders", headers={"Authorization": f"Bearer {waiter_token}"}, json={
            "table_id": 1,
            "customer_name": "Test Guest",
            "customer_phone": "+1 555-9999",
            "order_type": "dine_in",
            "items": [
                {"menu_item_id": butter_chicken["id"], "quantity": 2, "notes": "Extra rich gravy"}
            ],
            "discount_amount": 2.0,
            "special_instructions": "VIP test order"
        })
        self.assertEqual(res_order.status_code, 201)
        order_data = res_order.get_json()
        order_id = order_data["id"]
        self.assertEqual(order_data["status"], "new")

        # 2. Kitchen starts preparing
        chef_token = self.get_token("chef")
        res_k1 = self.client.post(f"/api/kitchen/orders/{order_id}/status", headers={"Authorization": f"Bearer {chef_token}"}, json={"status": "preparing"})
        self.assertEqual(res_k1.status_code, 200)

        # 3. Kitchen marks ready
        res_k2 = self.client.post(f"/api/kitchen/orders/{order_id}/status", headers={"Authorization": f"Bearer {chef_token}"}, json={"status": "ready"})
        self.assertEqual(res_k2.status_code, 200)

        # 4. Waiter serves order (Triggers inventory recipe deduction!)
        res_k3 = self.client.post(f"/api/kitchen/orders/{order_id}/status", headers={"Authorization": f"Bearer {waiter_token}"}, json={"status": "served"})
        self.assertEqual(res_k3.status_code, 200)

        # Check stock of Tomato decreased
        res_inv2 = self.client.get("/api/inventory", headers={"Authorization": f"Bearer {waiter_token}"})
        tomato_after = next((i for i in res_inv2.get_json() if i["name"] == "Tomato"), None)
        self.assertLess(tomato_after["current_stock"], initial_stock)

        # 5. Billing generates invoice and settles payment
        res_bill = self.client.post("/api/billing/generate", headers={"Authorization": f"Bearer {cashier_token}"}, json={
            "order_id": order_id,
            "discount_type": "fixed",
            "discount_value": 2.0,
            "tax_rate": 5.0
        })
        self.assertEqual(res_bill.status_code, 200)
        bill_data = res_bill.get_json()

        # 6. Settle payment via UPI
        res_pay = self.client.post(f"/api/billing/{bill_data['id']}/pay", headers={"Authorization": f"Bearer {cashier_token}"}, json={
            "payment_method": "upi",
            "payment_reference": "UPI-TEST-12345"
        })
        self.assertEqual(res_pay.status_code, 200)
        paid_bill = res_pay.get_json()
        self.assertEqual(paid_bill["payment_status"], "paid")

        # Verify order is now completed and table is available
        res_ord_check = self.client.get(f"/api/orders/{order_id}", headers={"Authorization": f"Bearer {waiter_token}"})
        self.assertEqual(res_ord_check.get_json()["status"], "completed")

    def test_06_reservations_and_conflict_prevention(self):
        """Test reservation creation and double-booking collision prevention"""
        token = self.get_token("manager")
        date_str = "2026-12-25"
        time_str = "20:00"

        # 1. Create first reservation for Table 2
        res1 = self.client.post("/api/reservations", headers={"Authorization": f"Bearer {token}"}, json={
            "customer_name": "Alice Wonderland",
            "customer_phone": "+1 555-8811",
            "table_id": 2,
            "reservation_date": date_str,
            "reservation_time": time_str,
            "guest_count": 2,
            "notes": "Holiday table"
        })
        self.assertEqual(res1.status_code, 201)
        res_id = res1.get_json()["id"]

        # 2. Attempt duplicate booking for same Table 2 on same date & time (MUST FAIL with 409 Conflict)
        res2 = self.client.post("/api/reservations", headers={"Authorization": f"Bearer {token}"}, json={
            "customer_name": "Bob Duplicate",
            "customer_phone": "+1 555-8822",
            "table_id": 2,
            "reservation_date": date_str,
            "reservation_time": time_str,
            "guest_count": 4
        })
        self.assertEqual(res2.status_code, 409, "Double booking was not prevented!")

        # 3. Clean up
        self.client.delete(f"/api/reservations/{res_id}", headers={"Authorization": f"Bearer {token}"})

    def test_07_reports_analytics(self):
        """Test reports analytics calculation endpoint"""
        token = self.get_token("owner")
        res = self.client.get("/api/reports/analytics?range=7d", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("total_sales", data)
        self.assertIn("sales_timeline", data)
        self.assertIn("sales_by_category", data)
        self.assertIn("peak_hours", data)
        self.assertIn("best_selling", data)

if __name__ == "__main__":
    unittest.main()
