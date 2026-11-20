from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func, desc, asc
from ..database import SessionLocal
from ..models import Bill, Order, OrderItem, MenuItem, InventoryItem, StockMovement
from ..auth_helper import require_auth, require_roles

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/analytics", methods=["GET"])
@require_auth
def get_analytics():
    range_type = request.args.get("range", "7d").lower()  # today, 7d, 30d, 90d, year, all
    start_str = request.args.get("start_date")
    end_str = request.args.get("end_date")

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        if start_str and end_str:
            try:
                start_date = datetime.strptime(start_str, "%Y-%m-%d")
                end_date = datetime.strptime(end_str, "%Y-%m-%d") + timedelta(days=1)
            except Exception:
                start_date = now - timedelta(days=7)
                end_date = now
        elif range_type == "today":
            start_date = datetime(now.year, now.month, now.day)
            end_date = start_date + timedelta(days=1)
        elif range_type == "30d":
            start_date = now - timedelta(days=30)
            end_date = now
        elif range_type == "90d":
            start_date = now - timedelta(days=90)
            end_date = now
        elif range_type == "year":
            start_date = now - timedelta(days=365)
            end_date = now
        else:  # default 7d
            start_date = now - timedelta(days=7)
            end_date = now

        # Filtered paid bills
        paid_bills = db.query(Bill).filter(
            Bill.created_at >= start_date,
            Bill.created_at <= end_date,
            Bill.payment_status == "paid"
        ).all()

        total_sales = sum(b.final_amount for b in paid_bills)
        total_bills_count = len(paid_bills)
        avg_order_value = (total_sales / total_bills_count) if total_bills_count > 0 else 0.0

        # Filtered orders count
        total_orders_count = db.query(Order).filter(
            Order.order_time >= start_date,
            Order.order_time <= end_date,
            Order.status != "cancelled"
        ).count()

        # Sales timeline (grouped by day)
        days_span = max(1, (end_date - start_date).days)
        sales_timeline = []
        for i in range(days_span):
            cur_day = start_date + timedelta(days=i)
            next_day = cur_day + timedelta(days=1)
            day_bills = [b for b in paid_bills if cur_day <= b.created_at < next_day]
            day_sales = sum(b.final_amount for b in day_bills)
            sales_timeline.append({
                "date": cur_day.strftime("%b %d"),
                "sales": round(day_sales, 2),
                "orders": len(day_bills)
            })

        # Sales by Category
        category_query = db.query(
            MenuItem.category,
            func.sum(OrderItem.total_price).label("category_sales"),
            func.sum(OrderItem.quantity).label("category_quantity")
        ).join(
            OrderItem, OrderItem.menu_item_id == MenuItem.id
        ).join(
            Order, Order.id == OrderItem.order_id
        ).filter(
            Order.order_time >= start_date,
            Order.order_time <= end_date,
            Order.status != "cancelled"
        ).group_by(MenuItem.category).all()

        sales_by_category = [
            {
                "category": row[0],
                "sales": round(float(row[1] or 0), 2),
                "quantity": int(row[2] or 0)
            }
            for row in category_query
        ]

        # Payment Methods breakdown
        payment_methods = {"cash": 0.0, "card": 0.0, "upi": 0.0}
        for b in paid_bills:
            m = (b.payment_method or "cash").lower()
            if m in payment_methods:
                payment_methods[m] += b.final_amount
            else:
                payment_methods[m] = b.final_amount

        payment_breakdown = [
            {"method": k.upper(), "amount": round(v, 2)}
            for k, v in payment_methods.items()
        ]

        # Peak business hours (0-23 hours distribution)
        hour_buckets = {h: {"orders": 0, "sales": 0.0} for h in range(10, 23)}
        for b in paid_bills:
            h = b.created_at.hour
            if h in hour_buckets:
                hour_buckets[h]["orders"] += 1
                hour_buckets[h]["sales"] += b.final_amount

        peak_hours = [
            {
                "hour": f"{h:02d}:00",
                "orders": v["orders"],
                "sales": round(v["sales"], 2)
            }
            for h, v in sorted(hour_buckets.items())
        ]

        # Best-selling & Least-selling items
        items_sales_query = db.query(
            OrderItem.item_name,
            func.sum(OrderItem.quantity).label("total_qty"),
            func.sum(OrderItem.total_price).label("total_sales")
        ).join(
            Order, Order.id == OrderItem.order_id
        ).filter(
            Order.order_time >= start_date,
            Order.order_time <= end_date,
            Order.status != "cancelled"
        ).group_by(OrderItem.item_name)

        best_selling = [
            {"name": r[0], "quantity": int(r[1] or 0), "sales": round(float(r[2] or 0), 2)}
            for r in items_sales_query.order_by(desc("total_qty")).limit(5).all()
        ]

        least_selling = [
            {"name": r[0], "quantity": int(r[1] or 0), "sales": round(float(r[2] or 0), 2)}
            for r in items_sales_query.order_by(asc("total_qty")).limit(5).all()
        ]

        # Inventory usage (from stock movements)
        usage_query = db.query(
            InventoryItem.name,
            InventoryItem.unit,
            func.sum(func.abs(StockMovement.quantity)).label("used_qty")
        ).join(
            StockMovement, StockMovement.inventory_item_id == InventoryItem.id
        ).filter(
            StockMovement.created_at >= start_date,
            StockMovement.created_at <= end_date,
            StockMovement.change_type.in_(["order_deduction", "waste", "usage"])
        ).group_by(InventoryItem.name, InventoryItem.unit).order_by(desc("used_qty")).limit(10).all()

        inventory_usage = [
            {"ingredient": r[0], "unit": r[1], "quantity": round(float(r[2] or 0), 2)}
            for r in usage_query
        ]

        return jsonify({
            "total_sales": round(total_sales, 2),
            "total_orders": total_orders_count,
            "average_order_value": round(avg_order_value, 2),
            "sales_timeline": sales_timeline,
            "sales_by_category": sales_by_category,
            "payment_breakdown": payment_breakdown,
            "peak_hours": peak_hours,
            "best_selling": best_selling,
            "least_selling": least_selling,
            "inventory_usage": inventory_usage
        })
    finally:
        db.close()
