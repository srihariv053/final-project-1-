from flask import Blueprint, request, jsonify, g
from datetime import datetime
from ..database import SessionLocal
from ..models import User
from ..auth_helper import require_auth, require_roles, hash_password

staff_bp = Blueprint("staff", __name__)

@staff_bp.route("", methods=["GET"])
@require_auth
def get_staff():
    role = request.args.get("role", "").strip()
    status = request.args.get("status", "").strip()

    db = SessionLocal()
    try:
        query = db.query(User)
        if role and role != "all":
            query = query.filter(User.role == role)
        if status and status != "all":
            query = query.filter(User.status == status)

        staff_list = query.order_by(User.full_name).all()
        return jsonify([u.to_dict() for u in staff_list])
    finally:
        db.close()

@staff_bp.route("", methods=["POST"])
@require_auth
@require_roles("owner", "manager")
def create_staff():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "password123").strip()
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    role = data.get("role", "waiter").strip().lower()

    valid_roles = ["owner", "manager", "cashier", "waiter", "kitchen"]
    if role not in valid_roles:
        return jsonify({"error": f"Invalid role. Choose from: {', '.join(valid_roles)}"}), 400

    if not username or not full_name or not email:
        return jsonify({"error": "Username, full name, and email are required"}), 400

    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == username).first():
            return jsonify({"error": f"Username '{username}' already exists"}), 400
        if db.query(User).filter(User.email == email).first():
            return jsonify({"error": f"Email '{email}' already registered"}), 400

        user = User(
            username=username,
            password_hash=hash_password(password),
            full_name=full_name,
            email=email,
            phone=phone,
            role=role,
            status="active"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return jsonify(user.to_dict()), 201
    finally:
        db.close()

@staff_bp.route("/<int:user_id>", methods=["PUT"])
@require_auth
@require_roles("owner", "manager")
def update_staff(user_id):
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        if "full_name" in data:
            user.full_name = data["full_name"].strip()
        if "phone" in data:
            user.phone = data["phone"].strip()
        if "role" in data:
            new_role = data["role"].strip().lower()
            if new_role in ["owner", "manager", "cashier", "waiter", "kitchen"]:
                user.role = new_role
        if "status" in data:
            user.status = data["status"].strip().lower()
        if "password" in data and data["password"].strip():
            user.password_hash = hash_password(data["password"].strip())

        db.commit()
        db.refresh(user)
        return jsonify(user.to_dict())
    finally:
        db.close()

@staff_bp.route("/<int:user_id>/toggle-status", methods=["POST"])
@require_auth
@require_roles("owner", "manager")
def toggle_staff_status(user_id):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Prevent deactivating yourself
        if hasattr(g, "current_user") and g.current_user.id == user.id:
            return jsonify({"error": "You cannot deactivate your own account"}), 400

        user.status = "inactive" if user.status == "active" else "active"
        db.commit()
        db.refresh(user)
        return jsonify(user.to_dict())
    finally:
        db.close()
