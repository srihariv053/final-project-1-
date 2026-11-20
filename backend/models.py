from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), nullable=False, default="waiter")  # owner, manager, cashier, waiter, kitchen
    status = Column(String(20), nullable=False, default="active")  # active, inactive
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class RestaurantSetting(Base):
    __tablename__ = "restaurant_settings"

    id = Column(Integer, primary_key=True)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Table(Base):
    __tablename__ = "restaurant_tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(20), unique=True, nullable=False)
    capacity = Column(Integer, nullable=False, default=4)
    section = Column(String(50), nullable=False, default="Main Dining")  # Main Dining, Balcony, Rooftop, Private Room
    status = Column(String(20), nullable=False, default="available")  # available, occupied, reserved, cleaning
    assigned_waiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    current_order_id = Column(Integer, ForeignKey("orders.id", use_alter=True, name="fk_table_current_order"), nullable=True)
    notes = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_waiter = relationship("User", foreign_keys=[assigned_waiter_id])
    current_order = relationship("Order", foreign_keys=[current_order_id], post_update=True)

    def to_dict(self):
        return {
            "id": self.id,
            "number": self.number,
            "capacity": self.capacity,
            "section": self.section,
            "status": self.status,
            "assigned_waiter_id": self.assigned_waiter_id,
            "assigned_waiter_name": self.assigned_waiter.full_name if self.assigned_waiter else None,
            "current_order_id": self.current_order_id,
            "current_order_number": self.current_order.order_number if self.current_order else None,
            "current_order_status": self.current_order.status if self.current_order else None,
            "notes": self.notes,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # Starters, Main Course, Rice & Noodles, Breads, Desserts, Beverages
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    is_veg = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    image_url = Column(String(500), nullable=True)
    preparation_time_minutes = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.utcnow)

    recipes = relationship("RecipeItem", back_populates="menu_item", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "price": self.price,
            "description": self.description,
            "is_veg": self.is_veg,
            "is_available": self.is_available,
            "image_url": self.image_url,
            "preparation_time_minutes": self.preparation_time_minutes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "recipes": [r.to_dict() for r in self.recipes] if self.recipes else []
        }

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="General")  # Vegetables, Meat & Seafood, Dairy, Spices, Grains, Beverages
    current_stock = Column(Float, nullable=False, default=0.0)
    unit = Column(String(20), nullable=False, default="kg")  # kg, g, liters, ml, pcs, packs
    min_stock = Column(Float, nullable=False, default=5.0)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    cost_per_unit = Column(Float, nullable=False, default=0.0)
    last_restocked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="inventory_items")
    stock_movements = relationship("StockMovement", back_populates="inventory_item", cascade="all, delete-orphan")

    @property
    def is_low_stock(self):
        return self.current_stock <= self.min_stock

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "current_stock": round(self.current_stock, 2),
            "unit": self.unit,
            "min_stock": round(self.min_stock, 2),
            "is_low_stock": self.is_low_stock,
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name if self.supplier else None,
            "cost_per_unit": self.cost_per_unit,
            "last_restocked_at": self.last_restocked_at.isoformat() if self.last_restocked_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class RecipeItem(Base):
    __tablename__ = "recipe_items"

    id = Column(Integer, primary_key=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_needed = Column(Float, nullable=False, default=0.1)  # Amount needed in inventory item's unit

    menu_item = relationship("MenuItem", back_populates="recipes")
    inventory_item = relationship("InventoryItem")

    def to_dict(self):
        return {
            "id": self.id,
            "menu_item_id": self.menu_item_id,
            "inventory_item_id": self.inventory_item_id,
            "ingredient_name": self.inventory_item.name if self.inventory_item else None,
            "quantity_needed": self.quantity_needed,
            "unit": self.inventory_item.unit if self.inventory_item else None
        }

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    change_type = Column(String(30), nullable=False)  # restock, order_deduction, waste, adjustment
    quantity = Column(Float, nullable=False)  # positive for addition, negative for reduction
    previous_stock = Column(Float, nullable=False)
    new_stock = Column(Float, nullable=False)
    reason = Column(String(255), nullable=True)
    reference_id = Column(String(50), nullable=True)  # order number or purchase id
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    inventory_item = relationship("InventoryItem", back_populates="stock_movements")

    def to_dict(self):
        return {
            "id": self.id,
            "inventory_item_id": self.inventory_item_id,
            "ingredient_name": self.inventory_item.name if self.inventory_item else None,
            "change_type": self.change_type,
            "quantity": self.quantity,
            "previous_stock": self.previous_stock,
            "new_stock": self.new_stock,
            "reason": self.reason,
            "reference_id": self.reference_id,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    supplied_items = Column(String(255), nullable=True)  # comma separated list of items
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    inventory_items = relationship("InventoryItem", back_populates="supplier")
    purchases = relationship("SupplierPurchase", back_populates="supplier", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "contact_person": self.contact_person,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "supplied_items": self.supplied_items,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "purchase_count": len(self.purchases) if self.purchases else 0
        }

class SupplierPurchase(Base):
    __tablename__ = "supplier_purchases"

    id = Column(Integer, primary_key=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    invoice_number = Column(String(50), nullable=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(String(255), nullable=True)
    status = Column(String(20), default="completed")  # completed, pending

    supplier = relationship("Supplier", back_populates="purchases")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name if self.supplier else None,
            "invoice_number": self.invoice_number,
            "total_amount": self.total_amount,
            "purchase_date": self.purchase_date.isoformat() if self.purchase_date else None,
            "notes": self.notes,
            "status": self.status,
            "items": [item.to_dict() for item in self.items] if self.items else []
        }

class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True)
    purchase_id = Column(Integer, ForeignKey("supplier_purchases.id"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)

    purchase = relationship("SupplierPurchase", back_populates="items")
    inventory_item = relationship("InventoryItem")

    def to_dict(self):
        return {
            "id": self.id,
            "purchase_id": self.purchase_id,
            "inventory_item_id": self.inventory_item_id,
            "ingredient_name": self.inventory_item.name if self.inventory_item else None,
            "quantity": self.quantity,
            "unit": self.inventory_item.unit if self.inventory_item else None,
            "unit_cost": self.unit_cost,
            "total_cost": self.total_cost
        }

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(30), unique=True, nullable=False, index=True)
    email = Column(String(100), nullable=True)
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    last_visit = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    reservations = relationship("Reservation", back_populates="customer")
    orders = relationship("Order", back_populates="customer")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "total_orders": self.total_orders,
            "total_spent": round(self.total_spent, 2),
            "last_visit": self.last_visit.isoformat() if self.last_visit else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    table_id = Column(Integer, ForeignKey("restaurant_tables.id"), nullable=False)
    reservation_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    reservation_time = Column(String(10), nullable=False)  # HH:MM (24-hr format, e.g., 19:30)
    guest_count = Column(Integer, nullable=False, default=2)
    status = Column(String(20), nullable=False, default="pending")  # pending, confirmed, seated, completed, cancelled
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="reservations")
    table = relationship("Table")

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "customer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "table_id": self.table_id,
            "table_number": self.table.number if self.table else None,
            "table_capacity": self.table.capacity if self.table else None,
            "reservation_date": self.reservation_date,
            "reservation_time": self.reservation_time,
            "guest_count": self.guest_count,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(30), unique=True, nullable=False, index=True)
    table_id = Column(Integer, ForeignKey("restaurant_tables.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    waiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    order_type = Column(String(20), default="dine_in")  # dine_in, takeaway
    status = Column(String(20), default="new", index=True)  # new, confirmed, preparing, ready, served, completed, cancelled
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    final_amount = Column(Float, default=0.0)
    special_instructions = Column(Text, nullable=True)
    order_time = Column(DateTime, default=datetime.utcnow)
    preparing_time = Column(DateTime, nullable=True)
    ready_time = Column(DateTime, nullable=True)
    served_time = Column(DateTime, nullable=True)
    completed_time = Column(DateTime, nullable=True)

    table = relationship("Table", foreign_keys=[table_id])
    customer = relationship("Customer", back_populates="orders")
    waiter = relationship("User", foreign_keys=[waiter_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    bill = relationship("Bill", back_populates="order", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "table_id": self.table_id,
            "table_number": self.table.number if self.table else "Takeaway",
            "customer_id": self.customer_id,
            "customer_name": self.customer.name if self.customer else "Walk-in Guest",
            "waiter_id": self.waiter_id,
            "waiter_name": self.waiter.full_name if self.waiter else "Unassigned",
            "order_type": self.order_type,
            "status": self.status,
            "subtotal": round(self.subtotal, 2),
            "tax_amount": round(self.tax_amount, 2),
            "discount_amount": round(self.discount_amount, 2),
            "final_amount": round(self.final_amount, 2),
            "special_instructions": self.special_instructions,
            "order_time": self.order_time.isoformat() if self.order_time else None,
            "preparing_time": self.preparing_time.isoformat() if self.preparing_time else None,
            "ready_time": self.ready_time.isoformat() if self.ready_time else None,
            "served_time": self.served_time.isoformat() if self.served_time else None,
            "completed_time": self.completed_time.isoformat() if self.completed_time else None,
            "items": [item.to_dict() for item in self.items] if self.items else [],
            "bill_id": self.bill.id if self.bill else None,
            "payment_status": self.bill.payment_status if self.bill else "pending"
        }

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    item_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    notes = Column(String(255), nullable=True)
    status = Column(String(20), default="new")  # new, preparing, ready, served

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "menu_item_id": self.menu_item_id,
            "item_name": self.item_name,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "total_price": self.total_price,
            "notes": self.notes,
            "status": self.status,
            "is_veg": self.menu_item.is_veg if self.menu_item else True
        }

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    bill_number = Column(String(30), unique=True, nullable=False)
    subtotal = Column(Float, nullable=False)
    discount_type = Column(String(20), default="fixed")  # percentage, fixed
    discount_value = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_rate = Column(Float, default=5.0)  # default 5% GST/tax
    tax_amount = Column(Float, default=0.0)
    service_charge = Column(Float, default=0.0)
    final_amount = Column(Float, nullable=False)
    payment_method = Column(String(20), default="cash")  # cash, card, upi
    payment_status = Column(String(20), default="pending")  # pending, paid, refunded
    payment_reference = Column(String(100), nullable=True)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="bill")
    cashier = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "order_number": self.order.order_number if self.order else None,
            "bill_number": self.bill_number,
            "table_number": self.order.table.number if (self.order and self.order.table) else "Takeaway",
            "customer_name": self.order.customer.name if (self.order and self.order.customer) else "Walk-in Guest",
            "subtotal": round(self.subtotal, 2),
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "discount_amount": round(self.discount_amount, 2),
            "tax_rate": self.tax_rate,
            "tax_amount": round(self.tax_amount, 2),
            "service_charge": round(self.service_charge, 2),
            "final_amount": round(self.final_amount, 2),
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "payment_reference": self.payment_reference,
            "cashier_name": self.cashier.full_name if self.cashier else "Staff",
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "items": [item.to_dict() for item in self.order.items] if (self.order and self.order.items) else []
        }

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="system")  # order, kitchen, inventory, reservation, billing, system
    is_read = Column(Boolean, default=False)
    reference_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "is_read": self.is_read,
            "reference_id": self.reference_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
