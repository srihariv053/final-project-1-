from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy import desc
from ..database import SessionLocal
from ..models import Customer, Order
from ..auth_helper import require_auth

customers_bp = Blueprint("customers", __name__)

@customers_bp.route("", methods=["GET"])
@require_auth
def get_customers():
    search = request.args.get("search", "").strip()
    db = SessionLocal()
    try:
        query = db.query(Customer)
        if search:
            query = query.filter(
                (Customer.name.ilike(f"%{search}%")) |
                (Customer.phone.ilike(f"%{search}%")) |
                (Customer.email.ilike(f"%{search}%"))
            )
        customers = query.order_by(desc(Customer.total_spent)).all()
        return jsonify([c.to_dict() for c in customers])
    finally:
        db.close()

@customers_bp.route("/<int:customer_id>", methods=["GET"])
@require_auth
def get_customer_detail(customer_id):
    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return jsonify({"error": "Customer not found"}), 404
        return jsonify(customer.to_dict())
    finally:
        db.close()

@customers_bp.route("/<int:customer_id>/orders", methods=["GET"])
@require_auth
def get_customer_orders(customer_id):
    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return jsonify({"error": "Customer not found"}), 404
        orders = db.query(Order).filter(Order.customer_id == customer_id).order_by(desc(Order.order_time)).all()
        return jsonify([o.to_dict() for o in orders])
    finally:
        db.close()

@customers_bp.route("", methods=["POST"])
@require_auth
def create_customer():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip()
    notes = data.get("notes", "").strip()

    if not name or not phone:
        return jsonify({"error": "Name and phone number are required"}), 400

    db = SessionLocal()
    try:
        existing = db.query(Customer).filter(Customer.phone == phone).first()
        if existing:
            return jsonify({"error": f"Customer with phone '{phone}' already exists"}), 400

        customer = Customer(
            name=name,
            phone=phone,
            email=email,
            notes=notes
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return jsonify(customer.to_dict()), 201
    finally:
        db.close()

@customers_bp.route("/<int:customer_id>", methods=["PUT"])
@require_auth
def update_customer(customer_id):
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        if "name" in data:
            customer.name = data["name"].strip()
        if "phone" in data:
            new_phone = data["phone"].strip()
            if new_phone != customer.phone:
                conflict = db.query(Customer).filter(Customer.phone == new_phone).first()
                if conflict:
                    return jsonify({"error": f"Customer with phone '{new_phone}' already exists"}), 400
                customer.phone = new_phone
        if "email" in data:
            customer.email = data["email"].strip()
        if "notes" in data:
            customer.notes = data["notes"].strip()

        db.commit()
        db.refresh(customer)
        return jsonify(customer.to_dict())
    finally:
        db.close()
