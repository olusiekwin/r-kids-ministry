"""Audit Routes - Phase 7 from USER_CASE_FLOW.md"""

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

audit_bp = Blueprint("audit", __name__)


@audit_bp.get("")
def list_audit_logs():
    """List audit logs with optional filters."""
    user_id = request.args.get("user_id") or request.args.get("userId")
    action = request.args.get("action")
    limit = int(request.args.get("limit", 100))

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        query = (
            client.table("audit_logs")
            .select("*, users(email, name)")
            .eq("church_id", church_id)
        )
        if user_id:
            query = query.eq("user_id", user_id)
        if action:
            query = query.eq("action_performed", action)

        res = query.order("timestamp", desc=True).limit(limit).execute()
        logs = []
        for row in res.data or []:
            user = row.get("users")
            logs.append({
                "id": row["log_id"],
                "userId": row.get("user_id"),
                "userEmail": user.get("email") if user else None,
                "userName": user.get("name") if user else None,
                "actionPerformed": row.get("action_performed", ""),
                "entityType": row.get("entity_type"),
                "entityId": row.get("entity_id"),
                "ipAddress": row.get("ip_address"),
                "userAgent": row.get("user_agent"),
                "details": row.get("details", {}),
                "timestamp": row.get("timestamp"),
            })
        return jsonify({"data": logs})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing audit logs: {exc}")
        return jsonify({"error": "Failed to list audit logs"}), 500


@audit_bp.get("/<log_id>")
def get_audit_log(log_id: str):
    """Get a specific audit log."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("audit_logs")
            .select("*, users(email, name)")
            .eq("log_id", log_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Audit log not found"}), 404
        row = res.data[0]
        user = row.get("users")
        return jsonify({"data": {
            "id": row["log_id"],
            "userId": row.get("user_id"),
            "userEmail": user.get("email") if user else None,
            "userName": user.get("name") if user else None,
            "actionPerformed": row.get("action_performed", ""),
            "entityType": row.get("entity_type"),
            "entityId": row.get("entity_id"),
            "ipAddress": row.get("ip_address"),
            "userAgent": row.get("user_agent"),
            "details": row.get("details", {}),
            "timestamp": row.get("timestamp"),
        }})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting audit log: {exc}")
        return jsonify({"error": "Failed to get audit log"}), 500


@audit_bp.get("/export")
def export_audit_logs():
    """Export audit logs (returns JSON, can be extended to CSV/Excel)."""
    return list_audit_logs()  # For now, same as list

