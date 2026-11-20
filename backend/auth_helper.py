import time
import hmac
import hashlib
import json
import base64
from functools import wraps
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from .database import SessionLocal
from .models import User

SECRET_KEY = "dineflow-secret-super-key-change-in-production"

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)

def create_access_token(user_id: int, role: str, expires_in_seconds: int = 86400 * 7) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": int(time.time()) + expires_in_seconds
    }
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature = hmac.new(
        SECRET_KEY.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str):
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        
        # Verify signature
        expected_sig = hmac.new(
            SECRET_KEY.encode(),
            f"{header_b64}.{payload_b64}".encode(),
            hashlib.sha256
        ).digest()
        
        # Pad base64 if needed
        padding = 4 - (len(sig_b64) % 4)
        if padding != 4:
            sig_b64 += "=" * padding
            
        decoded_sig = base64.urlsafe_b64decode(sig_b64)
        if not hmac.compare_digest(expected_sig, decoded_sig):
            return None
            
        # Pad payload
        padding = 4 - (len(payload_b64) % 4)
        if padding != 4:
            payload_b64 += "=" * padding
            
        payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = ""
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
        elif auth_header:
            token = auth_header.strip()

        if not token:
            return jsonify({"error": "Authorization token required"}), 401

        payload = decode_access_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == payload["user_id"]).first()
            if not user or user.status != "active":
                return jsonify({"error": "User account inactive or deleted"}), 403
            g.current_user = user
        finally:
            db.close()

        return f(*args, **kwargs)
    return decorated

def require_roles(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(g, "current_user") or not g.current_user:
                return jsonify({"error": "Authentication required"}), 401
            
            # Owner has super-admin permissions to everything
            if g.current_user.role == "owner":
                return f(*args, **kwargs)

            # Manager has access to almost everything except owner-exclusive settings if any
            if g.current_user.role == "manager" and "manager" in allowed_roles:
                return f(*args, **kwargs)

            if g.current_user.role not in allowed_roles:
                return jsonify({"error": f"Access denied. Required role: {', '.join(allowed_roles)}"}), 403
                
            return f(*args, **kwargs)
        return decorated
    return decorator
