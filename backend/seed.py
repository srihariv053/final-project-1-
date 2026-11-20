from datetime import datetime, timedelta
import random
from .database import SessionLocal, init_db, Base, engine
from .models import (
    User, Table, MenuItem, RecipeItem, InventoryItem, StockMovement,
    Supplier, SupplierPurchase, PurchaseItem, Customer, Reservation,
    Order, OrderItem, Bill, Notification, RestaurantSetting
)
from .auth_helper import hash_password

def seed_database(force_reset=False):
    if force_reset:
        Base.metadata.drop_all(bind=engine)
    init_db()

    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).count() > 0 and not force_reset:
            print("Database already seeded. Skipping.")
            return

        print("Seeding DineFlow database with realistic INR sample data...")

        # 1. Default Restaurant Settings in INR
        settings = [
            ("restaurant_name", "DineFlow Gourmet & Bistro"),
            ("tagline", "Fine Dining & Hospitality Management"),
            ("address", "42 Heritage Boulevard, Connaught Place, New Delhi"),
            ("phone", "+91 98765 43210"),
            ("email", "contact@dineflow-restaurant.com"),
            ("currency_symbol", "₹"),
            ("tax_rate_percent", "5.0"),
            ("service_charge_percent", "0.0"),
            ("opening_time", "10:00"),
            ("closing_time", "23:00"),
            ("receipt_footer", "Thank you for dining with DineFlow! Please visit us again.")
        ]
        for k, v in settings:
            db.add(RestaurantSetting(key=k, value=v))

        # 2. Staff Members (10 users covering all 5 roles)
        staff_data = [
            ("owner", "Vikram Sharma", "owner@dineflow.com", "+91 98765 01001", "owner", "active"),
            ("manager", "Ananya Roy", "ananya@dineflow.com", "+91 98765 01002", "manager", "active"),
            ("manager2", "Marcus Chen", "marcus@dineflow.com", "+91 98765 01003", "manager", "active"),
            ("cashier", "Rahul Verma", "rahul@dineflow.com", "+91 98765 01004", "cashier", "active"),
            ("cashier2", "Emily Watson", "emily@dineflow.com", "+91 98765 01005", "cashier", "active"),
            ("waiter", "Karan Singh", "karan@dineflow.com", "+91 98765 01006", "waiter", "active"),
            ("waiter2", "Sarah Jenkins", "sarah@dineflow.com", "+91 98765 01007", "waiter", "active"),
            ("waiter3", "David Miller", "david@dineflow.com", "+91 98765 01008", "waiter", "active"),
            ("chef", "Sanjay Kapoor", "chef@dineflow.com", "+91 98765 01009", "kitchen", "active"),
            ("chef2", "Elena Rossi", "elena@dineflow.com", "+91 98765 01010", "kitchen", "active"),
        ]

        users = {}
        for username, full_name, email, phone, role, status in staff_data:
            u = User(
                username=username,
                password_hash=hash_password("password123"),
                full_name=full_name,
                email=email,
                phone=phone,
                role=role,
                status=status
            )
            db.add(u)
            users[username] = u
        db.flush()

        # 3. 15 Tables across 4 sections
        table_configs = [
            ("T-01", 2, "Main Dining", "Window seat with garden view"),
            ("T-02", 2, "Main Dining", "Cozy couple corner"),
            ("T-03", 4, "Main Dining", "Central banquet table"),
            ("T-04", 4, "Main Dining", "Near beverage bar"),
            ("T-05", 6, "Main Dining", "Family booth seating"),
            ("T-06", 6, "Main Dining", "Round table near hearth"),
            ("T-07", 8, "Main Dining", "Large group banquet"),
            ("T-08", 4, "Balcony", "Open-air scenic balcony"),
            ("T-09", 4, "Balcony", "Covered terrace view"),
            ("T-10", 2, "Balcony", "Candlelit romantic terrace"),
            ("T-11", 4, "Rooftop Lounge", "Skyline panorama seating"),
            ("T-12", 6, "Rooftop Lounge", "Lounge sofa arrangement"),
            ("T-13", 8, "Rooftop Lounge", "VIP lounge cabana"),
            ("T-14", 10, "Private Dining Room", "Executive suite with sound isolation"),
            ("T-15", 12, "Private Dining Room", "Royal banquet board room"),
        ]

        tables = []
        for num, cap, sec, notes in table_configs:
            t = Table(
                number=num,
                capacity=cap,
                section=sec,
                status="available",
                notes=notes
            )
            db.add(t)
            tables.append(t)
        db.flush()

        # 4. 10 Suppliers
        suppliers_data = [
            ("FreshFarm Organics", "Robert Green", "+91 98111 22331", "robert@freshfarm.in", "Azadpur Mandi, Delhi", "Tomatoes, Onions, Potatoes, Bell Peppers, Herbs"),
            ("Prime Meat & Poultry", "John Butcher", "+91 98111 22332", "john@primemeats.in", "Ghazipur Market, Delhi", "Chicken Breast, Mutton, Lamb Chops"),
            ("Ocean Crest Seafood", "Marina Fisher", "+91 98111 22333", "marina@oceanseafood.in", "Sassoon Docks, Mumbai", "Tiger Prawns, Salmon, Fish Fillet"),
            ("Dairy Land Wholesale", "Paul Miller", "+91 98111 22334", "paul@dairyland.in", "Karnal Dairy Belt, Haryana", "Paneer, Mozzarella, Butter, Fresh Cream, Milk"),
            ("Spice Route Traders", "Arjun Patel", "+91 98111 22335", "arjun@spiceroute.in", "Khari Baoli, Old Delhi", "Garam Masala, Cumin, Turmeric, Cardamom, Chili"),
            ("Golden Grain Mills", "Samuel Baker", "+91 98111 22336", "samuel@goldengrain.in", "GT Road, Khanna, Punjab", "Basmati Rice, Wheat Flour, All-Purpose Flour"),
            ("Sunbeam Cooking Oils", "Carla Torres", "+91 98111 22337", "carla@sunbeamoil.in", "Industrial Area, Kandla", "Refined Sunflower Oil, Olive Oil, Desi Ghee"),
            ("Evergreen Asian Grocers", "Kenji Sato", "+91 98111 22338", "kenji@evergreengrocery.in", "Connaught Place, New Delhi", "Soy Sauce, Chili Paste, Hakka Noodles"),
            ("Artisan Baker Supplies", "Chloe Dubois", "+91 98111 22339", "chloe@artisanbakery.in", "Defence Colony, New Delhi", "Chocolate Compound, Vanilla, Cocoa Powder"),
            ("Beverage Crafters Co.", "Leo Vance", "+91 98111 22340", "leo@beveragecrafters.in", "Chikmagalur Coffee Estate", "Coffee Beans, Artisan Teas, Soda Syrups"),
        ]

        suppliers = []
        for name, cp, phone, email, addr, items in suppliers_data:
            s = Supplier(
                name=name,
                contact_person=cp,
                phone=phone,
                email=email,
                address=addr,
                supplied_items=items
            )
            db.add(s)
            suppliers.append(s)
        db.flush()

        # 5. Inventory Items (26 ingredients with INR costs per unit)
        inventory_data = [
            ("Tomato", "Vegetables", 3.0, "kg", 5.0, suppliers[0].id, 35.0),   # Low stock alert
            ("Onion", "Vegetables", 25.0, "kg", 8.0, suppliers[0].id, 28.0),
            ("Potato", "Vegetables", 20.0, "kg", 6.0, suppliers[0].id, 22.0),
            ("Bell Pepper (Capsicum)", "Vegetables", 2.5, "kg", 4.0, suppliers[0].id, 65.0),  # Low stock alert
            ("Garlic & Ginger", "Vegetables", 4.0, "kg", 3.0, suppliers[0].id, 120.0),
            ("Fresh Coriander & Mint", "Vegetables", 1.2, "kg", 2.0, suppliers[0].id, 60.0),  # Low stock alert
            ("Chicken Breast", "Meat & Seafood", 15.0, "kg", 5.0, suppliers[1].id, 260.0),
            ("Mutton / Lamb", "Meat & Seafood", 8.0, "kg", 4.0, suppliers[1].id, 750.0),
            ("Tiger Prawns", "Meat & Seafood", 6.0, "kg", 3.0, suppliers[2].id, 850.0),
            ("Fresh Paneer", "Dairy", 9.0, "kg", 4.0, suppliers[3].id, 320.0),
            ("Butter", "Dairy", 2.0, "kg", 3.5, suppliers[3].id, 520.0),         # Low stock alert
            ("Fresh Cooking Cream", "Dairy", 5.0, "liters", 3.0, suppliers[3].id, 220.0),
            ("Mozzarella Cheese", "Dairy", 7.0, "kg", 3.0, suppliers[3].id, 450.0),
            ("Basmati Rice", "Grains", 35.0, "kg", 10.0, suppliers[5].id, 90.0),
            ("Flour (Maida & Atta)", "Grains", 28.0, "kg", 8.0, suppliers[5].id, 40.0),
            ("Noodles (Hakka)", "Grains", 12.0, "kg", 4.0, suppliers[7].id, 85.0),
            ("Refined Cooking Oil", "Oils & Sauces", 25.0, "liters", 8.0, suppliers[6].id, 130.0),
            ("Pure Desi Ghee", "Dairy", 4.5, "kg", 3.0, suppliers[6].id, 680.0),
            ("Garam Masala Blend", "Spices", 3.0, "kg", 1.5, suppliers[4].id, 450.0),
            ("Red Chili Powder", "Spices", 4.0, "kg", 2.0, suppliers[4].id, 280.0),
            ("Soy & Chili Sauces", "Oils & Sauces", 8.0, "liters", 3.0, suppliers[7].id, 140.0),
            ("Dark Chocolate", "Desserts", 3.5, "kg", 2.0, suppliers[8].id, 480.0),
            ("Sugar & Honey", "Grains", 20.0, "kg", 5.0, suppliers[8].id, 45.0),
            ("Espresso Coffee Beans", "Beverages", 1.5, "kg", 3.0, suppliers[9].id, 850.0),  # Low stock alert
            ("Lemons & Mint Leaves", "Beverages", 5.0, "kg", 2.0, suppliers[9].id, 50.0),
            ("Tea Leaves & Spices", "Beverages", 4.0, "kg", 2.0, suppliers[9].id, 320.0)
        ]

        inv_items = {}
        for name, cat, stock, unit, min_s, sup_id, cpu in inventory_data:
            inv = InventoryItem(
                name=name,
                category=cat,
                current_stock=stock,
                unit=unit,
                min_stock=min_s,
                supplier_id=sup_id,
                cost_per_unit=cpu,
                last_restocked_at=datetime.utcnow() - timedelta(days=random.randint(1, 10))
            )
            db.add(inv)
            inv_items[name] = inv
        db.flush()

        # 6. 40 Menu Items in INR (₹)
        menu_items_raw = [
            # Starters (8)
            ("Paneer Tikka Royale", "Starters", 320.0, "Smoked cottage cheese cubes marinated in spiced yogurt and grilled to golden perfection.", True, True, "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80", 15, [("Fresh Paneer", 0.2), ("Butter", 0.05), ("Garam Masala Blend", 0.02)]),
            ("Chicken Malai Tikka", "Starters", 380.0, "Tender chicken chunks steeped in mild cream, cardamom, and roasted garlic glaze.", False, True, "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80", 18, [("Chicken Breast", 0.25), ("Fresh Cooking Cream", 0.05), ("Butter", 0.03)]),
            ("Crispy Corn Salt & Pepper", "Starters", 240.0, "Golden fried sweet corn kernels tossed with crunchy bell peppers and spring onion.", True, True, "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=80", 12, [("Bell Pepper (Capsicum)", 0.08), ("Refined Cooking Oil", 0.05)]),
            ("Tandoori Chicken Skewers", "Starters", 420.0, "Signature clay-oven charred chicken drumsticks in robust Kashmiri spices.", False, True, "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=80", 20, [("Chicken Breast", 0.3), ("Red Chili Powder", 0.02), ("Garam Masala Blend", 0.02)]),
            ("Golden Stuffed Mushrooms", "Starters", 290.0, "Button mushroom caps stuffed with cheddar, herbs, and crumbed panko.", True, True, "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=500&auto=format&fit=crop&q=80", 14, [("Mozzarella Cheese", 0.08), ("Butter", 0.03)]),
            ("Prawns Koliwada", "Starters", 490.0, "Battered coastal spiced jumbo tiger prawns served with garlic cilantro dip.", False, True, "https://images.unsplash.com/photo-1559742811-822873691df8?w=500&auto=format&fit=crop&q=80", 15, [("Tiger Prawns", 0.2), ("Refined Cooking Oil", 0.08)]),
            ("Vegetable Spring Rolls", "Starters", 210.0, "Hand-rolled crispy pastry sheets filled with wok-tossed cabbage, carrots and sprouts.", True, True, "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80", 10, [("Refined Cooking Oil", 0.05), ("Flour (Maida & Atta)", 0.08)]),
            ("Amritsari Fish Fingers", "Starters", 390.0, "Carom-seed crusted sea fish fillets served with spicy mint tartare.", False, True, "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80", 15, [("Refined Cooking Oil", 0.08), ("Red Chili Powder", 0.02)]),

            # Main Course (10)
            ("Butter Chicken Delhi-Style", "Main Course", 450.0, "Tandoor-charred chicken simmered in a velvety tomato and cashew butter gravy.", False, True, "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80", 20, [("Chicken Breast", 0.25), ("Butter", 0.06), ("Tomato", 0.2), ("Fresh Cooking Cream", 0.05)]),
            ("Paneer Butter Masala", "Main Course", 360.0, "Succulent cottage cheese cubes folded in a rich satin gravy infused with kasuri methi.", True, True, "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80", 18, [("Fresh Paneer", 0.2), ("Tomato", 0.15), ("Butter", 0.05), ("Fresh Cooking Cream", 0.04)]),
            ("Dal Makhani Bukhara", "Main Course", 290.0, "Slow-cooked black lentils simmered overnight on low embers with butter and cream.", True, True, "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80", 15, [("Butter", 0.05), ("Fresh Cooking Cream", 0.04), ("Tomato", 0.1)]),
            ("Rogan Josh Kashmiri Lamb", "Main Course", 540.0, "Slow-braised tender lamb shank with Kashmiri chilies, fennel, and aromatic saffron.", False, True, "https://images.unsplash.com/photo-1545247181-516773cae754?w=500&auto=format&fit=crop&q=80", 25, [("Mutton / Lamb", 0.3), ("Onion", 0.15), ("Pure Desi Ghee", 0.04), ("Garam Masala Blend", 0.03)]),
            ("Kadai Paneer Smokey", "Main Course", 340.0, "Cottage cheese and crunchy bell peppers tossed in fresh pounded coriander seeds and gravy.", True, True, "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80", 16, [("Fresh Paneer", 0.2), ("Bell Pepper (Capsicum)", 0.1), ("Tomato", 0.1)]),
            ("Murg Dum Handi", "Main Course", 460.0, "Chicken pot curry slow-sealed in an earthen pot with caramelized onions and yogurt.", False, True, "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80", 22, [("Chicken Breast", 0.25), ("Onion", 0.15), ("Pure Desi Ghee", 0.03)]),
            ("Palak Paneer Velvet", "Main Course", 320.0, "Blanched tender spinach pureed with garlic and mild spices, topped with soft paneer cubes.", True, True, "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=80", 16, [("Fresh Paneer", 0.18), ("Garlic & Ginger", 0.04), ("Butter", 0.03)]),
            ("Goan Prawn Curry", "Main Course", 520.0, "Jumbo prawns simmered in freshly squeezed coconut milk, tamarind, and whole spices.", False, True, "https://images.unsplash.com/photo-1559742811-822873691df8?w=500&auto=format&fit=crop&q=80", 20, [("Tiger Prawns", 0.25), ("Onion", 0.08), ("Red Chili Powder", 0.02)]),
            ("Methi Malai Matar", "Main Course", 310.0, "Fresh green peas and fenugreek leaves in a creamy cashew and white gravy reduction.", True, True, "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80", 15, [("Fresh Cooking Cream", 0.06), ("Onion", 0.08), ("Butter", 0.03)]),
            ("Bhuna Gosht Royal", "Main Course", 550.0, "Richly roasted lamb sautéed dry with thick brown onion glaze and crushed peppercorn.", False, True, "https://images.unsplash.com/photo-1545247181-516773cae754?w=500&auto=format&fit=crop&q=80", 25, [("Mutton / Lamb", 0.3), ("Onion", 0.2), ("Pure Desi Ghee", 0.04)]),

            # Rice & Noodles (8)
            ("Hyderabadi Chicken Biryani", "Rice & Noodles", 380.0, "Long-grain basmati layered with spiced bone-in chicken and saffron aroma.", False, True, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80", 20, [("Basmati Rice", 0.25), ("Chicken Breast", 0.2), ("Pure Desi Ghee", 0.03)]),
            ("Nawabi Vegetable Dum Biryani", "Rice & Noodles", 290.0, "Assorted seasonal vegetables layered with saffron rice and fragrant kewra water.", True, True, "https://images.unsplash.com/photo-1642821373181-696a54913e9a?w=500&auto=format&fit=crop&q=80", 18, [("Basmati Rice", 0.25), ("Potato", 0.08), ("Pure Desi Ghee", 0.02)]),
            ("Jeera Pulao Steamed", "Rice & Noodles", 180.0, "Fluffy aged basmati rice tempered with golden cumin and clarified butter.", True, True, "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80", 10, [("Basmati Rice", 0.2), ("Pure Desi Ghee", 0.02)]),
            ("Schezwan Hakka Noodles Veg", "Rice & Noodles", 240.0, "Wok-tossed noodles with shredded cabbage, carrots, bell peppers, and chili paste.", True, True, "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80", 14, [("Noodles (Hakka)", 0.2), ("Bell Pepper (Capsicum)", 0.05), ("Soy & Chili Sauces", 0.03)]),
            ("Chicken Singapore Noodles", "Rice & Noodles", 290.0, "Vermicelli noodles tossed with shredded chicken, mild curry oil and scallions.", False, True, "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80", 15, [("Noodles (Hakka)", 0.2), ("Chicken Breast", 0.15), ("Soy & Chili Sauces", 0.03)]),
            ("Egg Fried Rice Classic", "Rice & Noodles", 240.0, "Wok-seared Jasmine rice with fluffy scrambled eggs, spring onions, and light soya.", False, True, "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80", 12, [("Basmati Rice", 0.2), ("Soy & Chili Sauces", 0.02), ("Refined Cooking Oil", 0.03)]),
            ("Mutton Yakhni Pulao", "Rice & Noodles", 480.0, "Delicate rice simmered in rich bone broth, star anise, and whole cardamom pods.", False, True, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80", 22, [("Basmati Rice", 0.25), ("Mutton / Lamb", 0.2), ("Pure Desi Ghee", 0.03)]),
            ("Chili Garlic Fried Rice Veg", "Rice & Noodles", 230.0, "Spicy wok-fried rice with charred garlic flakes, chili paste, and fresh vegetables.", True, True, "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80", 12, [("Basmati Rice", 0.2), ("Garlic & Ginger", 0.03), ("Soy & Chili Sauces", 0.03)]),

            # Breads (5)
            ("Butter Garlic Naan", "Breads", 75.0, "Clay oven baked flatbread brushed with roasted garlic butter and fresh coriander.", True, True, "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&auto=format&fit=crop&q=80", 8, [("Flour (Maida & Atta)", 0.15), ("Butter", 0.03), ("Garlic & Ginger", 0.01)]),
            ("Cheese Stuffed Naan", "Breads", 110.0, "Crisp tandoori naan oozing with melted mozzarella and green chili herbs.", True, True, "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80", 10, [("Flour (Maida & Atta)", 0.15), ("Mozzarella Cheese", 0.06), ("Butter", 0.02)]),
            ("Tandoori Roti Whole Wheat", "Breads", 35.0, "Traditional stoneground whole wheat bread baked against piping hot clay walls.", True, True, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80", 6, [("Flour (Maida & Atta)", 0.12)]),
            ("Laccha Paratha Flaky", "Breads", 65.0, "Multi-layered spiraled bread brushed with pure ghee and toasted to a flaky crunch.", True, True, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80", 8, [("Flour (Maida & Atta)", 0.14), ("Pure Desi Ghee", 0.02)]),
            ("Amritsari Kulcha Stuffed", "Breads", 95.0, "Crispy leavened bread stuffed with spiced mashed potatoes and carom seeds.", True, True, "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80", 10, [("Flour (Maida & Atta)", 0.15), ("Potato", 0.08), ("Butter", 0.02)]),

            # Desserts (5)
            ("Warm Gulab Jamun & Saffron", "Desserts", 140.0, "Deep-fried milk dumplings soaked in cardamom and rose sugar syrup with pistachio.", True, True, "https://images.unsplash.com/photo-1589119908995-c6837fa14d48?w=500&auto=format&fit=crop&q=80", 6, [("Sugar & Honey", 0.08), ("Pure Desi Ghee", 0.02)]),
            ("Saffron Rasmalai Dumplings", "Desserts", 160.0, "Delicate cottage cheese patties soaked in saffron clotted milk and almond slivers.", True, True, "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80", 6, [("Fresh Paneer", 0.08), ("Fresh Cooking Cream", 0.05), ("Sugar & Honey", 0.04)]),
            ("Sizzling Chocolate Brownie", "Desserts", 220.0, "Warm Belgian chocolate brownie served on a sizzling skillet with Madagascar vanilla ice cream.", True, True, "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&auto=format&fit=crop&q=80", 8, [("Dark Chocolate", 0.08), ("Butter", 0.03), ("Sugar & Honey", 0.04)]),
            ("Mango Kulfi Traditional", "Desserts", 120.0, "Dense frozen milk dessert infused with Alphonso mango pulp and cardamom.", True, True, "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=80", 5, [("Fresh Cooking Cream", 0.06), ("Sugar & Honey", 0.03)]),
            ("Gajar Ka Halwa Sizzler", "Desserts", 160.0, "Caramelized red carrot pudding slow-simmered in whole milk, khoya, and golden cashews.", True, True, "https://images.unsplash.com/photo-1589119908995-c6837fa14d48?w=500&auto=format&fit=crop&q=80", 8, [("Pure Desi Ghee", 0.03), ("Sugar & Honey", 0.05)]),

            # Beverages (4)
            ("Signature Masala Chai", "Beverages", 50.0, "Slow-brewed Assam tea with crushed ginger, green cardamom, cloves, and whole milk.", True, True, "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80", 5, [("Tea Leaves & Spices", 0.02), ("Sugar & Honey", 0.02)]),
            ("Fresh Mint & Lime Mojito", "Beverages", 140.0, "Muddled fresh garden mint, Persian lime, cane sugar, topped with sparkling soda.", True, True, "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80", 5, [("Lemons & Mint Leaves", 0.08), ("Sugar & Honey", 0.03)]),
            ("Mango Lassi Chilled", "Beverages", 120.0, "Traditional probiotic yogurt smoothie whipped with ripe Alphonso mango and pistachios.", True, True, "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=80", 5, [("Fresh Cooking Cream", 0.05), ("Sugar & Honey", 0.03)]),
            ("Espresso Single Origin", "Beverages", 110.0, "Rich double-shot extraction with crema from highland roasted Arabica beans.", True, True, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80", 5, [("Espresso Coffee Beans", 0.03)])
        ]

        menu_items = []
        for name, cat, price, desc, veg, avail, img, ptime, recipes in menu_items_raw:
            mi = MenuItem(
                name=name,
                category=cat,
                price=price,
                description=desc,
                is_veg=veg,
                is_available=avail,
                image_url=img,
                preparation_time_minutes=ptime
            )
            db.add(mi)
            db.flush()

            for ing_name, qty in recipes:
                if ing_name in inv_items:
                    r_item = RecipeItem(
                        menu_item_id=mi.id,
                        inventory_item_id=inv_items[ing_name].id,
                        quantity_needed=qty
                    )
                    db.add(r_item)

            menu_items.append(mi)
        db.flush()

        # 7. 20 Customers
        customer_names = [
            ("Aarav Mehta", "+91 98200 30111", "aarav.mehta@gmail.com", "Vegetarian, prefers booth seating"),
            ("Priya Sharma", "+91 98200 30112", "priya.sharma@yahoo.com", "Birthday regular, loves spicy curries"),
            ("Michael Brown", "+91 98200 30113", "mbrown99@corp.com", "Business dinners, window seats"),
            ("Jennifer Davis", "+91 98200 30114", "jennifer.d@techco.org", "Gluten-conscious, prefers outdoor balcony"),
            ("Rohan Gupta", "+91 98200 30115", "rohan.g@outlook.com", "Weekly family dinner, requires high chair"),
            ("Sneha Joshi", "+91 98200 30116", "sneha.joshi@gmail.com", "Prefers less oil, loves Biryani"),
            ("Alexander Smith", "+91 98200 30117", "alex.smith@consulting.com", "VIP client, loves single-origin coffee"),
            ("Jessica Taylor", "+91 98200 30118", "jtaylor@designstudio.io", "Photographer, orders desserts often"),
            ("Kavita Nair", "+91 98200 30119", "kavita.nair@icloud.com", "Celebrated anniversary here"),
            ("Daniel Wilson", "+91 98200 30120", "dwilson@financelink.net", "Corporate lunch account"),
            ("Anand Deshmukh", "+91 98200 30121", "anand.d@gmail.com", "Regular lunch guest"),
            ("Fatima Al-Mansoor", "+91 98200 30122", "fatima.m@domain.ae", "Halal preferred, large family table"),
            ("Christopher White", "+91 98200 30123", "cwhite@mediaworks.com", "Quick table near exit"),
            ("Meera Iyer", "+91 98200 30124", "meera.iyer@gmail.com", "Loves Paneer Tikka"),
            ("Robert Taylor", "+91 98200 30125", "rtaylor@logistics.com", "Weekend dinner regular"),
            ("Sunita Sen", "+91 98200 30126", "sunita.sen@univ.edu", "Faculty dinners"),
            ("William Clark", "+91 98200 30127", "wclark@investors.com", "Prefers quiet corner table"),
            ("Deepak Malhotra", "+91 98200 30128", "deepak.m@gmail.com", "Loves Butter Chicken and Garlic Naan"),
            ("Olivia Martinez", "+91 98200 30129", "omartinez@artgallery.com", "Wine & dine guest"),
            ("Rajesh Pillai", "+91 98200 30130", "rajesh.pillai@techstart.io", "Team celebration dinners")
        ]

        customers = []
        for name, phone, email, notes in customer_names:
            c = Customer(
                name=name,
                phone=phone,
                email=email,
                notes=notes,
                created_at=datetime.utcnow() - timedelta(days=random.randint(15, 60))
            )
            db.add(c)
            customers.append(c)
        db.flush()

        # 8. Sample Past Orders & Bills (over the last 7 days to populate analytics and revenue charts)
        now = datetime.utcnow()
        waiter_list = [users["waiter"], users["waiter2"], users["waiter3"]]

        order_seq = 100
        for day_offset in range(6, -1, -1):
            day_date = now - timedelta(days=day_offset)
            daily_count = random.randint(4, 8) if day_offset > 0 else 6
            for _ in range(daily_count):
                order_seq += 1
                cust = random.choice(customers)
                waiter = random.choice(waiter_list)
                tbl = random.choice(tables[:12])
                hour = random.randint(11, 21)
                minute = random.randint(5, 55)
                order_dt = datetime(day_date.year, day_date.month, day_date.day, hour, minute)

                selected_items = random.sample(menu_items, random.randint(2, 5))
                subtotal = 0.0

                order = Order(
                    order_number=f"ORD-{order_dt.strftime('%Y%m%d')}-{order_seq:04d}",
                    table_id=tbl.id,
                    customer_id=cust.id,
                    waiter_id=waiter.id,
                    order_type="dine_in",
                    status="completed",
                    special_instructions="Mild spicy, well prepared" if random.random() > 0.6 else None,
                    order_time=order_dt,
                    preparing_time=order_dt + timedelta(minutes=5),
                    ready_time=order_dt + timedelta(minutes=18),
                    served_time=order_dt + timedelta(minutes=22),
                    completed_time=order_dt + timedelta(minutes=55)
                )
                db.add(order)
                db.flush()

                for m in selected_items:
                    qty = random.randint(1, 2)
                    total_p = round(m.price * qty, 2)
                    subtotal += total_p
                    oi = OrderItem(
                        order_id=order.id,
                        menu_item_id=m.id,
                        item_name=m.name,
                        quantity=qty,
                        unit_price=m.price,
                        total_price=total_p,
                        status="served"
                    )
                    db.add(oi)

                discount_amount = round(subtotal * 0.1, 2) if random.random() > 0.7 else 0.0
                tax_amount = round((subtotal - discount_amount) * 0.05, 2)
                final_amt = round(subtotal - discount_amount + tax_amount, 2)

                order.subtotal = round(subtotal, 2)
                order.discount_amount = discount_amount
                order.tax_amount = tax_amount
                order.final_amount = final_amt

                # Create Bill
                pmethod = random.choice(["upi", "card", "cash", "upi", "card"])
                bill = Bill(
                    order_id=order.id,
                    bill_number=f"INV-{order_dt.strftime('%Y%m%d')}-{order_seq:04d}",
                    subtotal=round(subtotal, 2),
                    discount_type="fixed",
                    discount_value=discount_amount,
                    discount_amount=discount_amount,
                    tax_rate=5.0,
                    tax_amount=tax_amount,
                    service_charge=0.0,
                    final_amount=final_amt,
                    payment_method=pmethod,
                    payment_status="paid",
                    payment_reference=f"UPI-{random.randint(100000, 999999)}",
                    cashier_id=users["cashier"].id,
                    paid_at=order.completed_time,
                    created_at=order.completed_time
                )
                db.add(bill)

                # Update customer stats
                cust.total_orders = (cust.total_orders or 0) + 1
                cust.total_spent = round((cust.total_spent or 0.0) + final_amt, 2)
                cust.last_visit = order_dt

        # 9. Active Real-Time Orders for Today
        # Table T-03: Occupied, Order status 'preparing'
        t3 = tables[2]
        t3.status = "occupied"
        t3.assigned_waiter_id = users["waiter"].id
        o1 = Order(
            order_number=f"ORD-{now.strftime('%Y%m%d')}-0901",
            table_id=t3.id,
            customer_id=customers[0].id,
            waiter_id=users["waiter"].id,
            order_type="dine_in",
            status="preparing",
            special_instructions="Extra butter on naan, no cilantro on dal",
            order_time=now - timedelta(minutes=14),
            preparing_time=now - timedelta(minutes=10),
            subtotal=890.0,
            tax_amount=44.50,
            discount_amount=0.0,
            final_amount=934.50
        )
        db.add(o1)
        db.flush()
        t3.current_order_id = o1.id
        db.add(OrderItem(order_id=o1.id, menu_item_id=menu_items[8].id, item_name=menu_items[8].name, quantity=1, unit_price=450.0, total_price=450.0, status="preparing"))
        db.add(OrderItem(order_id=o1.id, menu_item_id=menu_items[10].id, item_name=menu_items[10].name, quantity=1, unit_price=290.0, total_price=290.0, status="preparing"))
        db.add(OrderItem(order_id=o1.id, menu_item_id=menu_items[26].id, item_name=menu_items[26].name, quantity=2, unit_price=75.0, total_price=150.0, status="preparing"))

        # Table T-05: Occupied, Order status 'ready'
        t5 = tables[4]
        t5.status = "occupied"
        t5.assigned_waiter_id = users["waiter2"].id
        o2 = Order(
            order_number=f"ORD-{now.strftime('%Y%m%d')}-0902",
            table_id=t5.id,
            customer_id=customers[1].id,
            waiter_id=users["waiter2"].id,
            order_type="dine_in",
            status="ready",
            special_instructions="Serve starters immediately",
            order_time=now - timedelta(minutes=22),
            preparing_time=now - timedelta(minutes=18),
            ready_time=now - timedelta(minutes=3),
            subtotal=1450.0,
            tax_amount=72.50,
            discount_amount=0.0,
            final_amount=1522.50
        )
        db.add(o2)
        db.flush()
        t5.current_order_id = o2.id
        db.add(OrderItem(order_id=o2.id, menu_item_id=menu_items[0].id, item_name=menu_items[0].name, quantity=2, unit_price=320.0, total_price=640.0, status="ready"))
        db.add(OrderItem(order_id=o2.id, menu_item_id=menu_items[18].id, item_name=menu_items[18].name, quantity=2, unit_price=380.0, total_price=760.0, status="ready"))
        db.add(OrderItem(order_id=o2.id, menu_item_id=menu_items[38].id, item_name=menu_items[38].name, quantity=1, unit_price=50.0, total_price=50.0, status="ready"))

        # Table T-08: Occupied, Order status 'served' (Ready for Checkout / Billing!)
        t8 = tables[7]
        t8.status = "occupied"
        t8.assigned_waiter_id = users["waiter3"].id
        o3 = Order(
            order_number=f"ORD-{now.strftime('%Y%m%d')}-0903",
            table_id=t8.id,
            customer_id=customers[2].id,
            waiter_id=users["waiter3"].id,
            order_type="dine_in",
            status="served",
            special_instructions="Customer requested separate beverage billing check",
            order_time=now - timedelta(minutes=45),
            preparing_time=now - timedelta(minutes=40),
            ready_time=now - timedelta(minutes=25),
            served_time=now - timedelta(minutes=20),
            subtotal=1185.0,
            tax_amount=56.75,
            discount_amount=50.0,
            final_amount=1191.75
        )
        db.add(o3)
        db.flush()
        t8.current_order_id = o3.id
        db.add(OrderItem(order_id=o3.id, menu_item_id=menu_items[1].id, item_name=menu_items[1].name, quantity=1, unit_price=380.0, total_price=380.0, status="served"))
        db.add(OrderItem(order_id=o3.id, menu_item_id=menu_items[9].id, item_name=menu_items[9].name, quantity=1, unit_price=360.0, total_price=360.0, status="served"))
        db.add(OrderItem(order_id=o3.id, menu_item_id=menu_items[26].id, item_name=menu_items[26].name, quantity=3, unit_price=75.0, total_price=225.0, status="served"))
        db.add(OrderItem(order_id=o3.id, menu_item_id=menu_items[33].id, item_name=menu_items[33].name, quantity=1, unit_price=220.0, total_price=220.0, status="served"))

        # Pre-create pending bill for Table 8
        bill_t8 = Bill(
            order_id=o3.id,
            bill_number=f"INV-{now.strftime('%Y%m%d')}-0903",
            subtotal=1185.0,
            discount_type="fixed",
            discount_value=50.0,
            discount_amount=50.0,
            tax_rate=5.0,
            tax_amount=56.75,
            service_charge=0.0,
            final_amount=1191.75,
            payment_method="upi",
            payment_status="pending",
            created_at=now - timedelta(minutes=15)
        )
        db.add(bill_t8)

        # Table T-10: Cleaning
        tables[9].status = "cleaning"

        # Table T-11: Reserved
        tables[10].status = "reserved"

        # 10. Sample Reservations
        today_str = now.strftime("%Y-%m-%d")
        tomorrow_str = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        reservations_data = [
            (customers[3].id, customers[3].name, customers[3].phone, tables[10].id, today_str, "19:30", 4, "confirmed", "Anniversary dinner, window view requested"),
            (customers[4].id, customers[4].name, customers[4].phone, tables[11].id, today_str, "20:00", 6, "confirmed", "Corporate team dinner"),
            (customers[5].id, customers[5].name, customers[5].phone, tables[13].id, tomorrow_str, "19:00", 8, "confirmed", "Private dining birthday celebration"),
            (customers[6].id, customers[6].name, customers[6].phone, tables[0].id, tomorrow_str, "13:00", 2, "pending", "Lunch meeting"),
            (customers[7].id, customers[7].name, customers[7].phone, tables[6].id, tomorrow_str, "20:30", 8, "confirmed", "Family reunion"),
        ]

        for cid, cname, cphone, tid, rdate, rtime, guests, rstatus, rnotes in reservations_data:
            res = Reservation(
                customer_id=cid,
                customer_name=cname,
                customer_phone=cphone,
                table_id=tid,
                reservation_date=rdate,
                reservation_time=rtime,
                guest_count=guests,
                status=rstatus,
                notes=rnotes
            )
            db.add(res)

        # 11. Initial Notifications
        initial_notifs = [
            ("Order Ready: ORD-0902", "Order for Table T-05 is ready for pick-up!", "kitchen", str(o2.id), False),
            ("Low Stock: Tomato", "Tomato – 3 kg remaining – Low Stock (Min: 5 kg)", "inventory", str(inv_items["Tomato"].id), False),
            ("Low Stock: Bell Pepper", "Bell Pepper – 2.5 kg remaining – Low Stock (Min: 4 kg)", "inventory", str(inv_items["Bell Pepper (Capsicum)"].id), False),
            ("Low Stock: Butter", "Butter – 2 kg remaining – Low Stock (Min: 3.5 kg)", "inventory", str(inv_items["Butter"].id), False),
            ("New Reservation: Table T-11", "Jennifer Davis reserved Table T-11 for 4 guests tonight at 19:30", "reservation", None, False),
            ("Bill Generated: Table T-08", "Bill INV-0903 for Table T-08 is pending checkout (₹1191.75)", "billing", str(bill_t8.id), False),
        ]
        for title, msg, ntype, ref, is_read in initial_notifs:
            db.add(Notification(
                title=title,
                message=msg,
                type=ntype,
                reference_id=ref,
                is_read=is_read,
                created_at=now - timedelta(minutes=random.randint(5, 60))
            ))

        db.commit()
        print("DineFlow database successfully seeded with INR!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force_reset=True)
