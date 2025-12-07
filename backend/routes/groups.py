"""
Groups Routes - For managing children's groups (Little Angels, Saints, Disciples, Trendsetters)
Needed for auto-assignment by age in Phase 1.
"""

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

groups_bp = Blueprint("groups", __name__)


@groups_bp.get("")
def list_groups():
    """List all groups for the church."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("groups")
            .select("*, users(name, email)")
            .eq("church_id", church_id)
            .order("age_range_min")
            .execute()
        )
        groups = []
        for row in res.data or []:
            teacher = row.get("users")
            groups.append({
                "id": row["group_id"],
                "name": row.get("name", ""),
                "ageRangeMin": row.get("age_range_min", 0),
                "ageRangeMax": row.get("age_range_max", 0),
                "room": row.get("room"),
                "schedule": row.get("schedule"),
                "teacherId": row.get("teacher_id"),
                "teacherName": teacher.get("name") if teacher else None,
            })
        return jsonify({"data": groups})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing groups: {exc}")
        return jsonify({"error": "Failed to list groups"}), 500


@groups_bp.post("")
def create_group():
    """Create a new group."""
    data = request.get_json() or {}
    name = data.get("name")
    age_range_min = data.get("ageRangeMin") or data.get("age_range_min")
    age_range_max = data.get("ageRangeMax") or data.get("age_range_max")

    if not name or age_range_min is None or age_range_max is None:
        return jsonify({"error": "name, ageRangeMin, and ageRangeMax are required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("groups")
            .insert({
                "church_id": church_id,
                "name": name,
                "age_range_min": age_range_min,
                "age_range_max": age_range_max,
                "room": data.get("room"),
                "schedule": data.get("schedule"),
                "teacher_id": data.get("teacherId") or data.get("teacher_id"),
            })
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Failed to create group"}), 500
        return jsonify({"data": {
            "id": res.data[0]["group_id"],
            "name": res.data[0].get("name"),
            "ageRangeMin": res.data[0].get("age_range_min"),
            "ageRangeMax": res.data[0].get("age_range_max"),
        }}), 201
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error creating group: {exc}")
        return jsonify({"error": "Failed to create group"}), 500


@groups_bp.get("/<group_id>")
def get_group(group_id: str):
    """Get a specific group."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("groups")
            .select("*, users(name, email)")
            .eq("group_id", group_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Group not found"}), 404
        row = res.data[0]
        teacher = row.get("users")
        return jsonify({"data": {
            "id": row["group_id"],
            "name": row.get("name", ""),
            "ageRangeMin": row.get("age_range_min", 0),
            "ageRangeMax": row.get("age_range_max", 0),
            "room": row.get("room"),
            "schedule": row.get("schedule"),
            "teacherId": row.get("teacher_id"),
            "teacherName": teacher.get("name") if teacher else None,
        }})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting group: {exc}")
        return jsonify({"error": "Failed to get group"}), 500


@groups_bp.put("/<group_id>")
def update_group(group_id: str):
    """Update a group."""
    data = request.get_json() or {}
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
        if "ageRangeMin" in data or "age_range_min" in data:
            update_data["age_range_min"] = data.get("ageRangeMin") or data.get("age_range_min")
        if "ageRangeMax" in data or "age_range_max" in data:
            update_data["age_range_max"] = data.get("ageRangeMax") or data.get("age_range_max")
        if "room" in data:
            update_data["room"] = data["room"]
        if "schedule" in data:
            update_data["schedule"] = data["schedule"]
        if "teacherId" in data or "teacher_id" in data:
            teacher_id_value = data.get("teacherId") or data.get("teacher_id")
            # Allow None/null to unassign teacher
            if teacher_id_value is None or teacher_id_value == "":
                update_data["teacher_id"] = None
            else:
                update_data["teacher_id"] = teacher_id_value

        if not update_data:
            return jsonify({"error": "No fields to update"}), 400

        res = (
            client.table("groups")
            .update(update_data)
            .eq("group_id", group_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Group not found"}), 404
        return get_group(group_id)
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error updating group: {exc}")
        return jsonify({"error": "Failed to update group"}), 500


@groups_bp.delete("/<group_id>")
def delete_group(group_id: str):
    """Delete a group."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("groups")
            .delete()
            .eq("group_id", group_id)
            .eq("church_id", church_id)
            .execute()
        )
        return jsonify({"data": {"success": True}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error deleting group: {exc}")
        return jsonify({"error": "Failed to delete group"}), 500


@groups_bp.get("/<group_id>/stats")
def group_stats(group_id: str):
    """Get statistics for a group - Phase 7 from USER_CASE_FLOW.md."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get group info
        group_res = (
            client.table("groups")
            .select("*")
            .eq("group_id", group_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not group_res.data:
            return jsonify({"error": "Group not found"}), 404

        # Count children in group
        children_res = (
            client.table("children")
            .select("child_id", count="exact")
            .eq("group_id", group_id)
            .eq("church_id", church_id)
            .eq("status", "active")
            .execute()
        )
        children_count = children_res.count if hasattr(children_res, "count") else len(children_res.data or [])

        # Get recent attendance summary
        from datetime import date
        today = date.today().isoformat()
        attendance_res = (
            client.table("attendance_summary")
            .select("*")
            .eq("group_id", group_id)
            .eq("church_id", church_id)
            .order("date", desc=True)
            .limit(7)
            .execute()
        )

        return jsonify({
            "data": {
                "groupId": group_id,
                "groupName": group_res.data[0].get("name"),
                "childrenCount": children_count,
                "recentAttendance": attendance_res.data or [],
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting group stats: {exc}")
        return jsonify({"error": "Failed to get group stats"}), 500

