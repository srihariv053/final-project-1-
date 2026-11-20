from flask import Blueprint, request, jsonify, g
from datetime import datetime
from sqlalchemy import desc
from ..database import SessionLocal
from ..models import InventoryItem, StockMovement, Supplier, Notification
from ..auth_helper import require_auth, require_roles

inventory_bp = Blueprint("inventory", __name__)

@inventory_bp.route("", methods=["GET"])
@require_auth
def get_inventory():
    category = request.args.get("category", "").strip()
    low_stock_only = request.args.get("low_stock", "").lower() in ["true", "1"]
    search = request.args.get("search", "").strip()

    db = SessionLocal()
    try:
        query = db.query(InventoryItem)
        if category and category.lower() != "all":
            query = query.filter(InventoryItem.category.ilike(category))
        if search:
            query = query.filter(InventoryItem.name.ilike(f"%{search}%"))
        if low_stock_only:
            query = query.filter(InventoryItem.current_stock <= InventoryItem.min_stock)

        items = query.order_by(InventoryItem.name).all()
        return jsonify([item.to_dict() for item in items])
    finally:
        db.close()

@inventory_bp.route("/low-stock", methods=["GET"])
@require_auth
def get_low_stock():
    db = SessionLocal()
    try:
        items = db.query(InventoryItem).filter(
            InventoryItem.current_stock <= InventoryItem.min_stock
        ).all()
        return jsonify([item.to_dict() for item in items])
    finally:
        db.close()

@inventory_bp.route("/categories", methods=["GET"])
@require_auth
def get_inventory_categories():
    db = SessionLocal()
    try:
        cats = db.query(InventoryItem.category).distinct().all()
        defaults = ["Vegetables", "Meat & Seafood", "Dairy", "Spices", "Grains", "Beverages", "Oils & Sauces"]
        merged = sorted(list(set([c[0] for c in cats] + defaults)))
        return jsonify(merged)
    finally:
        db.close()

@inventory_bp.route("", methods=["POST"])
@require_auth
@require_roles("owner", "manager")
def create_inventory_item():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    category = data.get("category", "General").strip()
    current_stock = float(data.get("current_stock", 0.0))
    unit = data.get("unit", "kg").strip()
    min_stock = float(data.get("min_stock", 5.0))
    supplier_id = data.get("supplier_id")
    cost_per_unit = float(data.get("cost_per_unit", 0.0))

    if not name:
        return jsonify({"error": "Ingredient name is required"}), 400

    db = SessionLocal()
    try:
        item = InventoryItem(
            name=name,
            category=category,
            current_stock=current_stock,
            unit=unit,
            min_stock=min_stock,
            supplier_id=int(supplier_id) if supplier_id else None,
            cost_per_unit=cost_per_unit,
            last_restocked_at=datetime.utcnow() if current_stock > 0 else None
        )
        db.add(item)
        db.flush()

        if current_stock > 0:
            actor = g.current_user.full_name if hasattr(g, "current_user") and g.current_user else "Admin"
            mov = StockMovement(
                inventory_item_id=item.id,
                change_type="restock",
                quantity=current_stock,
                previous_stock=0.0,
                new_stock=current_stock,
                reason="Initial inventory creation",
                created_by=actor
            )
            db.add(mov)

        db.commit()
        db.refresh(item)
        return jsonify(item.to_dict()), 201
    finally:
        db.close()

@inventory_bp.route("/<int:item_id>", methods=["PUT"])
@require_auth
@require_roles("owner", "manager")
def update_inventory_item(item_id):
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            return jsonify({"error": "Item not found"}), 404

        if "name" in data:
            item.name = data["name"].strip()
        if "category" in data:
            item.category = data["category"].strip()
        if "unit" in data:
            item.unit = data["unit"].strip()
        if "min_stock" in data:
            item.min_stock = float(data["min_stock"])
        if "supplier_id" in data:
            item.supplier_id = int(data["supplier_id"]) if data["supplier_id"] else None
        if "cost_per_unit" in data:
            item.cost_per_unit = float(data["cost_per_unit"])

        db.commit()
        db.refresh(item)
        return jsonify(item.to_dict())
    finally:
        db.close()

