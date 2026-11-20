from flask import Blueprint, request, jsonify, g
from ..database import SessionLocal
from ..models import User
from ..auth_helper import hash_password, verify_password, create_access_token, require_auth, require_roles

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username.ilike(username)).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({"error": "Invalid username or password"}), 401

        if user.status != "active":
            return jsonify({"error": "This account is inactive. Please contact manager."}), 403

        token = create_access_token(user.id, user.role)
        return jsonify({
            "token": token,
            "user": user.to_dict()
        })
    finally:
        db.close()

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    return jsonify({"user": g.current_user.to_dict()})

@auth_bp.route("/demo-users", methods=["GET"])
def get_demo_users():
    """Provides quick switch credentials for testing each role easily."""
    return jsonify([
        {"role": "owner", "label": "Restaurant Owner", "username": "owner", "password": "password123", "name": "Vikram Sharma"},
        {"role": "manager", "label": "General Manager", "username": "manager", "password": "password123", "name": "Ananya Roy"},
        {"role": "cashier", "label": "Head Cashier", "username": "cashier", "password": "password123", "name": "Rahul Verma"},
        {"role": "waiter", "label": "Lead Waiter", "username": "waiter", "password": "password123", "name": "Karan Singh"},
        {"role": "kitchen", "label": "Head Chef", "username": "chef", "password": "password123", "name": "Sanjay Kapoor"}
    ])
