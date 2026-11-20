from flask import Blueprint, request, jsonify, g
from datetime import datetime
from ..database import SessionLocal
from ..models import Order, Notification
from ..auth_helper import require_auth
from ..inventory_service import deduct_inventory_for_order

kitchen_bp = Blueprint("kitchen", __name__)

@kitchen_bp.route("/orders", methods=["GET"])
@require_auth
def get_kitchen_orders():
    """
    Returns active orders for the Kitchen Display System (KDS):
    Statuses: new, confirmed, preparing, ready, served.
    Calculates waiting time in minutes and flag for late orders.
    """
    db = SessionLocal()
    try:
        active_orders = db.query(Order).filter(
            Order.status.in_(["new", "confirmed", "preparing", "ready", "served"])
        ).order_by(Order.order_time.asc()).all()

        now = datetime.utcnow()
        result = []
        for o in active_orders:
            order_data = o.to_dict()
            # Calculate elapsed minutes
            elapsed_minutes = 0
            if o.order_time:
                diff = now - o.order_time
                elapsed_minutes = int(diff.total_seconds() / 60)
            
            order_data["elapsed_minutes"] = elapsed_minutes
            order_data["is_delayed"] = elapsed_minutes >= 20  # Highlight delayed orders
            order_data["is_warning"] = 12 <= elapsed_minutes < 20
            result.append(order_data)

        return jsonify(result)
    finally:
        db.close()

@kitchen_bp.route("/orders/<int:order_id>/status", methods=["POST"])
@require_auth
def update_kitchen_order_status(order_id):
    data = request.get_json() or {}
    new_status = data.get("status", "").strip().lower()
    valid_kitchen_statuses = ["new", "preparing", "ready", "served"]

    if new_status not in valid_kitchen_statuses:
        return jsonify({"error": f"Invalid kitchen status. Choose from: {', '.join(valid_kitchen_statuses)}"}), 400

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return jsonify({"error": "Order not found"}), 404

        order.status = new_status
        now = datetime.utcnow()

        if new_status == "preparing":
            order.preparing_time = now
        elif new_status == "ready":
            order.ready_time = now
            table_str = f"Table {order.table.number}" if order.table else "Takeaway"
            notif = Notification(
                title=f"Order Ready: {order.order_number}",
                message=f"Order {order.order_number} for {table_str} is ready for pick-up!",
                type="kitchen",
                reference_id=str(order.id)
            )
            db.add(notif)
        elif new_status == "served":
            order.served_time = now
            actor = g.current_user.full_name if hasattr(g, "current_user") and g.current_user else "Chef"
            deduct_inventory_for_order(db, order, actor_name=actor)

        db.commit()
        db.refresh(order)
        return jsonify(order.to_dict())
    finally:
        db.close()
