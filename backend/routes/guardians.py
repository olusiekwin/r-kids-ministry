"""
Guardians Routes - For secondary guardians (Phase 6B from USER_CASE_FLOW.md)
Primary guardians are handled in routes/parents.py
"""

from datetime import datetime, timedelta
import secrets

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

guardians_bp = Blueprint("guardians", __name__)


@guardians_bp.get("")
def list_guardians():
    """List guardians, optionally filtered by child_id."""
    child_id = request.args.get("child_id") or request.args.get("childId")

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        if child_id:
            # Get guardians for a specific child (Phase 6B.2)
            res = (
                client.table("child_guardians")
                .select("*, guardians(*), children(name)")
                .eq("child_id", child_id)
                .eq("is_authorized", True)
                .execute()
            )
            guardians = []
            for row in res.data or []:
                guardian = row.get("guardians")
                child = row.get("children")
                if guardian:
                    guardians.append({
                        "id": guardian["guardian_id"],
                        "childId": child_id,
                        "childName": child.get("name") if child else None,
                        "name": guardian.get("name", ""),
                        "email": guardian.get("email"),
                        "phone": guardian.get("phone"),
                        "relationship": row.get("relationship"),
                        "isAuthorized": row.get("is_authorized", True),
                        "expiresAt": row.get("expires_at"),
                    })
            return jsonify({"data": guardians})
        else:
            # List all guardians (primary + secondary)
            res = (
                client.table("guardians")
                .select("*")
                .eq("church_id", church_id)
                .execute()
            )
            guardians = []
            for row in res.data or []:
                guardians.append({
                    "id": row["guardian_id"],
                    "parentId": row.get("parent_id", ""),
                    "name": row.get("name", ""),
                    "email": row.get("email"),
                    "phone": row.get("phone"),
                    "relationship": row.get("relationship", "Primary"),
                    "isPrimary": row.get("is_primary", False),
                    "activeUntil": row.get("active_until"),
                })
            return jsonify({"data": guardians})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing guardians: {exc}")
        return jsonify({"error": "Failed to list guardians"}), 500


@guardians_bp.post("")
def create_guardian():
    """Create a secondary guardian for a child - Phase 6B.1 from USER_CASE_FLOW.md."""
    data = request.get_json() or {}
    child_id = data.get("child_id") or data.get("childId")
    name = data.get("name")
    relationship = data.get("relationship")

    if not child_id or not name or not relationship:
        return jsonify({"error": "child_id, name, and relationship are required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        email = (data.get("email") or "").strip() or None
        phone = (data.get("phone") or "").strip() or None

        # Validate for duplicate email
        if email:
            existing_email = (
                client.table("guardians")
                .select("guardian_id, name")
                .eq("church_id", church_id)
                .eq("email", email)
                .limit(1)
                .execute()
            )
            if existing_email.data:
                return jsonify({
                    "error": f"Email '{email}' is already registered to {existing_email.data[0].get('name', 'another guardian')}"
                }), 400

        # Validate for duplicate phone
        if phone:
            existing_phone = (
                client.table("guardians")
                .select("guardian_id, name")
                .eq("church_id", church_id)
                .eq("phone", phone)
                .limit(1)
                .execute()
            )
            if existing_phone.data:
                return jsonify({
                    "error": f"Phone number '{phone}' is already registered to {existing_phone.data[0].get('name', 'another guardian')}"
                }), 400

        # Create guardian record
        guardian_data = {
            "church_id": church_id,
            "parent_id": f"SEC_{secrets.token_hex(4).upper()}",  # Generate unique parent_id
            "name": name,
            "email": email,
            "phone": phone,
            "relationship": "Secondary",
            "is_primary": False,
            "photo_url": data.get("photoUrl") or data.get("photo_url"),
        }
        if data.get("activeUntil") or data.get("active_until"):
            guardian_data["active_until"] = data.get("activeUntil") or data.get("active_until")

        guardian_res = (
            client.table("guardians")
            .insert(guardian_data)
            .execute()
        )
        if not guardian_res.data:
            return jsonify({"error": "Failed to create guardian"}), 500

        guardian_id = guardian_res.data[0]["guardian_id"]

        # Link guardian to child
        link_data = {
            "child_id": child_id,
            "guardian_id": guardian_id,
            "relationship": relationship,
            "is_authorized": True,
        }
        if data.get("expiresAt") or data.get("expires_at"):
            link_data["expires_at"] = data.get("expiresAt") or data.get("expires_at")

        link_res = (
            client.table("child_guardians")
            .insert(link_data)
            .execute()
        )

        return jsonify({
            "data": {
                "id": guardian_id,
                "childId": child_id,
                "name": name,
                "relationship": relationship,
                "isAuthorized": True,
            }
        }), 201
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error creating guardian: {exc}")
        return jsonify({"error": "Failed to create guardian"}), 500


@guardians_bp.get("/<guardian_id>")
def get_guardian(guardian_id: str):
    """Get a specific guardian."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("guardians")
            .select("*")
            .eq("guardian_id", guardian_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Guardian not found"}), 404
        row = res.data[0]
        return jsonify({"data": {
            "id": row["guardian_id"],
            "parentId": row.get("parent_id", ""),
            "name": row.get("name", ""),
            "email": row.get("email"),
            "phone": row.get("phone"),
            "relationship": row.get("relationship", "Primary"),
            "isPrimary": row.get("is_primary", False),
            "activeUntil": row.get("active_until"),
        }})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting guardian: {exc}")
        return jsonify({"error": "Failed to get guardian"}), 500


@guardians_bp.post("/<guardian_id>/renew")
def renew_guardian(guardian_id: str):
    """Renew guardian authorization - extend expiry date."""
    data = request.get_json() or {}
    days = data.get("days", 365)  # Default 1 year

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    try:
        new_expiry = (datetime.utcnow() + timedelta(days=days)).isoformat()
        res = (
            client.table("guardians")
            .update({"active_until": new_expiry})
            .eq("guardian_id", guardian_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Guardian not found"}), 404
        return jsonify({"data": {"activeUntil": new_expiry}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error renewing guardian: {exc}")
        return jsonify({"error": "Failed to renew guardian"}), 500

