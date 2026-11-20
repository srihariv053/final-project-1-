from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy import desc
from ..database import SessionLocal
from ..models import Reservation, Table, Customer, Notification
from ..auth_helper import require_auth

reservations_bp = Blueprint("reservations", __name__)

@reservations_bp.route("", methods=["GET"])
@require_auth
def get_reservations():
    date_filter = request.args.get("date", "").strip()
    status = request.args.get("status", "").strip().lower()
    table_id = request.args.get("table_id")

    db = SessionLocal()
    try:
        query = db.query(Reservation)
        if date_filter:
            query = query.filter(Reservation.reservation_date == date_filter)
        if status and status != "all":
            query = query.filter(Reservation.status == status)
        if table_id:
            query = query.filter(Reservation.table_id == int(table_id))

        reservations = query.order_by(Reservation.reservation_date.desc(), Reservation.reservation_time.desc()).all()
        return jsonify([r.to_dict() for r in reservations])
    finally:
        db.close()

@reservations_bp.route("", methods=["POST"])
@require_auth
def create_reservation():
    data = request.get_json() or {}
    customer_name = data.get("customer_name", "").strip()
    customer_phone = data.get("customer_phone", "").strip()
    table_id = data.get("table_id")
    reservation_date = data.get("reservation_date", "").strip()  # YYYY-MM-DD
    reservation_time = data.get("reservation_time", "").strip()  # HH:MM
    guest_count = int(data.get("guest_count", 2))
    notes = data.get("notes", "").strip()

    if not customer_name or not customer_phone or not table_id or not reservation_date or not reservation_time:
        return jsonify({"error": "Customer name, phone, table, date, and time are required"}), 400

    db = SessionLocal()
    try:
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            return jsonify({"error": "Selected table does not exist"}), 400

        # Prevent double-booking: Check if table already booked for this date and time
        # (Conflict check for same table on the same date and time slot within +/- 1 hour)
        existing_conflict = db.query(Reservation).filter(
            Reservation.table_id == table_id,
            Reservation.reservation_date == reservation_date,
            Reservation.reservation_time == reservation_time,
            Reservation.status.in_(["pending", "confirmed", "seated"])
        ).first()

        if existing_conflict:
            return jsonify({
                "error": f"Table {table.number} is already booked on {reservation_date} at {reservation_time} (Reservation #{existing_conflict.id})"
            }), 409

        # Find or create customer
        customer = db.query(Customer).filter(Customer.phone == customer_phone).first()
        if not customer:
            customer = Customer(
                name=customer_name,
                phone=customer_phone,
                notes=f"First reservation on {reservation_date}"
            )
            db.add(customer)
            db.flush()

        res = Reservation(
            customer_id=customer.id,
            customer_name=customer_name,
            customer_phone=customer_phone,
            table_id=table.id,
            reservation_date=reservation_date,
            reservation_time=reservation_time,
            guest_count=guest_count,
            status="confirmed",
            notes=notes
        )
        db.add(res)

        notif = Notification(
            title=f"New Reservation: Table {table.number}",
            message=f"{customer_name} ({guest_count} guests) reserved Table {table.number} on {reservation_date} at {reservation_time}.",
            type="reservation",
            reference_id=str(res.id)
        )
        db.add(notif)

        db.commit()
        db.refresh(res)
        return jsonify(res.to_dict()), 201
    finally:
        db.close()

@reservations_bp.route("/<int:res_id>/status", methods=["PUT"])
@require_auth
def update_reservation_status(res_id):
    data = request.get_json() or {}
    new_status = data.get("status", "").strip().lower()
    valid_statuses = ["pending", "confirmed", "seated", "completed", "cancelled"]

    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Choose from: {', '.join(valid_statuses)}"}), 400

    db = SessionLocal()
    try:
        res = db.query(Reservation).filter(Reservation.id == res_id).first()
        if not res:
            return jsonify({"error": "Reservation not found"}), 404

        res.status = new_status
        if new_status == "seated" and res.table:
            res.table.status = "occupied"
        elif new_status in ["completed", "cancelled"] and res.table and res.table.status == "reserved":
            res.table.status = "available"

        db.commit()
        db.refresh(res)
        return jsonify(res.to_dict())
    finally:
        db.close()

@reservations_bp.route("/<int:res_id>", methods=["DELETE"])
@require_auth
def delete_reservation(res_id):
    db = SessionLocal()
    try:
        res = db.query(Reservation).filter(Reservation.id == res_id).first()
        if not res:
            return jsonify({"error": "Reservation not found"}), 404

        db.delete(res)
        db.commit()
        return jsonify({"message": "Reservation deleted successfully"})
    finally:
        db.close()
