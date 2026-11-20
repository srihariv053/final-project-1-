from flask import Blueprint, request, jsonify
from datetime import datetime
from ..database import SessionLocal
from ..models import MenuItem, RecipeItem, InventoryItem
from ..auth_helper import require_auth, require_roles

menu_bp = Blueprint("menu", __name__)

@menu_bp.route("", methods=["GET"])
def get_menu():
    category = request.args.get("category", "").strip()
    search = request.args.get("search", "").strip()
    veg_only = request.args.get("veg_only", "").lower() in ["true", "1"]
    available_only = request.args.get("available_only", "").lower() in ["true", "1"]

    db = SessionLocal()
    try:
        query = db.query(MenuItem)
        if category and category.lower() != "all":
            query = query.filter(MenuItem.category.ilike(category))
        if search:
            query = query.filter(
                (MenuItem.name.ilike(f"%{search}%")) |
                (MenuItem.description.ilike(f"%{search}%"))
            )
        if veg_only:
            query = query.filter(MenuItem.is_veg == True)
        if available_only:
            query = query.filter(MenuItem.is_available == True)

        items = query.order_by(MenuItem.category, MenuItem.name).all()
        return jsonify([item.to_dict() for item in items])
    finally:
        db.close()

@menu_bp.route("/categories", methods=["GET"])
def get_categories():
    db = SessionLocal()
    try:
        cats = db.query(MenuItem.category).distinct().all()
        default_categories = [
            "Starters", "Main Course", "Rice & Noodles", "Breads", "Desserts", "Beverages"
        ]
        result_cats = sorted(list(set([c[0] for c in cats] + default_categories)))
        return jsonify(result_cats)
    finally:
        db.close()

@menu_bp.route("", methods=["POST"])
@require_auth
@require_roles("owner", "manager")
def create_menu_item():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    category = data.get("category", "Main Course").strip()
    price = float(data.get("price", 0.0))
    description = data.get("description", "").strip()
    is_veg = bool(data.get("is_veg", True))
    is_available = bool(data.get("is_available", True))
    image_url = data.get("image_url", "").strip()
    prep_time = int(data.get("preparation_time_minutes", 15))
    recipes_data = data.get("recipes", [])  # list of {inventory_item_id, quantity_needed}

    if not name or price <= 0:
        return jsonify({"error": "Valid name and positive price are required"}), 400

    db = SessionLocal()
    try:
        item = MenuItem(
            name=name,
            category=category,
            price=price,
            description=description,
            is_veg=is_veg,
            is_available=is_available,
            image_url=image_url,
            preparation_time_minutes=prep_time
        )
        db.add(item)
        db.flush()

        for r in recipes_data:
            inv_id = r.get("inventory_item_id")
            qty = float(r.get("quantity_needed", 0.1))
            if inv_id and qty > 0:
                recipe = RecipeItem(
                    menu_item_id=item.id,
                    inventory_item_id=inv_id,
                    quantity_needed=qty
                )
                db.add(recipe)

        db.commit()
        db.refresh(item)
        return jsonify(item.to_dict()), 201
    finally:
        db.close()

@menu_bp.route("/<int:item_id>", methods=["PUT"])
@require_auth
@require_roles("owner", "manager")
def update_menu_item(item_id):
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not item:
            return jsonify({"error": "Menu item not found"}), 404

        if "name" in data:
            item.name = data["name"].strip()
        if "category" in data:
            item.category = data["category"].strip()
        if "price" in data:
            item.price = float(data["price"])
        if "description" in data:
            item.description = data["description"].strip()
        if "is_veg" in data:
            item.is_veg = bool(data["is_veg"])
        if "is_available" in data:
            item.is_available = bool(data["is_available"])
        if "image_url" in data:
            item.image_url = data["image_url"].strip()
        if "preparation_time_minutes" in data:
            item.preparation_time_minutes = int(data["preparation_time_minutes"])

        if "recipes" in data:
            # Replace recipe ingredients
            db.query(RecipeItem).filter(RecipeItem.menu_item_id == item.id).delete()
            for r in data["recipes"]:
                inv_id = r.get("inventory_item_id")
                qty = float(r.get("quantity_needed", 0.1))
                if inv_id and qty > 0:
                    recipe = RecipeItem(
                        menu_item_id=item.id,
                        inventory_item_id=inv_id,
                        quantity_needed=qty
                    )
                    db.add(recipe)

        db.commit()
        db.refresh(item)
        return jsonify(item.to_dict())
    finally:
        db.close()

@menu_bp.route("/<int:item_id>", methods=["DELETE"])
@require_auth
@require_roles("owner", "manager")
def delete_menu_item(item_id):
    db = SessionLocal()
    try:
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not item:
            return jsonify({"error": "Menu item not found"}), 404

        db.delete(item)
        db.commit()
        return jsonify({"message": f"Menu item '{item.name}' deleted"})
    finally:
        db.close()

@menu_bp.route("/<int:item_id>/toggle-availability", methods=["POST"])
@require_auth
def toggle_availability(item_id):
    db = SessionLocal()
    try:
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not item:
            return jsonify({"error": "Menu item not found"}), 404

        item.is_available = not item.is_available
        db.commit()
        db.refresh(item)
        return jsonify(item.to_dict())
    finally:
        db.close()
