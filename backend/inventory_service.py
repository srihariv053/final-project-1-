from datetime import datetime
from .models import Order, RecipeItem, InventoryItem, StockMovement, Notification

def deduct_inventory_for_order(db, order: Order, actor_name: str = "System"):
    """
    Deducts inventory for all items in an order based on recipe requirements.
    Logs StockMovement records and triggers Notifications if stock falls <= min_stock.
    """
    for order_item in order.items:
        # Find all recipe items for this menu item
        recipes = db.query(RecipeItem).filter(RecipeItem.menu_item_id == order_item.menu_item_id).all()
        for recipe in recipes:
            ingredient = db.query(InventoryItem).filter(InventoryItem.id == recipe.inventory_item_id).first()
            if not ingredient:
                continue

            quantity_to_deduct = recipe.quantity_needed * order_item.quantity
            prev_stock = ingredient.current_stock
            new_stock = max(0.0, prev_stock - quantity_to_deduct)
            ingredient.current_stock = new_stock

            movement = StockMovement(
                inventory_item_id=ingredient.id,
                change_type="order_deduction",
                quantity=-quantity_to_deduct,
                previous_stock=prev_stock,
                new_stock=new_stock,
                reason=f"Order {order.order_number} ({order_item.quantity}x {order_item.item_name})",
                reference_id=order.order_number,
                created_by=actor_name,
                created_at=datetime.utcnow()
            )
            db.add(movement)

            # Check low stock threshold
            if new_stock <= ingredient.min_stock:
                # Avoid duplicate unread notification for the same item within short span
                existing_notif = db.query(Notification).filter(
                    Notification.type == "inventory",
                    Notification.reference_id == str(ingredient.id),
                    Notification.is_read == False
                ).first()

                if not existing_notif:
                    notif = Notification(
                        title=f"Low Stock: {ingredient.name}",
                        message=f"{ingredient.name} – {round(new_stock, 2)} {ingredient.unit} remaining – Low Stock (Min: {round(ingredient.min_stock, 2)} {ingredient.unit})",
                        type="inventory",
                        reference_id=str(ingredient.id),
                        created_at=datetime.utcnow()
                    )
                    db.add(notif)
