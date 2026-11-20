from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from sqlalchemy import func, desc
from ..database import SessionLocal
from ..models import Order, OrderItem, Table, InventoryItem, Bill, MenuItem
from ..auth_helper import require_auth

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/stats", methods=["GET"])
@require_auth
def get_dashboard_stats():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)
        
        # Today's orders
        today_orders = db.query(Order).filter(Order.order_time >= today_start).all()
        today_orders_count = len(today_orders)
        
        # Today's sales (from paid bills or completed orders today)
        today_bills = db.query(Bill).filter(
            Bill.created_at >= today_start,
            Bill.payment_status == "paid"
        ).all()
        today_sales = sum(b.final_amount for b in today_bills)

        # Pending orders (new, confirmed, preparing, ready, served)
        pending_orders_count = db.query(Order).filter(
            Order.status.in_(["new", "confirmed", "preparing", "ready", "served"])
        ).count()

        # Completed orders today
        completed_orders_count = db.query(Order).filter(
            Order.status == "completed",
            Order.order_time >= today_start
        ).count()

        # Table stats
        total_tables = db.query(Table).count()
        available_tables = db.query(Table).filter(Table.status == "available").count()
        occupied_tables = db.query(Table).filter(Table.status == "occupied").count()
        reserved_tables = db.query(Table).filter(Table.status == "reserved").count()
        cleaning_tables = db.query(Table).filter(Table.status == "cleaning").count()

        # Low stock ingredients
        low_stock_items = db.query(InventoryItem).filter(
            InventoryItem.current_stock <= InventoryItem.min_stock
        ).all()
        low_stock_count = len(low_stock_items)

        # Top-selling menu items
        top_items_query = db.query(
            OrderItem.item_name,
            func.sum(OrderItem.quantity).label("total_qty"),
            func.sum(OrderItem.total_price).label("total_revenue")
        ).join(Order).filter(
            Order.status != "cancelled"
        ).group_by(
            OrderItem.item_name
        ).order_by(
            desc("total_qty")
        ).limit(5).all()

        top_selling = [
            {
                "name": row[0],
                "quantity": int(row[1] or 0),
                "revenue": round(float(row[2] or 0), 2)
            }
            for row in top_items_query
        ]

        # Weekly sales chart (last 7 days)
        weekly_sales = []
        for i in range(6, -1, -1):
            day_date = (now - timedelta(days=i)).date()
            day_start = datetime(day_date.year, day_date.month, day_date.day)
            day_end = day_start + timedelta(days=1)
            
            day_bills = db.query(Bill).filter(
                Bill.created_at >= day_start,
                Bill.created_at < day_end,
                Bill.payment_status == "paid"
            ).all()
            
            day_orders = db.query(Order).filter(
                Order.order_time >= day_start,
                Order.order_time < day_end,
                Order.status != "cancelled"
            ).count()

            sales_sum = sum(b.final_amount for b in day_bills)
            weekly_sales.append({
                "date": day_date.strftime("%b %d"),
                "sales": round(sales_sum, 2),
                "orders": day_orders
            })

        # Daily revenue chart (hourly intervals for today)
        daily_revenue = []
        # Group today into 2-hour blocks from 10:00 to 22:00
        for hour in range(10, 23, 2):
            h_start = datetime(now.year, now.month, now.day, hour, 0, 0)
            h_end = h_start + timedelta(hours=2)
            h_bills = db.query(Bill).filter(
                Bill.created_at >= h_start,
                Bill.created_at < h_end,
                Bill.payment_status == "paid"
            ).all()
            daily_revenue.append({
                "time": f"{hour:02d}:00",
                "revenue": round(sum(b.final_amount for b in h_bills), 2)
            })

        # Recent orders (last 8 orders)
        recent_orders = db.query(Order).order_by(desc(Order.order_time)).limit(8).all()

        return jsonify({
            "today_sales": round(today_sales, 2),
            "today_orders": today_orders_count,
            "pending_orders": pending_orders_count,
            "completed_orders": completed_orders_count,
            "total_tables": total_tables,
            "available_tables": available_tables,
            "occupied_tables": occupied_tables,
            "reserved_tables": reserved_tables,
            "cleaning_tables": cleaning_tables,
            "low_stock_count": low_stock_count,
            "low_stock_items": [item.to_dict() for item in low_stock_items[:5]],
            "top_selling": top_selling,
            "weekly_sales": weekly_sales,
            "daily_revenue": daily_revenue,
            "recent_orders": [order.to_dict() for order in recent_orders]
        })
    finally:
        db.close()
