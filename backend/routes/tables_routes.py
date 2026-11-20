from flask import Blueprint, request, jsonify, g
from datetime import datetime
from ..database import SessionLocal
from ..models import Table, User, Order, Bill
from ..auth_helper import require_auth, require_roles

tables_bp = Blueprint("tables", __name__)

@tables_bp.route("", methods=["GET"])
@require_auth
def get_tables():
    db = SessionLocal()
    try:
        tables = db.query(Table).order_by(Table.number).all()
        return jsonify([table.to_dict() for table in tables])
    finally:
        db.close()

@tables_bp.route("", methods=["POST"])
@require_auth
@require_roles("owner", "manager")
def create_table():
    data = request.get_json() or {}
    number = str(data.get("number", "")).strip()
    capacity = int(data.get("capacity", 4))
    section = data.get("section", "Main Dining").strip()
    notes = data.get("notes", "").strip()

    if not number:
        return jsonify({"error": "Table number is required"}), 400

    db = SessionLocal()
    try:
        existing = db.query(Table).filter(Table.number == number).first()
        if existing:
            return jsonify({"error": f"Table '{number}' already exists"}), 400

        table = Table(
            number=number,
            capacity=capacity,
            section=section,
            status="available",
            notes=notes
        )
        db.add(table)
        db.commit()
        db.refresh(table)
        return jsonify(table.to_dict()), 201
    finally:
        db.close()

@tables_bp.route("/<int:table_id>", methods=["PUT"])
@require_auth
@require_roles("owner", "manager", "waiter", "cashier")
def update_table(table_id):
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            return jsonify({"error": "Table not found"}), 404

        if "number" in data and g.current_user.role in ["owner", "manager"]:
            new_num = str(data["number"]).strip()
            if new_num != table.number:
                conflict = db.query(Table).filter(Table.number == new_num).first()
                if conflict:
                    return jsonify({"error": f"Table '{new_num}' already exists"}), 400
                table.number = new_num

        if "capacity" in data:
            table.capacity = int(data["capacity"])
        if "section" in data:
            table.section = data["section"]
        if "status" in data:
            table.status = data["status"]
        if "notes" in data:
            table.notes = data["notes"]
        if "assigned_waiter_id" in data:
            waiter_id = data["assigned_waiter_id"]
            table.assigned_waiter_id = int(waiter_id) if waiter_id else None

        table.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(table)
        return jsonify(table.to_dict())
    finally:
        db.close()

@tables_bp.route("/<int:table_id>", methods=["DELETE"])
@require_auth
@require_roles("owner", "manager")
def delete_table(table_id):
    db = SessionLocal()
    try:
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            return jsonify({"error": "Table not found"}), 404

        if table.status == "occupied":
            return jsonify({"error": "Cannot delete an occupied table. Complete or cancel active order first."}), 400

        db.delete(table)
        db.commit()
        return jsonify({"message": f"Table {table.number} deleted successfully"})
    finally:
        db.close()

@tables_bp.route("/<int:table_id>/status", methods=["POST"])
@require_auth
def change_table_status(table_id):
    data = request.get_json() or {}
    new_status = data.get("status", "").strip().lower()
    valid_statuses = ["available", "occupied", "reserved", "cleaning"]

    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Choose from: {', '.join(valid_statuses)}"}), 400

    db = SessionLocal()
    try:
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            return jsonify({"error": "Table not found"}), 404

        table.status = new_status
        if new_status == "available":
            table.current_order_id = None

        table.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(table)
        return jsonify(table.to_dict())
    finally:
        db.close()

@tables_bp.route("/<int:table_id>/assign-waiter", methods=["POST"])
@require_auth
def assign_waiter(table_id):
    data = request.get_json() or {}
    waiter_id = data.get("waiter_id")

    db = SessionLocal()
    try:
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            return jsonify({"error": "Table not found"}), 404

        if waiter_id:
            waiter = db.query(User).filter(User.id == waiter_id).first()
            if not waiter:
                return jsonify({"error": "Waiter not found"}), 404
            table.assigned_waiter_id = waiter.id
        else:
            table.assigned_waiter_id = None

        table.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(table)
        return jsonify(table.to_dict())
    finally:
        db.close()
