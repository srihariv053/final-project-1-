from flask import Blueprint, request, jsonify, g
from datetime import datetime
from sqlalchemy import desc
from ..database import SessionLocal
from ..models import Supplier, SupplierPurchase, PurchaseItem, InventoryItem, StockMovement
from ..auth_helper import require_auth, require_roles

suppliers_bp = Blueprint("suppliers", __name__)

@suppliers_bp.route("", methods=["GET"])
@require_auth
def get_suppliers():
    search = request.args.get("search", "").strip()
    db = SessionLocal()
    try:
        query = db.query(Supplier)
        if search:
            query = query.filter(
                (Supplier.name.ilike(f"%{search}%")) |
                (Supplier.contact_person.ilike(f"%{search}%")) |
                (Supplier.supplied_items.ilike(f"%{search}%"))
            )
        suppliers = query.order_by(Supplier.name).all()
        return jsonify([s.to_dict() for s in suppliers])
    finally:
        db.close()

@suppliers_bp.route("/<int:supplier_id>", methods=["GET"])
@require_auth
def get_supplier_detail(supplier_id):
    db = SessionLocal()
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return jsonify({"error": "Supplier not found"}), 404
        return jsonify(supplier.to_dict())
    finally:
        db.close()

@suppliers_bp.route("", methods=["POST"])
@require_auth
@require_roles("owner", "manager")
def create_supplier():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    contact_person = data.get("contact_person", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip()
    address = data.get("address", "").strip()
    supplied_items = data.get("supplied_items", "").strip()
    notes = data.get("notes", "").strip()

    if not name:
        return jsonify({"error": "Supplier name is required"}), 400

    db = SessionLocal()
    try:
        supplier = Supplier(
            name=name,
            contact_person=contact_person,
            phone=phone,
            email=email,
            address=address,
            supplied_items=supplied_items,
            notes=notes
        )
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return jsonify(supplier.to_dict()), 201
    finally:
        db.close()

@suppliers_bp.route("/<int:supplier_id>", methods=["PUT"])
@require_auth
@require_roles("owner", "manager")
def update_supplier(supplier_id):
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return jsonify({"error": "Supplier not found"}), 404

        if "name" in data:
            supplier.name = data["name"].strip()
        if "contact_person" in data:
            supplier.contact_person = data["contact_person"].strip()
        if "phone" in data:
            supplier.phone = data["phone"].strip()
        if "email" in data:
            supplier.email = data["email"].strip()
        if "address" in data:
            supplier.address = data["address"].strip()
        if "supplied_items" in data:
            supplier.supplied_items = data["supplied_items"].strip()
        if "notes" in data:
            supplier.notes = data["notes"].strip()

        db.commit()
        db.refresh(supplier)
        return jsonify(supplier.to_dict())
    finally:
        db.close()

@suppliers_bp.route("/<int:supplier_id>", methods=["DELETE"])
@require_auth
@require_roles("owner", "manager")
def delete_supplier(supplier_id):
    db = SessionLocal()
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return jsonify({"error": "Supplier not found"}), 404

        db.delete(supplier)
        db.commit()
        return jsonify({"message": f"Supplier '{supplier.name}' deleted"})
    finally:
        db.close()

@suppliers_bp.route("/<int:supplier_id>/purchases", methods=["GET"])
@require_auth
def get_supplier_purchases(supplier_id):
    db = SessionLocal()
    try:
        purchases = db.query(SupplierPurchase).filter(
            SupplierPurchase.supplier_id == supplier_id
        ).order_by(desc(SupplierPurchase.purchase_date)).all()
        return jsonify([p.to_dict() for p in purchases])
    finally:
        db.close()

@suppliers_bp.route("/purchases", methods=["POST"])
@require_auth
@require_roles("owner", "manager")
def create_purchase():
    data = request.get_json() or {}
    supplier_id = data.get("supplier_id")
    invoice_number = data.get("invoice_number", "").strip()
    notes = data.get("notes", "").strip()
    items_data = data.get("items", [])  # list of {inventory_item_id, quantity, unit_cost}

    if not supplier_id or not items_data:
        return jsonify({"error": "Supplier and at least one purchase item are required"}), 400

    db = SessionLocal()
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return jsonify({"error": "Supplier not found"}), 404

        now = datetime.utcnow()
        if not invoice_number:
            count = db.query(SupplierPurchase).count()
            invoice_number = f"PO-{now.strftime('%Y%m')}-{(count + 1):04d}"

        purchase = SupplierPurchase(
            supplier_id=supplier.id,
            invoice_number=invoice_number,
            notes=notes,
            status="completed",
            purchase_date=now
        )
        db.add(purchase)
        db.flush()

        total_amount = 0.0
        actor = g.current_user.full_name if hasattr(g, "current_user") and g.current_user else "Manager"

        for item_data in items_data:
            inv_id = item_data.get("inventory_item_id")
            qty = float(item_data.get("quantity", 0.0))
            cost = float(item_data.get("unit_cost", 0.0))

            if not inv_id or qty <= 0:
                continue

            inv_item = db.query(InventoryItem).filter(InventoryItem.id == inv_id).first()
            if not inv_item:
                continue

            line_total = round(qty * cost, 2)
            total_amount += line_total

            p_item = PurchaseItem(
                purchase_id=purchase.id,
                inventory_item_id=inv_item.id,
                quantity=qty,
                unit_cost=cost,
                total_cost=line_total
            )
            db.add(p_item)

            # Restock inventory item
            prev_stock = inv_item.current_stock
            inv_item.current_stock = prev_stock + qty
            inv_item.cost_per_unit = cost
            inv_item.last_restocked_at = now

            mov = StockMovement(
                inventory_item_id=inv_item.id,
                change_type="restock",
                quantity=qty,
                previous_stock=prev_stock,
                new_stock=inv_item.current_stock,
                reason=f"Purchase {invoice_number} from {supplier.name}",
                reference_id=invoice_number,
                created_by=actor,
                created_at=now
            )
            db.add(mov)

        purchase.total_amount = round(total_amount, 2)
        db.commit()
        db.refresh(purchase)
        return jsonify(purchase.to_dict()), 201
    finally:
        db.close()
