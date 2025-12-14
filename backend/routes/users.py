"""Users Routes - For managing user accounts (Admin, Teacher, Parent, Teen)"""

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id
from utils.auth import require_role, is_super_admin, get_current_user

users_bp = Blueprint("users", __name__)


@users_bp.get("")
def list_users():
    """List users, optionally filtered by role. Requires admin or super_admin role."""
    # Require admin or super_admin to list users
    current_user, error, status = require_role(["admin", "super_admin"])
    if error:
        return error, status
    
    role = request.args.get("role")

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        query = client.table("users").select("*").eq("church_id", church_id)
        if role:
            # Normalize role for query
            role_normalized = role.capitalize()
            if role_normalized.lower() == "super_admin":
                role_normalized = "SuperAdmin"
            query = query.eq("role", role_normalized)

        res = query.order("created_at", desc=True).execute()
        users = []
        for row in res.data or []:
            db_role = row.get("role", "").lower()
            # Normalize role for frontend
            if db_role == "superadmin":
                db_role = "super_admin"
            users.append({
                "id": row["user_id"],
                "email": row.get("email", ""),
                "role": db_role,
                "name": row.get("name"),
                "isActive": row.get("is_active", True),
                "mfaEnabled": row.get("mfa_enabled", False),
                "createdAt": row.get("created_at"),
            })
        return jsonify({"data": users})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing users: {exc}")
        return jsonify({"error": "Failed to list users"}), 500


@users_bp.post("")
def create_user():
    """Create a new user. Only super admins can create admins."""
    # Require admin or super_admin to create users
    current_user, error, status = require_role(["admin", "super_admin"])
    if error:
        return error, status
    
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    role = data.get("role", "parent").lower()
    
    if not name or not email:
        return jsonify({"error": "name and email are required"}), 400
    
    # Authorization check: Only super admins can create admins
    if role == "admin" and not is_super_admin(current_user):
        return jsonify({
            "error": "Insufficient permissions",
            "message": "Only super admins can create admin users"
        }), 403
    
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500
    
    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500
    
    try:
        # Check if user already exists
        existing = (
            client.table("users")
            .select("user_id")
            .eq("church_id", church_id)
            .eq("email", email)
            .execute()
        )
        if existing.data:
            return jsonify({"error": "User with this email already exists"}), 400
        
        # Create user with default password_hash (will be set when user sets password)
        import hashlib
        default_password = "pending_password"  # Temporary, user must set password
        password_hash = hashlib.sha256(default_password.encode()).hexdigest()
        
        # Normalize role for database (SuperAdmin in DB, super_admin in frontend)
        db_role = role.capitalize()
        if db_role.lower() == "super_admin":
            db_role = "SuperAdmin"
        
        user_data = {
            "church_id": church_id,
            "name": name,
            "email": email,
            "role": db_role,
            "password_hash": password_hash,
            "is_active": True,
            "mfa_enabled": False,
            "password_set": False,  # New admins must change password on first login
        }
        
        res = client.table("users").insert(user_data).execute()
        if not res.data:
            return jsonify({"error": "Failed to create user"}), 500
        
        user = res.data[0]
        # Normalize role for response
        user_role = user.get("role", "").lower()
        if user_role == "superadmin":
            user_role = "super_admin"
        
        return jsonify({
            "data": {
                "id": user["user_id"],
                "email": user.get("email", ""),
                "role": user_role,
                "name": user.get("name"),
                "isActive": user.get("is_active", True),
            }
        }), 201
    except Exception as exc:
        print(f"⚠️ Error creating user: {exc}")
        return jsonify({"error": "Failed to create user"}), 500


