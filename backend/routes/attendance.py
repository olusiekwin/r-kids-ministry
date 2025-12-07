"""Attendance Routes - Phase 4 & 7 from USER_CASE_FLOW.md"""

from datetime import datetime, date

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.get("")
def list_attendance():
    """List attendance records with optional filters."""
    child_id = request.args.get("child_id") or request.args.get("childId")
    group = request.args.get("group")
    attendance_date = request.args.get("date") or request.args.get("date")

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        if attendance_date:
            # Get attendance summary for a specific date
            res = (
                client.table("attendance_summary")
                .select("*, groups(name)")
                .eq("church_id", church_id)
                .eq("date", attendance_date)
                .execute()
            )
            summaries = []
            for row in res.data or []:
                group = row.get("groups")
                summaries.append({
                    "id": row["summary_id"],
                    "groupId": row.get("group_id"),
                    "groupName": group.get("name") if group else None,
                    "date": row.get("date"),
                    "presentCount": row.get("present_count", 0),
                    "absentCount": row.get("absent_count", 0),
                })
            return jsonify({"data": summaries})
        else:
            # Get check-in records (actual attendance)
            group_id_filter = None
            if group:
                # If group is a UUID, use it directly; otherwise look up by name
                import uuid
                try:
                    # Try to parse as UUID
                    group_id_filter = str(uuid.UUID(group))
                except ValueError:
                    # Not a UUID, so it's a group name - look up the group
                    group_res = (
                        client.table("groups")
                        .select("group_id")
                        .eq("church_id", church_id)
                        .eq("name", group)
                        .limit(1)
                        .execute()
                    )
                    if group_res.data:
                        group_id_filter = group_res.data[0]["group_id"]
                    else:
                        # Group not found, return empty
                        return jsonify({"data": []})
            
            # If filtering by group, first get child IDs for that group
            child_ids = None
            if group_id_filter:
                children_res = (
                    client.table("children")
                    .select("child_id")
                    .eq("church_id", church_id)
                    .eq("group_id", group_id_filter)
                    .execute()
                )
                child_ids = [c["child_id"] for c in (children_res.data or [])]
                if not child_ids:
                    # No children in this group, return empty
                    return jsonify({"data": []})
            
            # Build query for check-in records
            query = (
                client.table("check_in_records")
                .select("*, children(name, registration_id), guardians(name)")
                .eq("church_id", church_id)
            )
            if child_id:
                # Validate child_id is a UUID, not an email
                import re
                uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
                if uuid_pattern.match(child_id):
                    query = query.eq("child_id", child_id)
                else:
                    # Invalid child_id (likely an email), return empty result
                    return jsonify({"data": []})
            elif child_ids:
                # Filter by multiple child IDs (for group filter)
                query = query.in_("child_id", child_ids)

            res = query.order("timestamp_in", desc=True).limit(100).execute()
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
                })
            return jsonify({"data": records})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing attendance: {exc}")
        return jsonify({"error": "Failed to list attendance"}), 500


@attendance_bp.post("/submit")
def submit_attendance():
    """Submit attendance summary for a group/date - Phase 7.1 from USER_CASE_FLOW.md."""
    data = request.get_json() or {}
    group_id = data.get("groupId") or data.get("group_id")
    attendance_date = data.get("date") or date.today().isoformat()
    present_count = data.get("presentCount") or data.get("present_count", 0)

    if not group_id:
        return jsonify({"error": "groupId is required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Upsert attendance summary
        res = (
            client.table("attendance_summary")
            .upsert({
                "church_id": church_id,
                "group_id": group_id,
                "date": attendance_date,
                "present_count": present_count,
                "absent_count": data.get("absentCount") or data.get("absent_count", 0),
                "male_count": data.get("maleCount") or data.get("male_count", 0),
                "female_count": data.get("femaleCount") or data.get("female_count", 0),
            }, on_conflict="church_id,group_id,date")
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Failed to submit attendance"}), 500
        return jsonify({"data": {
            "id": res.data[0]["summary_id"],
            "groupId": group_id,
            "date": attendance_date,
            "presentCount": present_count,
        }}), 201
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error submitting attendance: {exc}")
        return jsonify({"error": "Failed to submit attendance"}), 500

