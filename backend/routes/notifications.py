"""Notifications Routes - Phase 5 & 6 from USER_CASE_FLOW.md"""

from datetime import datetime

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id, get_supabase_error_response, get_supabase_error_response

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.get("")
def list_notifications():
    """List notifications for current user (from auth token) or by guardian_id/child_id/user_id."""
    guardian_id = request.args.get("guardian_id") or request.args.get("guardianId")
    child_id = request.args.get("child_id") or request.args.get("childId")
    user_id = request.args.get("user_id") or request.args.get("userId")  # Support user_id lookup
    unread_only = request.args.get("unread_only", "false").lower() == "true"

    client = get_supabase()
    if client is None:
        error_response, status_code = get_supabase_error_response()
        return jsonify(error_response), status_code

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        import re
        uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
        
        query = client.table("notifications").select("*").eq("church_id", church_id)
        
        # If user_id provided, resolve to guardian_id based on user role
        if user_id and not guardian_id:
            if uuid_pattern.match(user_id):
                # It's a UUID, try to find user and their role
                try:
                    user_res = (
                        client.table("users")
                        .select("user_id, role, linked_guardian_id, email")
                        .eq("user_id", user_id)
                        .eq("church_id", church_id)
                        .limit(1)
                        .execute()
                    )
                    
                    if user_res.data:
                        user = user_res.data[0]
                        user_role = user.get("role", "").lower()
                        
                        # For parents, resolve to guardian_id
                        if user_role == "parent":
                            if user.get("linked_guardian_id"):
                                guardian_id = user["linked_guardian_id"]
                            else:
                                # Try to find guardian by user email
                                user_email = user.get("email")
                                if user_email:
                                    try:
                                        guardian_res = (
                                            client.table("guardians")
                                            .select("guardian_id")
                                            .eq("church_id", church_id)
                                            .eq("email", user_email)
                                            .limit(1)
                                            .execute()
                                        )
                                        if guardian_res.data:
                                            guardian_id = guardian_res.data[0]["guardian_id"]
                                    except Exception as e:
                                        print(f"⚠️ Error finding guardian by email: {e}")
                        # For teachers, admins, and teens - they don't have guardian_id, return empty
                        # Notifications are primarily for guardians/parents
                        elif user_role in ["teacher", "admin", "teen"]:
                            # Return empty - these roles don't have guardian_id
                            return jsonify({"data": []})
                except Exception as e:
                    print(f"⚠️ Error fetching user for notifications: {e}")
                    # If we can't fetch user, return empty to be safe
                    return jsonify({"data": []})
            else:
                # It's an email, check if it's a user first, then guardian
                try:
                    # First check if it's a user
                    user_res = (
                        client.table("users")
                        .select("user_id, role, linked_guardian_id, email")
                        .eq("email", user_id)
                        .eq("church_id", church_id)
                        .limit(1)
                        .execute()
                    )
                    
                    if user_res.data:
                        user = user_res.data[0]
                        user_role = user.get("role", "").lower()
                        
                        # For admin/teacher/teen roles, return empty (no guardian)
                        if user_role in ["admin", "teacher", "teen"]:
                            return jsonify({"data": []})
                        
                        # For parents, try to get guardian_id
                        if user_role == "parent":
                            if user.get("linked_guardian_id"):
                                guardian_id = user["linked_guardian_id"]
                            else:
                                # Try to find guardian by email
                                guardian_res = (
                                    client.table("guardians")
                                    .select("guardian_id")
                                    .eq("church_id", church_id)
                                    .eq("email", user_id)
                                    .limit(1)
                                    .execute()
                                )
                                if guardian_res.data:
                                    guardian_id = guardian_res.data[0]["guardian_id"]
                    else:
                        # Not a user, try to find guardian directly by email
                        guardian_res = (
                            client.table("guardians")
                            .select("guardian_id")
                            .eq("church_id", church_id)
                            .eq("email", user_id)
                            .limit(1)
                            .execute()
                        )
                        if guardian_res.data:
                            guardian_id = guardian_res.data[0]["guardian_id"]
                except Exception as e:
                    print(f"⚠️ Error finding user/guardian by email: {e}")
                    # Return empty on error to prevent showing all notifications
                    return jsonify({"data": []})
        
        # Filter by guardian_id if available
        if guardian_id:
            query = query.eq("guardian_id", guardian_id)
        elif user_id:
            # If user_id provided but no guardian_id found, return empty
            # This ensures each user only sees their own notifications
            if uuid_pattern.match(user_id):
                # Return empty array for users without guardian_id
                return jsonify({"data": []})
        
        if child_id:
            query = query.eq("child_id", child_id)
        # Note: Schema doesn't have 'read' column, so unread_only filter is not possible

        # If no filters applied (no guardian_id, no child_id, no user_id), return empty to prevent showing all notifications
        if not guardian_id and not child_id and not user_id:
            return jsonify({"data": []})

        res = query.order("created_at", desc=True).limit(50).execute()
        notifications = []
        for row in res.data or []:
            notifications.append({
                "id": row["notification_id"],
                "type": row.get("type", ""),
                "content": row.get("content", ""),
                "childId": row.get("child_id"),
                "guardianId": row.get("guardian_id"),
                "emailSent": row.get("email_sent", False),
                "smsSent": row.get("sms_sent", False),
                "deliveryStatus": row.get("delivery_status"),
                "createdAt": row.get("created_at"),
                "sentAt": row.get("sent_at"),
            })
        return jsonify({"data": notifications})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing notifications: {exc}")
        return jsonify({"error": "Failed to list notifications"}), 500


