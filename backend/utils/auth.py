"""Authentication and Authorization Utilities"""

from flask import request, jsonify
from typing import Optional, Dict, Any
from routes.auth import users_db
from supabase_client import get_supabase, get_default_church_id


def get_current_user() -> Optional[Dict[str, Any]]:
    """
    Extract current user from Authorization token.
    Returns user dict with id, email, role, name, etc. or None if not authenticated.
    
    Token format: token_{email}_{timestamp}
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header[7:].strip()
    if not token:
        return None
    
    # Extract email from token (format: token_{email}_{timestamp})
    # Split by last underscore to separate timestamp
    if not token.startswith("token_"):
        return None
    
    # Remove "token_" prefix
    token_part = token[6:]  # Remove "token_"
    
    # Find last underscore (timestamp separator)
    last_underscore_idx = token_part.rfind("_")
    if last_underscore_idx == -1:
        return None
    
    # Extract email (everything before last underscore)
    email = token_part[:last_underscore_idx]
    
    # First check in-memory store (faster)
    if email in users_db:
        return users_db[email]
    
    # If not in memory, fetch from Supabase
    client = get_supabase()
    if client:
        try:
            church_id = get_default_church_id()
            if church_id:
                res = (
                    client.table("users")
                    .select("user_id, email, role, name, profile_updated, is_active")
                    .eq("church_id", church_id)
                    .eq("email", email)
                    .limit(1)
                    .execute()
                )
                if res.data:
                    db_user = res.data[0]
                    user = {
                        "id": db_user["user_id"],
                        "email": db_user.get("email", email),
                        "role": db_user.get("role", "").lower().replace("superadmin", "super_admin") if db_user.get("role") else "parent",
                        "name": db_user.get("name") or email.split("@")[0].title(),
                        "profile_updated": db_user.get("profile_updated", False),
                        "is_active": db_user.get("is_active", True),
                    }
                    # Cache in memory for faster subsequent lookups
                    users_db[email] = user
                    return user
        except Exception as exc:
            print(f"⚠️ Error fetching user from token: {exc}")
    
    return None


def require_auth():
    """
    Decorator helper - returns current user or raises 401.
    Use this in routes that require authentication.
    """
    user = get_current_user()
    if not user:
        return None, jsonify({"error": "Authentication required"}), 401
    return user, None, None


def require_role(allowed_roles: list[str]):
    """
    Check if current user has one of the allowed roles.
    Returns (user, None, None) if authorized, or (None, error_response, status_code) if not.
    
    Args:
        allowed_roles: List of allowed roles (e.g., ['admin', 'super_admin'])
    
    Usage:
        user, error, status = require_role(['admin', 'super_admin'])
        if error:
            return error, status
    """
    user, error, status = require_auth()
    if error:
        return None, error, status
    
    user_role = user.get("role", "").lower()
    
    # Normalize role names
    normalized_allowed = [r.lower().replace("superadmin", "super_admin") for r in allowed_roles]
    
    # Super admins can access admin routes
    if user_role == "super_admin" and "admin" in normalized_allowed:
        return user, None, None
    
    if user_role not in normalized_allowed:
        return None, jsonify({
            "error": "Insufficient permissions",
            "message": f"This action requires one of these roles: {', '.join(allowed_roles)}"
        }), 403
    
    return user, None, None


def is_super_admin(user: Optional[Dict[str, Any]]) -> bool:
    """Check if user is a super admin."""
    if not user:
        return False
    role = user.get("role", "").lower()
    return role == "super_admin" or role == "superadmin"


def is_admin_or_super_admin(user: Optional[Dict[str, Any]]) -> bool:
    """Check if user is an admin or super admin."""
    if not user:
        return False
    role = user.get("role", "").lower()
    return role in ["admin", "super_admin", "superadmin"]