@inventory_bp.route("/<int:item_id>", methods=["DELETE"])
@require_auth
@require_roles("owner", "manager")
def delete_inventory_item(item_id):
    db = SessionLocal()
    try:
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            return jsonify({"error": "Item not found"}), 404

        db.delete(item)
        db.commit()
        return jsonify({"message": f"Inventory item '{item.name}' deleted"})
    finally:
        db.close()

@inventory_bp.route("/<int:item_id>/restock", methods=["POST"])
@require_auth
def restock_item(item_id):
    data = request.get_json() or {}
    quantity = float(data.get("quantity", 0.0))
    reason = data.get("reason", "Restock").strip()

    if quantity <= 0:
        return jsonify({"error": "Quantity must be greater than zero"}), 400

    db = SessionLocal()
    try:
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            return jsonify({"error": "Item not found"}), 404

        prev = item.current_stock
        new_val = prev + quantity
        item.current_stock = new_val
        now = datetime.utcnow()
        item.last_restocked_at = now

        actor = g.current_user.full_name if hasattr(g, "current_user") and g.current_user else "Staff"
        movement = StockMovement(
            inventory_item_id=item.id,
            change_type="restock",
            quantity=quantity,
            previous_stock=prev,
            new_stock=new_val,
            reason=reason,
            created_by=actor,
            created_at=now
        )
        db.add(movement)

        # Clear any low stock notification for this item if resolved
        if new_val > item.min_stock:
            notifs = db.query(Notification).filter(
                Notification.type == "inventory",
                Notification.reference_id == str(item.id),
                Notification.is_read == False
            ).all()
            for n in notifs:
                n.is_read = True

        db.commit()
        db.refresh(item)
        return jsonify(item.to_dict())
    finally:
        db.close()

@inventory_bp.route("/<int:item_id>/usage", methods=["POST"])
@require_auth
def record_usage(item_id):
    data = request.get_json() or {}
    quantity = float(data.get("quantity", 0.0))
    change_type = data.get("change_type", "waste").strip()  # waste, adjustment, usage
    reason = data.get("reason", "Manual adjustment").strip()

    if quantity <= 0:
        return jsonify({"error": "Quantity must be greater than zero"}), 400

    db = SessionLocal()
    try:
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            return jsonify({"error": "Item not found"}), 404

        prev = item.current_stock
        new_val = max(0.0, prev - quantity)
        item.current_stock = new_val

        actor = g.current_user.full_name if hasattr(g, "current_user") and g.current_user else "Staff"
        movement = StockMovement(
            inventory_item_id=item.id,
            change_type=change_type,
            quantity=-quantity,
            previous_stock=prev,
            new_stock=new_val,
            reason=reason,
            created_by=actor,
            created_at=datetime.utcnow()
        )
        db.add(movement)

        # Check for low stock alert
        if new_val <= item.min_stock:
            notif = Notification(
                title=f"Low Stock: {item.name}",
                message=f"«{item.name} – {round(new_val, 2)} {item.unit} remaining – Low Stock»",
                type="inventory",
                reference_id=str(item.id)
            )
            db.add(notif)

        db.commit()
        db.refresh(item)
        return jsonify(item.to_dict())
    finally:
        db.close()

@inventory_bp.route("/movements", methods=["GET"])
@require_auth
def get_stock_movements():
    item_id = request.args.get("item_id")
    limit = int(request.args.get("limit", 50))

    db = SessionLocal()
    try:
        query = db.query(StockMovement)
        if item_id:
            query = query.filter(StockMovement.inventory_item_id == int(item_id))

        movements = query.order_by(desc(StockMovement.created_at)).limit(limit).all()
        return jsonify([m.to_dict() for m in movements])
    finally:
        db.close()
