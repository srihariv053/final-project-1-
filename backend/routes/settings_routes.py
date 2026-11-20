from flask import Blueprint, request, jsonify
from ..database import SessionLocal
from ..models import RestaurantSetting
from ..auth_helper import require_auth, require_roles

settings_bp = Blueprint("settings", __name__)

DEFAULT_SETTINGS = {
    "restaurant_name": "DineFlow Gourmet & Bistro",
    "tagline": "Fine Dining & Hospitality Management",
    "address": "42 Heritage Boulevard, Connaught Place, New Delhi",
    "phone": "+91 98765 43210",
    "email": "contact@dineflow-restaurant.com",
    "currency_symbol": "₹",
    "tax_rate_percent": "5.0",
    "service_charge_percent": "0.0",
    "opening_time": "10:00",
    "closing_time": "23:00",
    "receipt_footer": "Thank you for dining with DineFlow! Please visit us again."
}

@settings_bp.route("", methods=["GET"])
def get_settings():
    db = SessionLocal()
    try:
        settings_rows = db.query(RestaurantSetting).all()
        settings_dict = dict(DEFAULT_SETTINGS)
        for row in settings_rows:
            settings_dict[row.key] = row.value
        return jsonify(settings_dict)
    finally:
        db.close()

@settings_bp.route("", methods=["PUT"])
@require_auth
@require_roles("owner", "manager")
def update_settings():
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        for k, v in data.items():
            setting = db.query(RestaurantSetting).filter(RestaurantSetting.key == k).first()
            if setting:
                setting.value = str(v)
            else:
                setting = RestaurantSetting(key=k, value=str(v))
                db.add(setting)
        db.commit()

        # Return updated
        settings_rows = db.query(RestaurantSetting).all()
        settings_dict = dict(DEFAULT_SETTINGS)
        for row in settings_rows:
            settings_dict[row.key] = row.value
        return jsonify(settings_dict)
    finally:
        db.close()

@settings_bp.route("/reset-demo", methods=["POST"])
@require_auth
@require_roles("owner")
def reset_demo_data():
    from ..seed import seed_database
    seed_database(force_reset=True)
    return jsonify({"message": "Demo data successfully re-seeded!"})
