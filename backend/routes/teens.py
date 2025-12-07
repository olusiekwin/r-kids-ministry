"""
Teen Routes - Role-specific endpoints for teens
Teens can only access their own data (via linked_child_id in users table).
"""

from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

teens_bp = Blueprint("teens", __name__)


@teens_bp.get("/profile")
def get_teen_profile():
    """
    Get teen's profile data.
    Teen user_id should come from auth token in production.
    """
    user_id = request.args.get("user_id") or request.args.get("userId")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    # Validate UUID format
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not uuid_pattern.match(user_id):
        return jsonify({"error": "Invalid user_id format. Must be a valid UUID."}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get user to find linked_child_id
        user_res = (
            client.table("users")
            .select("user_id, email, name, linked_child_id")
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .eq("role", "Teen")
            .execute()
        )
        
        if not user_res.data:
            return jsonify({"error": "Teen user not found"}), 404
        
        user = user_res.data[0]
        child_id = user.get("linked_child_id")
        
        if not child_id:
            return jsonify({"error": "Teen account not linked to a child"}), 404

        # Get child data
        child_res = (
            client.table("children")
            .select("*, groups(name), guardians(name, email, phone)")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not child_res.data:
            return jsonify({"error": "Child not found"}), 404
        
        child = child_res.data[0]
        group = child.get("groups")
        guardian = child.get("guardians")
        
        from routes.children import _calculate_age
        
        return jsonify({
            "data": {
                "userId": user_id,
                "email": user.get("email"),
                "name": user.get("name"),
                "childId": child_id,
                "childName": child.get("name", ""),
                "registrationId": child.get("registration_id", ""),
                "dateOfBirth": child.get("date_of_birth"),
                "age": _calculate_age(child.get("date_of_birth")),
                "group": group.get("name") if group else None,
                "gender": child.get("gender"),
                "parentName": guardian.get("name") if guardian else None,
                "parentEmail": guardian.get("email") if guardian else None,
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting teen profile: {exc}")
        return jsonify({"error": "Failed to get teen profile"}), 500


@teens_bp.get("/attendance")
def get_teen_attendance():
    """
    Get attendance history for teen (their own attendance records).
    Teen user_id should come from auth token in production.
    """
    user_id = request.args.get("user_id") or request.args.get("userId")
    limit = int(request.args.get("limit", 30))  # Last 30 records by default

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    # Validate UUID format
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not uuid_pattern.match(user_id):
        return jsonify({"error": "Invalid user_id format. Must be a valid UUID."}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get user to find linked_child_id
        user_res = (
            client.table("users")
            .select("linked_child_id")
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .eq("role", "Teen")
            .execute()
        )
        
        if not user_res.data or not user_res.data[0].get("linked_child_id"):
            return jsonify({"error": "Teen account not linked to a child"}), 404
        
        child_id = user_res.data[0]["linked_child_id"]

        # Get check-in records for this child
        res = (
            client.table("check_in_records")
            .select("*, groups(name)")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .order("timestamp_in", desc=True)
            .limit(limit)
            .execute()
        )
        
        records = []
        for row in res.data or []:
            group = row.get("groups")
            records.append({
                "id": row["record_id"],
                "date": row.get("timestamp_in", "").split("T")[0] if row.get("timestamp_in") else None,
                "timestampIn": row.get("timestamp_in"),
                "timestampOut": row.get("timestamp_out"),
                "method": row.get("method"),
                "groupName": group.get("name") if group else None,
                "attended": True,  # If record exists, they attended
                "checkedOut": row.get("timestamp_out") is not None,
            })
        return jsonify({"data": records})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting teen attendance: {exc}")
        return jsonify({"error": "Failed to get teen attendance"}), 500


@teens_bp.get("/stats")
def get_teen_stats():
    """
    Get attendance statistics for teen (last 30 days).
    Teen user_id should come from auth token in production.
    """
    user_id = request.args.get("user_id") or request.args.get("userId")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    # Validate UUID format
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not uuid_pattern.match(user_id):
        return jsonify({"error": "Invalid user_id format. Must be a valid UUID."}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get user to find linked_child_id
        user_res = (
            client.table("users")
            .select("linked_child_id")
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .eq("role", "Teen")
            .execute()
        )
        
        if not user_res.data or not user_res.data[0].get("linked_child_id"):
            return jsonify({"error": "Teen account not linked to a child"}), 404
        
        child_id = user_res.data[0]["linked_child_id"]

        # Get attendance for last 30 days
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).date().isoformat()
        res = (
            client.table("check_in_records")
            .select("record_id")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .gte("timestamp_in", thirty_days_ago)
            .execute()
        )
        
        total_sessions = 30  # Assuming sessions happen regularly
        attended = len(res.data or [])
        attendance_rate = (attended / total_sessions * 100) if total_sessions > 0 else 0

        return jsonify({
            "data": {
                "childId": child_id,
                "attendedLast30Days": attended,
                "totalSessions": total_sessions,
                "attendanceRate": round(attendance_rate, 2),
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting teen stats: {exc}")
        return jsonify({"error": "Failed to get teen stats"}), 500


@teens_bp.post("/attendance/submit")
def submit_teen_attendance():
    """
    Submit attendance for teen's own session.
    Teen user_id should come from auth token in production.
    Creates a check-in record for the teen's linked child.
    """
    data = request.get_json() or {}
    user_id = data.get("user_id") or data.get("userId") or request.args.get("user_id") or request.args.get("userId")
    session_id = data.get("session_id") or data.get("sessionId")
    booking_id = data.get("booking_id") or data.get("bookingId")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    # Validate UUID format
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not uuid_pattern.match(user_id):
        return jsonify({"error": "Invalid user_id format. Must be a valid UUID."}), 400
    
    if session_id and not uuid_pattern.match(session_id):
        return jsonify({"error": "Invalid session_id format. Must be a valid UUID."}), 400
    
    if booking_id and not uuid_pattern.match(booking_id):
        return jsonify({"error": "Invalid booking_id format. Must be a valid UUID."}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get user to find linked_child_id
        user_res = (
            client.table("users")
            .select("user_id, linked_child_id")
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .eq("role", "Teen")
            .execute()
        )
        
        if not user_res.data or not user_res.data[0].get("linked_child_id"):
            return jsonify({"error": "Teen account not linked to a child"}), 404
        
        child_id = user_res.data[0]["linked_child_id"]
        teen_user_id = user_res.data[0]["user_id"]

        # Get child to find guardian_id
        child_res = (
            client.table("children")
            .select("child_id, name, parent_id")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not child_res.data:
            return jsonify({"error": "Child not found"}), 404
        
        child = child_res.data[0]
        guardian_id = child.get("parent_id")  # Primary guardian

        # If session_id provided, verify session exists and get booking
        if session_id:
            session_res = (
                client.table("sessions")
                .select("session_id, session_date, group_id")
                .eq("session_id", session_id)
                .eq("church_id", church_id)
                .execute()
            )
            
            if not session_res.data:
                return jsonify({"error": "Session not found"}), 404
            
            session = session_res.data[0]
            
            # Find or create booking for this session
            if not booking_id:
                booking_res = (
                    client.table("session_bookings")
                    .select("booking_id, status")
                    .eq("session_id", session_id)
                    .eq("child_id", child_id)
                    .execute()
                )
                
                if booking_res.data:
                    booking = booking_res.data[0]
                    if booking.get("status") == "checked_in":
                        return jsonify({"error": "Already checked in for this session"}), 400
                    booking_id = booking["booking_id"]
                else:
                    # Create booking if it doesn't exist
                    booking_data = {
                        "session_id": session_id,
                        "child_id": child_id,
                        "guardian_id": guardian_id,
                        "status": "booked",
                    }
                    booking_insert = client.table("session_bookings").insert(booking_data).execute()
                    if booking_insert.data:
                        booking_id = booking_insert.data[0]["booking_id"]

        # Create check-in record (use teen's user_id as teacher_id for self-check-in)
        record_data = {
            "church_id": church_id,
            "child_id": child_id,
            "teacher_id": teen_user_id,  # Use teen's own user_id for self-check-in
            "method": "manual",  # Self-check-in method
            "timestamp_in": datetime.utcnow().isoformat(),
        }
        
        if guardian_id:
            record_data["guardian_id"] = guardian_id
        if session_id:
            record_data["session_id"] = session_id
        if booking_id:
            record_data["booking_id"] = booking_id

        res = client.table("check_in_records").insert(record_data).execute()
        if not res.data:
            return jsonify({"error": "Failed to create check-in record"}), 500

        record = res.data[0]

        # Update booking status if booking_id exists
        if booking_id:
            try:
                client.table("session_bookings").update({
                    "status": "checked_in",
                    "checked_in_at": datetime.utcnow().isoformat(),
                }).eq("booking_id", booking_id).execute()
            except Exception as e:
                print(f"⚠️ Error updating booking status: {e}")

        # Send notification to parent
        from utils.notifications import notify_check_in
        notify_check_in(
            child_id=child_id,
            guardian_id=guardian_id,
            child_name=child.get("name"),
        )

        return jsonify({
            "data": {
                "recordId": record["record_id"],
                "childId": child_id,
                "childName": child.get("name"),
                "timestampIn": record.get("timestamp_in"),
                "method": "manual",
                "status": "checked_in",
                "sessionId": session_id,
                "bookingId": booking_id,
            }
        }), 201
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error submitting teen attendance: {exc}")
        return jsonify({"error": "Failed to submit attendance"}), 500


@teens_bp.get("/dashboard")
def teen_dashboard():
    """
    Get dashboard data for teen: profile, recent attendance, stats.
    Teen user_id should come from auth token in production.
    """
    user_id = request.args.get("user_id") or request.args.get("userId")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    # Validate UUID format
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not uuid_pattern.match(user_id):
        return jsonify({"error": "Invalid user_id format. Must be a valid UUID."}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get user and child data
        user_res = (
            client.table("users")
            .select("user_id, email, name, linked_child_id")
            .eq("user_id", user_id)
            .eq("church_id", church_id)
            .eq("role", "Teen")
            .execute()
        )
        
        if not user_res.data:
            return jsonify({"error": "Teen user not found"}), 404
        
        user = user_res.data[0]
        child_id = user.get("linked_child_id")
        
        if not child_id:
            return jsonify({"error": "Teen account not linked to a child"}), 404

        # Get child profile
        child_res = (
            client.table("children")
            .select("*, groups(name), guardians(name, email)")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not child_res.data:
            return jsonify({"error": "Child not found"}), 404
        
        child = child_res.data[0]
        group = child.get("groups")
        guardian = child.get("guardians")
        
        from routes.children import _calculate_age
        
        # Get recent attendance (last 10)
        attendance_res = (
            client.table("check_in_records")
            .select("*, groups(name)")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .order("timestamp_in", desc=True)
            .limit(10)
            .execute()
        )
        
        recent_attendance = []
        for row in attendance_res.data or []:
            att_group = row.get("groups")
            recent_attendance.append({
                "id": row["record_id"],
                "date": row.get("timestamp_in", "").split("T")[0] if row.get("timestamp_in") else None,
                "timestampIn": row.get("timestamp_in"),
                "timestampOut": row.get("timestamp_out"),
                "groupName": att_group.get("name") if att_group else None,
                "checkedOut": row.get("timestamp_out") is not None,
            })
        
        # Get stats (last 30 days)
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).date().isoformat()
        stats_res = (
            client.table("check_in_records")
            .select("record_id")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .gte("timestamp_in", thirty_days_ago)
            .execute()
        )
        
        attended = len(stats_res.data or [])
        attendance_rate = (attended / 30 * 100) if attended > 0 else 0

        return jsonify({
            "data": {
                "profile": {
                    "userId": user_id,
                    "email": user.get("email"),
                    "name": user.get("name"),
                    "childId": child_id,
                    "childName": child.get("name", ""),
                    "registrationId": child.get("registration_id", ""),
                    "age": _calculate_age(child.get("date_of_birth")),
                    "group": group.get("name") if group else None,
                },
                "recentAttendance": recent_attendance,
                "stats": {
                    "attendedLast30Days": attended,
                    "attendanceRate": round(attendance_rate, 2),
                },
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting teen dashboard: {exc}")
        return jsonify({"error": "Failed to get teen dashboard"}), 500

