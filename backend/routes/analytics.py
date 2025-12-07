"""Analytics Routes - Phase 7 from USER_CASE_FLOW.md"""

from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/group/<group_name>")
def group_analytics(group_name: str):
    """Get analytics for a specific group."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get group
        group_res = (
            client.table("groups")
            .select("*")
            .eq("church_id", church_id)
            .eq("name", group_name)
            .execute()
        )
        if not group_res.data:
            return jsonify({"error": "Group not found"}), 404

        group_id = group_res.data[0]["group_id"]

        # Get attendance stats for last 30 days
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).date().isoformat()
        attendance_res = (
            client.table("attendance_summary")
            .select("*")
            .eq("group_id", group_id)
            .eq("church_id", church_id)
            .gte("date", thirty_days_ago)
            .execute()
        )

        total_present = sum(row.get("present_count", 0) for row in attendance_res.data or [])
        avg_attendance = total_present / 30 if attendance_res.data else 0

        return jsonify({
            "data": {
                "groupName": group_name,
                "groupId": group_id,
                "totalPresent": total_present,
                "averageAttendance": round(avg_attendance, 2),
                "attendanceRecords": attendance_res.data or [],
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting group analytics: {exc}")
        return jsonify({"error": "Failed to get group analytics"}), 500


@analytics_bp.get("/teacher")
def teacher_analytics():
    """Get analytics for current teacher (from auth token)."""
    teacher_id = request.args.get("teacher_id") or request.args.get("teacherId")

    if not teacher_id:
        return jsonify({"error": "teacher_id is required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get groups assigned to teacher
        groups_res = (
            client.table("groups")
            .select("group_id, name")
            .eq("church_id", church_id)
            .eq("teacher_id", teacher_id)
            .execute()
        )

        # Get check-in records for teacher
        today = datetime.utcnow().date().isoformat()
        checkins_res = (
            client.table("check_in_records")
            .select("child_id", count="exact")
            .eq("church_id", church_id)
            .eq("teacher_id", teacher_id)
            .gte("timestamp_in", today)
            .execute()
        )

        return jsonify({
            "data": {
                "teacherId": teacher_id,
                "groupsCount": len(groups_res.data or []),
                "groups": groups_res.data or [],
                "checkInsToday": checkins_res.count if hasattr(checkins_res, "count") else len(checkins_res.data or []),
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting teacher analytics: {exc}")
        return jsonify({"error": "Failed to get teacher analytics"}), 500


@analytics_bp.get("/admin")
def admin_analytics():
    """Get admin-level analytics - Phase 7 from USER_CASE_FLOW.md."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Count children (no status column in schema)
        children_res = (
            client.table("children")
            .select("child_id", count="exact")
            .eq("church_id", church_id)
            .execute()
        )

        # Count active check-ins today
        today = datetime.utcnow().date().isoformat()
        checkins_res = (
            client.table("check_in_records")
            .select("record_id", count="exact")
            .eq("church_id", church_id)
            .gte("timestamp_in", today)
            .is_("timestamp_out", "null")
            .execute()
        )

        return jsonify({
            "data": {
                "totalChildren": children_res.count if hasattr(children_res, "count") else len(children_res.data or []),
                "checkedInToday": checkins_res.count if hasattr(checkins_res, "count") else len(checkins_res.data or []),
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting admin analytics: {exc}")
        return jsonify({"error": "Failed to get admin analytics"}), 500


@analytics_bp.get("/child/<child_id>")
def child_analytics(child_id: str):
    """Get analytics for a specific child."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get check-in records for last 30 days
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).date().isoformat()
        checkins_res = (
            client.table("check_in_records")
            .select("*")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .gte("timestamp_in", thirty_days_ago)
            .execute()
        )

        attendance_count = len(checkins_res.data or [])
        attendance_rate = (attendance_count / 30) * 100 if checkins_res.data else 0

        return jsonify({
            "data": {
                "childId": child_id,
                "attendanceCount": attendance_count,
                "attendanceRate": round(attendance_rate, 2),
                "recentCheckIns": checkins_res.data or [],
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting child analytics: {exc}")
        return jsonify({"error": "Failed to get child analytics"}), 500

