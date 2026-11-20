from flask import Blueprint, request, jsonify, g
from datetime import datetime
from sqlalchemy import desc
from ..database import SessionLocal
from ..models import Order, OrderItem, Table, MenuItem, Customer, Bill, Notification
from ..auth_helper import require_auth
from ..inventory_service import deduct_inventory_for_order

orders_bp = Blueprint("orders", __name__)

def generate_order_number(db):
    today_str = datetime.utcnow().strftime("%Y%m%d")
    count = db.query(Order).filter(Order.order_number.like(f"ORD-{today_str}-%")).count()
    return f"ORD-{today_str}-{(count + 1):04d}"

@orders_bp.route("", methods=["GET"])
@require_auth
def get_orders():
    status = request.args.get("status", "").strip().lower()
    table_id = request.args.get("table_id")
    search = request.args.get("search", "").strip()

    db = SessionLocal()
    try:
        query = db.query(Order)
        if status and status != "all":
            query = query.filter(Order.status == status)
        if table_id:
            query = query.filter(Order.table_id == int(table_id))
        if search:
            query = query.filter(
                (Order.order_number.ilike(f"%{search}%")) |
                (Order.customer.has(Customer.name.ilike(f"%{search}%")))
            )

        orders = query.order_by(desc(Order.order_time)).all()
        return jsonify([order.to_dict() for order in orders])
    finally:
        db.close()

@orders_bp.route("/<int:order_id>", methods=["GET"])
@require_auth
def get_order_detail(order_id):
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return jsonify({"error": "Order not found"}), 404
        return jsonify(order.to_dict())
    finally:
        db.close()

@orders_bp.route("", methods=["POST"])
@require_auth
def create_order():
    data = request.get_json() or {}
    table_id = data.get("table_id")
    customer_id = data.get("customer_id")
    customer_name = data.get("customer_name", "").strip()
    customer_phone = data.get("customer_phone", "").strip()
    order_type = data.get("order_type", "dine_in")
    items_data = data.get("items", [])
    discount_amount = float(data.get("discount_amount", 0.0))
    special_instructions = data.get("special_instructions", "").strip()

    if not items_data:
        return jsonify({"error": "Order must contain at least one item"}), 400

    db = SessionLocal()
    try:
        # Resolve customer if provided
        customer = None
        if customer_id:
            customer = db.query(Customer).filter(Customer.id == customer_id).first()
        elif customer_phone:
            customer = db.query(Customer).filter(Customer.phone == customer_phone).first()
            if not customer and customer_name:
                customer = Customer(name=customer_name, phone=customer_phone)
                db.add(customer)
                db.flush()

        # Resolve table
        table = None
        if table_id:
            table = db.query(Table).filter(Table.id == table_id).first()
            if not table:
                return jsonify({"error": "Selected table does not exist"}), 400

        order_num = generate_order_number(db)
        order = Order(
            order_number=order_num,
            table_id=table.id if table else None,
            customer_id=customer.id if customer else None,
            waiter_id=g.current_user.id if hasattr(g, "current_user") and g.current_user else None,
            order_type=order_type,
            status="new",
            special_instructions=special_instructions,
            order_time=datetime.utcnow()
        )
        db.add(order)
        db.flush()

        subtotal = 0.0
        for item_data in items_data:
            menu_id = item_data.get("menu_item_id")
            qty = int(item_data.get("quantity", 1))
            notes = item_data.get("notes", "")

            menu_item = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
            if not menu_item:
                continue

            item_total = menu_item.price * qty
            subtotal += item_total

            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=menu_item.id,
                item_name=menu_item.name,
                quantity=qty,
                unit_price=menu_item.price,
                total_price=item_total,
                notes=notes,
                status="new"
            )
            db.add(order_item)

        # Tax calculation (5% standard restaurant tax)
        tax_amount = round((subtotal - discount_amount) * 0.05, 2)
        if tax_amount < 0:
            tax_amount = 0.0
        final_amount = round(subtotal - discount_amount + tax_amount, 2)

        order.subtotal = round(subtotal, 2)
        order.discount_amount = discount_amount
        order.tax_amount = tax_amount
        order.final_amount = final_amount

        # Update table status to occupied if dine-in
        if table:
            table.status = "occupied"
            table.current_order_id = order.id

        # Send Kitchen notification
        table_label = f"Table {table.number}" if table else "Takeaway"
        notif = Notification(
            title=f"New Order #{order.order_number}",
            message=f"New order for {table_label} with {len(items_data)} items placed.",
            type="order",
            reference_id=str(order.id)
        )
        db.add(notif)

        db.commit()
        db.refresh(order)
        return jsonify(order.to_dict()), 201
    finally:
        db.close()

