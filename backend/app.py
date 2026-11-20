import os
from flask import Flask, jsonify
from flask_cors import CORS
from .database import init_db
from .seed import seed_database
from .routes.auth_routes import auth_bp
from .routes.dashboard_routes import dashboard_bp
from .routes.tables_routes import tables_bp
from .routes.menu_routes import menu_bp
from .routes.orders_routes import orders_bp
from .routes.kitchen_routes import kitchen_bp
from .routes.billing_routes import billing_bp
from .routes.inventory_routes import inventory_bp
from .routes.suppliers_routes import suppliers_bp
from .routes.customers_routes import customers_bp
from .routes.reservations_routes import reservations_bp
from .routes.staff_routes import staff_bp
from .routes.reports_routes import reports_bp
from .routes.notifications_routes import notifications_bp
from .routes.settings_routes import settings_bp

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dineflow-secret-super-key")

    # Enable CORS for frontend Vite development server and production
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize DB schema
    init_db()

    # Seed initial data if DB empty
    try:
        seed_database(force_reset=False)
    except Exception as e:
        print(f"Warning during seed: {e}")

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(tables_bp, url_prefix="/api/tables")
    app.register_blueprint(menu_bp, url_prefix="/api/menu")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(kitchen_bp, url_prefix="/api/kitchen")
    app.register_blueprint(billing_bp, url_prefix="/api/billing")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(suppliers_bp, url_prefix="/api/suppliers")
    app.register_blueprint(customers_bp, url_prefix="/api/customers")
    app.register_blueprint(reservations_bp, url_prefix="/api/reservations")
    app.register_blueprint(staff_bp, url_prefix="/api/staff")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy",
            "system": "DineFlow Restaurant Management System API",
            "version": "1.0.0"
        })

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting DineFlow Backend on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
