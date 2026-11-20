from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from ..database import SessionLocal
from ..models import Notification
from ..auth_helper import require_auth

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.route("", methods=["GET"])
@require_auth
def get_notifications():
    unread_only = request.args.get("unread_only", "").lower() in ["true", "1"]
    notif_type = request.args.get("type", "").strip()
    limit = int(request.args.get("limit", 40))

    db = SessionLocal()
    try:
        query = db.query(Notification)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        if notif_type and notif_type != "all":
            query = query.filter(Notification.type == notif_type)

        notifs = query.order_by(desc(Notification.created_at)).limit(limit).all()
        unread_count = db.query(Notification).filter(Notification.is_read == False).count()

        return jsonify({
            "unread_count": unread_count,
            "notifications": [n.to_dict() for n in notifs]
        })
    finally:
        db.close()

@notifications_bp.route("/<int:notif_id>/read", methods=["POST"])
@require_auth
def mark_read(notif_id):
    db = SessionLocal()
    try:
        notif = db.query(Notification).filter(Notification.id == notif_id).first()
        if notif:
            notif.is_read = True
            db.commit()
            return jsonify(notif.to_dict())
        return jsonify({"error": "Notification not found"}), 404
    finally:
        db.close()

@notifications_bp.route("/mark-all-read", methods=["POST"])
@require_auth
def mark_all_read():
    db = SessionLocal()
    try:
        db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
        db.commit()
        return jsonify({"message": "All notifications marked as read"})
    finally:
        db.close()

@notifications_bp.route("/<int:notif_id>", methods=["DELETE"])
@require_auth
def delete_notification(notif_id):
    db = SessionLocal()
    try:
        notif = db.query(Notification).filter(Notification.id == notif_id).first()
        if notif:
            db.delete(notif)
            db.commit()
            return jsonify({"message": "Notification deleted"})
        return jsonify({"error": "Notification not found"}), 404
    finally:
        db.close()