@orders_bp.route("/<int:order_id>/status", methods=["PUT"])
@require_auth
def update_order_status(order_id):
    data = request.get_json() or {}
    new_status = data.get("status", "").strip().lower()
    valid_statuses = ["new", "confirmed", "preparing", "ready", "served", "completed", "cancelled"]

    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Choose from: {', '.join(valid_statuses)}"}), 400

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return jsonify({"error": "Order not found"}), 404

        old_status = order.status
        order.status = new_status
        now = datetime.utcnow()

        if new_status == "preparing" and not order.preparing_time:
            order.preparing_time = now
        elif new_status == "ready" and not order.ready_time:
            order.ready_time = now
            # Notification for Waiter
            table_label = f"Table {order.table.number}" if order.table else "Takeaway"
            notif = Notification(
                title=f"Order Ready: {order.order_number}",
                message=f"Order {order.order_number} for {table_label} is ready to be served!",
                type="kitchen",
                reference_id=str(order.id)
            )
            db.add(notif)
        elif new_status == "served" and not order.served_time:
            order.served_time = now
            # Deduct inventory when order is served (if not yet deducted)
            actor = g.current_user.full_name if hasattr(g, "current_user") and g.current_user else "Kitchen/Staff"
            deduct_inventory_for_order(db, order, actor_name=actor)
        elif new_status == "completed":
            order.completed_time = now
            # If inventory was not deducted earlier, deduct now
            if not order.served_time:
                actor = g.current_user.full_name if hasattr(g, "current_user") and g.current_user else "Cashier"
                deduct_inventory_for_order(db, order, actor_name=actor)
            # Free up table if dine in
            if order.table:
                order.table.status = "available"
                order.table.current_order_id = None
        elif new_status == "cancelled":
            if order.table and order.table.current_order_id == order.id:
                order.table.status = "available"
                order.table.current_order_id = None
            notif = Notification(
                title=f"Order Cancelled: {order.order_number}",
                message=f"Order {order.order_number} was cancelled.",
                type="order",
                reference_id=str(order.id)
            )
            db.add(notif)

        db.commit()
        db.refresh(order)
        return jsonify(order.to_dict())
    finally:
        db.close()

@orders_bp.route("/<int:order_id>/add-items", methods=["POST"])
@require_auth
def add_items_to_order(order_id):
    data = request.get_json() or {}
    items_data = data.get("items", [])

    if not items_data:
        return jsonify({"error": "No items provided"}), 400

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return jsonify({"error": "Order not found"}), 404

        if order.status in ["completed", "cancelled"]:
            return jsonify({"error": f"Cannot add items to a {order.status} order"}), 400

        added_subtotal = 0.0
        for item_data in items_data:
            menu_id = item_data.get("menu_item_id")
            qty = int(item_data.get("quantity", 1))
            notes = item_data.get("notes", "")

            menu_item = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
            if not menu_item:
                continue

            item_total = menu_item.price * qty
            added_subtotal += item_total

            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=menu_item.id,
                item_name=menu_item.name,
                quantity=qty,
                unit_price=menu_item.price,
                total_price=item_total,
                notes=notes,
                status="new"
            )
            db.add(order_item)

        order.subtotal = round(order.subtotal + added_subtotal, 2)
        order.tax_amount = round((order.subtotal - order.discount_amount) * 0.05, 2)
        order.final_amount = round(order.subtotal - order.discount_amount + order.tax_amount, 2)

        # Notify kitchen of additional items
        table_label = f"Table {order.table.number}" if order.table else "Takeaway"
        notif = Notification(
            title=f"Items Added to #{order.order_number}",
            message=f"Additional items sent to kitchen for {table_label}.",
            type="order",
            reference_id=str(order.id)
        )
        db.add(notif)

        db.commit()
        db.refresh(order)
        return jsonify(order.to_dict())
    finally:
        db.close()
