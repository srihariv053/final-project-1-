from flask import Blueprint, request, jsonify, g
from datetime import datetime
from sqlalchemy import desc
from ..database import SessionLocal
from ..models import Bill, Order, Customer, Table, Notification, RestaurantSetting
from ..auth_helper import require_auth
from ..inventory_service import deduct_inventory_for_order

billing_bp = Blueprint("billing", __name__)

def generate_bill_number(db):
    today_str = datetime.utcnow().strftime("%Y%m%d")
    count = db.query(Bill).filter(Bill.bill_number.like(f"INV-{today_str}-%")).count()
    return f"INV-{today_str}-{(count + 1):04d}"

@billing_bp.route("/bills", methods=["GET"])
@require_auth
def get_bills():
    status = request.args.get("status", "").strip().lower()
    method = request.args.get("method", "").strip().lower()
    search = request.args.get("search", "").strip()

    db = SessionLocal()
    try:
        query = db.query(Bill).join(Order)
        if status and status != "all":
            query = query.filter(Bill.payment_status == status)
        if method and method != "all":
            query = query.filter(Bill.payment_method == method)
        if search:
            query = query.filter(
                (Bill.bill_number.ilike(f"%{search}%")) |
                (Order.order_number.ilike(f"%{search}%"))
            )

        bills = query.order_by(desc(Bill.created_at)).all()
        return jsonify([b.to_dict() for b in bills])
    finally:
        db.close()

@billing_bp.route("/orders-pending", methods=["GET"])
@require_auth
def get_pending_billing_orders():
    """
    Returns active orders eligible for billing/checkout (statuses: served, ready, preparing, new)
    which do not have a paid bill yet.
    """
    db = SessionLocal()
    try:
        orders = db.query(Order).filter(
            Order.status.in_(["served", "ready", "preparing", "confirmed", "new"])
        ).order_by(desc(Order.order_time)).all()

        eligible = []
        for o in orders:
            # Check if bill already paid
            if o.bill and o.bill.payment_status == "paid":
                continue
            eligible.append(o.to_dict())

        return jsonify(eligible)
    finally:
        db.close()

@billing_bp.route("/bills/<int:bill_id>", methods=["GET"])
@require_auth
def get_bill_detail(bill_id):
    db = SessionLocal()
    try:
        bill = db.query(Bill).filter(Bill.id == bill_id).first()
        if not bill:
            return jsonify({"error": "Bill not found"}), 404
        return jsonify(bill.to_dict())
    finally:
        db.close()

@billing_bp.route("/generate", methods=["POST"])
@require_auth
def generate_bill():
    data = request.get_json() or {}
    order_id = data.get("order_id")
    discount_type = data.get("discount_type", "fixed")  # percentage, fixed
    discount_val = float(data.get("discount_value", 0.0))
    tax_rate = float(data.get("tax_rate", 5.0))  # standard 5%
    service_charge_percent = float(data.get("service_charge_percent", 0.0))

    if not order_id:
        return jsonify({"error": "order_id is required"}), 400

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return jsonify({"error": "Order not found"}), 404

        # Calculate subtotal from items
        subtotal = sum(item.total_price for item in order.items)
        if discount_type == "percentage":
            discount_amount = round(subtotal * (discount_val / 100.0), 2)
        else:
            discount_amount = round(discount_val, 2)
        discount_amount = min(discount_amount, subtotal)

        taxable = subtotal - discount_amount
        tax_amount = round(taxable * (tax_rate / 100.0), 2)
        service_charge = round(taxable * (service_charge_percent / 100.0), 2) if service_charge_percent > 0 else 0.0
        final_amount = round(taxable + tax_amount + service_charge, 2)

        # Check if existing bill exists
        bill = db.query(Bill).filter(Bill.order_id == order.id).first()
        if not bill:
            bill_num = generate_bill_number(db)
            bill = Bill(
                order_id=order.id,
                bill_number=bill_num,
                subtotal=subtotal,
                discount_type=discount_type,
                discount_value=discount_val,
                discount_amount=discount_amount,
                tax_rate=tax_rate,
                tax_amount=tax_amount,
                service_charge=service_charge,
                final_amount=final_amount,
                payment_method="cash",
                payment_status="pending"
            )
            db.add(bill)
        else:
            bill.subtotal = subtotal
            bill.discount_type = discount_type
            bill.discount_value = discount_val
            bill.discount_amount = discount_amount
            bill.tax_rate = tax_rate
            bill.tax_amount = tax_amount
            bill.service_charge = service_charge
            bill.final_amount = final_amount

        # Update order amounts
        order.subtotal = subtotal
        order.discount_amount = discount_amount
        order.tax_amount = tax_amount
        order.final_amount = final_amount

        db.commit()
        db.refresh(bill)
        return jsonify(bill.to_dict())
    finally:
        db.close()

@billing_bp.route("/<int:bill_id>/pay", methods=["POST"])
@require_auth
def process_payment(bill_id):
    data = request.get_json() or {}
    payment_method = data.get("payment_method", "cash").strip().lower()  # cash, card, upi
    payment_reference = data.get("payment_reference", "").strip()

    valid_methods = ["cash", "card", "upi"]
    if payment_method not in valid_methods:
        return jsonify({"error": f"Invalid payment method. Choose from: {', '.join(valid_methods)}"}), 400

    db = SessionLocal()
    try:
        bill = db.query(Bill).filter(Bill.id == bill_id).first()
        if not bill:
            return jsonify({"error": "Bill not found"}), 404

        now = datetime.utcnow()
        bill.payment_method = payment_method
        bill.payment_status = "paid"
        bill.payment_reference = payment_reference
        bill.paid_at = now
        bill.cashier_id = g.current_user.id if hasattr(g, "current_user") and g.current_user else None

        # Complete the order
        order = bill.order
        order.status = "completed"
        order.completed_time = now

        # Deduct inventory if not already deducted
        actor = g.current_user.full_name if hasattr(g, "current_user") and g.current_user else "Cashier"
        deduct_inventory_for_order(db, order, actor_name=actor)

        # Free up the table and reset current order
        if order.table:
            order.table.status = "available"
            order.table.current_order_id = None

        # Update customer statistics
        if order.customer:
            order.customer.total_orders = (order.customer.total_orders or 0) + 1
            order.customer.total_spent = (order.customer.total_spent or 0.0) + bill.final_amount
            order.customer.last_visit = now

        # Notification for billing completion
        table_str = f"Table {order.table.number}" if order.table else "Takeaway"
        notif = Notification(
            title=f"Payment Received: {bill.bill_number}",
            message=f"Bill {bill.bill_number} for {table_str} settled via {payment_method.upper()} (₹{bill.final_amount:.2f}). Table is now available.",
            type="billing",
            reference_id=str(bill.id)
        )
        db.add(notif)

        db.commit()
        db.refresh(bill)
        return jsonify(bill.to_dict())
    finally:
        db.close()
