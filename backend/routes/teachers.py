"""
Teacher Routes - Role-specific endpoints for teachers
Teachers can only access data for their assigned groups.
"""

from datetime import datetime

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

teachers_bp = Blueprint("teachers", __name__)


@teachers_bp.get("/groups")
def get_teacher_groups():
    """
    Get groups assigned to a teacher.
    Teacher ID should come from auth token in production.
    """
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
        res = (
            client.table("groups")
            .select("*, users(name, email)")
            .eq("church_id", church_id)
            .eq("teacher_id", teacher_id)
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
        print(f"⚠️ Error getting teacher groups: {exc}")
        return jsonify({"error": "Failed to get teacher groups"}), 500


@teachers_bp.get("/children")
def get_teacher_children():
    """
    Get children in teacher's assigned groups.
    Teacher ID should come from auth token in production.
    """
    teacher_id = request.args.get("teacher_id") or request.args.get("teacherId")
    group_id = request.args.get("group_id") or request.args.get("groupId")

    if not teacher_id:
        return jsonify({"error": "teacher_id is required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # First, get teacher's groups
        groups_res = (
            client.table("groups")
            .select("group_id")
            .eq("church_id", church_id)
            .eq("teacher_id", teacher_id)
            .execute()
        )
        
        teacher_group_ids = [g["group_id"] for g in (groups_res.data or [])]
        
        if not teacher_group_ids:
            return jsonify({"data": []})  # No groups assigned

        # Filter by specific group if provided
        if group_id:
            if group_id not in teacher_group_ids:
                return jsonify({"error": "Group not assigned to this teacher"}), 403
            group_ids = [group_id]
        else:
            group_ids = teacher_group_ids

        # Get children in teacher's groups
        # Note: children table doesn't have a status column, so we don't filter by status
        res = (
            client.table("children")
            .select("*, groups(name)")
            .eq("church_id", church_id)
            .in_("group_id", group_ids)
            .execute()
        )
        
        from routes.children import _calculate_age
        children = []
        for row in res.data or []:
            group = row.get("groups")
            children.append({
                "id": row["child_id"],
                "registrationId": row.get("registration_id", ""),
                "name": row.get("name", ""),
                "dateOfBirth": row.get("date_of_birth"),
                "age": _calculate_age(row.get("date_of_birth")),
                "group": group.get("name") if group else None,
                "parentId": str(row.get("parent_id", "")),
                "gender": row.get("gender"),
            })
        return jsonify({"data": children})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting teacher children: {exc}")
        return jsonify({"error": "Failed to get teacher children"}), 500


@teachers_bp.get("/checkins")
def get_teacher_checkins():
    """
    Get check-in records for teacher's groups (today).
    Teacher ID should come from auth token in production.
    """
    teacher_id = request.args.get("teacher_id") or request.args.get("teacherId")
    date_filter = request.args.get("date")  # Optional date filter

    if not teacher_id:
        return jsonify({"error": "teacher_id is required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get check-in records for this teacher
        query = (
            client.table("check_in_records")
            .select("*, children(name, registration_id, group_id), guardians(name)")
            .eq("church_id", church_id)
            .eq("teacher_id", teacher_id)
        )
        
        if date_filter:
            query = query.gte("timestamp_in", date_filter)
        else:
            # Default to today
            today = datetime.utcnow().date().isoformat()
            query = query.gte("timestamp_in", today)

        res = query.order("timestamp_in", desc=True).execute()
        
        records = []
        for row in res.data or []:
            child = row.get("children")
            guardian = row.get("guardians")
            records.append({
                "id": row["record_id"],
                "childId": row.get("child_id"),
                "childName": child.get("name") if child else None,
                "registrationId": child.get("registration_id") if child else None,
                "guardianId": row.get("guardian_id"),
                "guardianName": guardian.get("name") if guardian else None,
                "timestampIn": row.get("timestamp_in"),
                "timestampOut": row.get("timestamp_out"),
                "method": row.get("method"),
                "checkedOut": row.get("timestamp_out") is not None,
            })
        return jsonify({"data": records})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting teacher check-ins: {exc}")
        return jsonify({"error": "Failed to get teacher check-ins"}), 500


@teachers_bp.get("/dashboard")
def teacher_dashboard():
    """
    Get dashboard data for teacher: groups, today's check-ins, stats.
    Teacher ID should come from auth token in production.
    """
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
        # Get groups
        groups_res = (
            client.table("groups")
            .select("group_id, name")
            .eq("church_id", church_id)
            .eq("teacher_id", teacher_id)
            .execute()
        )
        groups = groups_res.data or []

        # Get today's check-ins
        today = datetime.utcnow().date().isoformat()
        checkins_res = (
            client.table("check_in_records")
            .select("record_id", count="exact")
            .eq("church_id", church_id)
            .eq("teacher_id", teacher_id)
            .gte("timestamp_in", today)
            .execute()
        )
        checkins_today = checkins_res.count if hasattr(checkins_res, "count") else len(checkins_res.data or [])

        # Get active check-ins (not checked out)
        active_checkins_res = (
            client.table("check_in_records")
            .select("record_id", count="exact")
            .eq("church_id", church_id)
            .eq("teacher_id", teacher_id)
            .gte("timestamp_in", today)
            .is_("timestamp_out", "null")
            .execute()
        )
        active_checkins = active_checkins_res.count if hasattr(active_checkins_res, "count") else len(active_checkins_res.data or [])

        return jsonify({
            "data": {
                "teacherId": teacher_id,
                "groups": groups,
                "groupsCount": len(groups),
                "checkInsToday": checkins_today,
                "activeCheckIns": active_checkins,
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting teacher dashboard: {exc}")
        return jsonify({"error": "Failed to get teacher dashboard"}), 500