@users_bp.get("/<user_id>")
def get_user(user_id: str):
    """Get a specific user."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("users")
            .select("*")
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "User not found"}), 404
        row = res.data[0]
        return jsonify({"data": {
            "id": row["user_id"],
            "email": row.get("email", ""),
            "role": row.get("role", "").lower(),
            "name": row.get("name"),
            "isActive": row.get("is_active", True),
            "mfaEnabled": row.get("mfa_enabled", False),
        }})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting user: {exc}")
        return jsonify({"error": "Failed to get user"}), 500


@users_bp.put("/<user_id>")
def update_user(user_id: str):
    """Update a user. Only super admins can update admin roles."""
    # Require admin or super_admin to update users
    current_user, error, status = require_role(["admin", "super_admin"])
    if error:
        return error, status
    
    data = request.get_json() or {}
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Check if trying to update role to admin
        if "role" in data:
            new_role = data.get("role", "").lower()
            # Only super admins can change roles to/from admin
            if new_role == "admin" and not is_super_admin(current_user):
                return jsonify({
                    "error": "Insufficient permissions",
                    "message": "Only super admins can assign admin roles"
                }), 403
            
            # Also check if updating an existing admin
            existing_user_res = (
                client.table("users")
                .select("role")
                .eq("user_id", user_id)
                .eq("church_id", church_id)
                .execute()
            )
            if existing_user_res.data:
                existing_role = existing_user_res.data[0].get("role", "").lower()
                if existing_role == "admin" or existing_role == "superadmin":
                    if not is_super_admin(current_user):
                        return jsonify({
                            "error": "Insufficient permissions",
                            "message": "Only super admins can modify admin users"
                        }), 403

        update_data = {}
        if "name" in data:
            update_data["name"] = data["name"]
        if "role" in data:
            # Normalize role for database
            role = data["role"].capitalize()
            if role.lower() == "super_admin":
                role = "SuperAdmin"
            update_data["role"] = role
        if "email" in data:
            update_data["email"] = data["email"]

        if not update_data:
            return jsonify({"error": "No fields to update"}), 400

        res = (
            client.table("users")
            .update(update_data)
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "User not found"}), 404
        return get_user(user_id)
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error updating user: {exc}")
        return jsonify({"error": "Failed to update user"}), 500


@users_bp.post("/<user_id>/suspend")
def suspend_user(user_id: str):
    """Suspend a user. Requires admin or super_admin. Only super admins can suspend admins."""
    # Require admin or super_admin to suspend users
    current_user, error, status = require_role(["admin", "super_admin"])
    if error:
        return error, status
    
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Check if trying to suspend an admin (only super admins can do this)
        target_user_res = (
            client.table("users")
            .select("role")
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .execute()
        )
        if target_user_res.data:
            target_role = target_user_res.data[0].get("role", "").lower()
            if (target_role == "admin" or target_role == "superadmin") and not is_super_admin(current_user):
                return jsonify({
                    "error": "Insufficient permissions",
                    "message": "Only super admins can suspend admin users"
                }), 403
        
        res = (
            client.table("users")
            .update({"is_active": False})
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"data": {"success": True}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error suspending user: {exc}")
        return jsonify({"error": "Failed to suspend user"}), 500


@users_bp.post("/<user_id>/activate")
def activate_user(user_id: str):
    """Activate a user. Requires admin or super_admin. Only super admins can activate admins."""
    # Require admin or super_admin to activate users
    current_user, error, status = require_role(["admin", "super_admin"])
    if error:
        return error, status
    
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Check if trying to activate an admin (only super admins can do this)
        target_user_res = (
            client.table("users")
            .select("role")
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .execute()
        )
        if target_user_res.data:
            target_role = target_user_res.data[0].get("role", "").lower()
            if (target_role == "admin" or target_role == "superadmin") and not is_super_admin(current_user):
                return jsonify({
                    "error": "Insufficient permissions",
                    "message": "Only super admins can activate admin users"
                }), 403
        
        res = (
            client.table("users")
            .update({"is_active": True})
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"data": {"success": True}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error activating user: {exc}")
        return jsonify({"error": "Failed to activate user"}), 500


@users_bp.put("/profile")
def update_profile():
    """Update current user's profile.
    
    Note: Currently requires user_id in request body.
    TODO: Extract user_id from Authorization token when auth middleware is implemented.
    """
    data = request.get_json() or {}
    user_id = data.get("userId") or data.get("user_id")  # From auth token in real app

    if not user_id:
        return jsonify({
            "error": "user_id is required in request body. Include 'userId' or 'user_id' field. In production, this will be extracted from auth token."
        }), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        update_data = {}
        if "name" in data:
            update_data["name"] = data["name"]
        if "phone" in data:
            update_data["phone"] = data["phone"]
        if "address" in data:
            update_data["address"] = data["address"]
        if "email" in data:
            update_data["email"] = data["email"]
        # Note: firstName, lastName, gender, relationship, age are not stored in users table
        # These might be stored elsewhere (e.g., guardians table for parents) or not needed

        if not update_data:
            return jsonify({"error": "No fields to update"}), 400

        res = (
            client.table("users")
            .update(update_data)
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "User not found"}), 404
        
        row = res.data[0]
        return jsonify({"data": {
            "id": row["user_id"],
            "email": row.get("email", ""),
            "role": row.get("role", "").lower(),
            "name": row.get("name"),
            "phone": row.get("phone"),
            "address": row.get("address"),
            "isActive": row.get("is_active", True),
        }})
    except Exception as exc:
        print(f"⚠️ Error updating profile: {exc}")
        return jsonify({"error": "Failed to update user"}), 500


@users_bp.post("/change-password")
def change_password():
    """Change user's password.
    
    Requires current password verification and new password.
    Note: Currently requires user_id in request body.
    TODO: Extract user_id from Authorization token when auth middleware is implemented.
    """
    data = request.get_json() or {}
    user_id = data.get("userId") or data.get("user_id")
    current_password = data.get("currentPassword") or data.get("current_password")
    new_password = data.get("newPassword") or data.get("new_password")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    if not current_password or not new_password:
        return jsonify({"error": "current_password and new_password are required"}), 400
    
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get user to verify current password
        res = (
            client.table("users")
            .select("user_id, password_hash")
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not res.data:
            return jsonify({"error": "User not found"}), 404
        
        # Verify current password (simple hash comparison for now)
        # In production, use proper password hashing (bcrypt, etc.)
        import hashlib
        current_hash = hashlib.sha256(current_password.encode()).hexdigest()
        stored_hash = res.data[0].get("password_hash", "")
        
        # For development: accept "password123" as current password
        # In production, verify against stored hash properly
        if current_password != "password123" and current_hash != stored_hash:
            # Try to verify against stored hash
            if stored_hash and stored_hash != "pending_password" and current_hash != stored_hash:
                return jsonify({"error": "Current password is incorrect"}), 401
        
        # Update password and mark as set
        new_hash = hashlib.sha256(new_password.encode()).hexdigest()
        update_res = (
            client.table("users")
            .update({
                "password_hash": new_hash,
                "password_set": True,  # Mark password as set
            })
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not update_res.data:
            return jsonify({"error": "Failed to update password"}), 500
        
        return jsonify({"data": {"success": True, "message": "Password changed successfully"}})
    except Exception as exc:
        print(f"⚠️ Error changing password: {exc}")
        return jsonify({"error": "Failed to change password"}), 500


@users_bp.post("/resend-invitation")
def resend_invitation():
    """Resend invitation email to a user."""
    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return jsonify({"error": "email is required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Check if user exists
        res = (
            client.table("users")
            .select("user_id, email, name")
            .eq("church_id", church_id)
            .eq("email", email)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "User not found"}), 404

        # Create notification for invitation (email sending will be implemented later)
        from utils.notifications import create_notification
        create_notification(
            notification_type="Reminder",
            title="Account Invitation",
            content=f"An account has been created for you. Please set your password to get started.",
            user_id=res.data[0].get("user_id"),
            metadata={"action": "invitation", "email": email},
        )
        
        return jsonify({"data": {"success": True, "message": "Invitation sent"}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error resending invitation: {exc}")
        return jsonify({"error": "Failed to resend invitation"}), 500