@notifications_bp.get("/<notification_id>")
def get_notification(notification_id: str):
    """Get a specific notification."""
    client = get_supabase()
    if client is None:
        error_response, status_code = get_supabase_error_response()
        return jsonify(error_response), status_code

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("notifications")
            .select("*")
            .eq("notification_id", notification_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Notification not found"}), 404
        row = res.data[0]
        return jsonify({"data": {
            "id": row["notification_id"],
            "type": row.get("type", ""),
            "content": row.get("content", ""),
            "childId": row.get("child_id"),
            "guardianId": row.get("guardian_id"),
            "emailSent": row.get("email_sent", False),
            "smsSent": row.get("sms_sent", False),
            "deliveryStatus": row.get("delivery_status"),
            "createdAt": row.get("created_at"),
            "sentAt": row.get("sent_at"),
        }})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting notification: {exc}")
        return jsonify({"error": "Failed to get notification"}), 500


@notifications_bp.post("/<notification_id>/read")
def mark_read(notification_id: str):
    """Mark a notification as read (schema doesn't have read column, so this is a no-op)."""
    # Note: Schema doesn't have 'read' column, so we can't mark as read
    # This endpoint exists for API compatibility but doesn't modify the database
    return jsonify({"data": {"success": True, "message": "Notification marked as read (read column not in schema)"}})


@notifications_bp.post("/read-all")
def mark_all_read():
    """Mark all notifications as read for a guardian (schema doesn't have read column, so this is a no-op)."""
    data = request.get_json() or {}
    guardian_id = data.get("guardian_id") or data.get("guardianId")

    if not guardian_id:
        return jsonify({"error": "guardian_id is required"}), 400

    # Note: Schema doesn't have 'read' column, so we can't mark as read
    # This endpoint exists for API compatibility but doesn't modify the database
    return jsonify({"data": {"success": True, "message": "All notifications marked as read (read column not in schema)"}})


@notifications_bp.get("/unread-count")
def unread_count():
    """Get count of unread notifications for a guardian."""
    guardian_id = request.args.get("guardian_id") or request.args.get("guardianId")

    if not guardian_id:
        return jsonify({"error": "guardian_id is required"}), 400

    client = get_supabase()
    if client is None:
        error_response, status_code = get_supabase_error_response()
        return jsonify(error_response), status_code

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Validate guardian_id is a valid UUID format
        import uuid
        try:
            uuid.UUID(guardian_id)
        except (ValueError, AttributeError):
            return jsonify({"error": "Invalid guardian_id format"}), 400
        
        # Note: Schema doesn't have 'read' column, so we return total count
        res = (
            client.table("notifications")
            .select("notification_id")
            .eq("guardian_id", guardian_id)
            .eq("church_id", church_id)
            .execute()
        )
        count = len(res.data or [])
        return jsonify({"data": {"count": count, "note": "read column not in schema, returning total count"}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting unread count: {exc}")
        return jsonify({"error": "Failed to get unread count"}), 500

