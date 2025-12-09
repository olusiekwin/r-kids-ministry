"""Sessions Routes - For managing ministry sessions/events"""

from datetime import datetime

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

sessions_bp = Blueprint("sessions", __name__)


@sessions_bp.get("")
def list_sessions():
    """List sessions with optional filters."""
    group_id = request.args.get("group_id") or request.args.get("groupId")
    date = request.args.get("date")
    year = request.args.get("year")
    month = request.args.get("month")

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Query actual sessions table - include creator info
        # Use separate queries for teacher and creator to avoid duplicate table name error
        query = (
            client.table("sessions")
            .select("*, groups(name, room)")
            .eq("church_id", church_id)
        )
        
        if group_id:
            query = query.eq("group_id", group_id)
        if date:
            query = query.eq("session_date", date)
        if year:
            query = query.gte("session_date", f"{year}-01-01").lt("session_date", f"{int(year)+1}-01-01")
        if month and year:
            query = query.gte("session_date", f"{year}-{month:02d}-01").lt("session_date", f"{year}-{int(month)+1:02d}-01" if int(month) < 12 else f"{int(year)+1}-01-01")

        res = query.order("session_date", desc=True).order("start_time", desc=False).limit(100).execute()
        
        sessions = []
        for row in res.data or []:
            group = row.get("groups")
            teacher_id = row.get("teacher_id")
            created_by_id = row.get("created_by")
            
            # Get teacher name if teacher_id exists
            teacher_name = None
            if teacher_id:
                try:
                    teacher_res = client.table("users").select("name").eq("user_id", teacher_id).execute()
                    if teacher_res.data:
                        teacher_name = teacher_res.data[0].get("name")
                except:
                    pass
            
            # Get creator name if created_by exists
            created_by_name = None
            if created_by_id:
                try:
                    creator_res = client.table("users").select("name").eq("user_id", created_by_id).execute()
                    if creator_res.data:
                        created_by_name = creator_res.data[0].get("name")
                except:
                    pass
            
            sessions.append({
                "id": row["session_id"],
                "title": row.get("title", ""),
                "description": row.get("description"),
                "session_date": row.get("session_date"),
                "start_time": str(row.get("start_time")) if row.get("start_time") else None,
                "end_time": str(row.get("end_time")) if row.get("end_time") else None,
                "group_id": row.get("group_id"),
                "group_name": group.get("name") if group else None,
                "room": group.get("room") if group else None,
                "teacher_id": teacher_id,
                "teacher_name": teacher_name,
                "created_by": created_by_id,
                "created_by_name": created_by_name,
                "session_type": row.get("session_type", "Regular"),
                "location": row.get("location"),
                "is_recurring": row.get("is_recurring", False),
                "recurrence_pattern": row.get("recurrence_pattern"),
                "gender_restriction": row.get("gender_restriction"),
                "created_at": row.get("created_at"),
            })
        
        return jsonify({"data": sessions})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing sessions: {exc}")
        return jsonify({"error": "Failed to list sessions"}), 500


@sessions_bp.post("")
def create_session():
    """Create a new session."""
    data = request.get_json() or {}
    title = data.get("title")
    session_date = data.get("session_date")

    if not title or not session_date:
        return jsonify({"error": "title and session_date are required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        session_data = {
            "church_id": church_id,
            "title": title,
            "session_date": session_date,
            "description": data.get("description"),
            "start_time": data.get("start_time"),
            "end_time": data.get("end_time"),
            "group_id": data.get("group_id") or data.get("groupId"),
            "teacher_id": data.get("teacher_id") or data.get("teacherId"),
            "session_type": data.get("session_type", "Regular"),
            "location": data.get("location"),
            "is_recurring": data.get("is_recurring", False),
            "recurrence_pattern": data.get("recurrence_pattern"),
            "created_by": data.get("created_by") or data.get("createdBy"),  # From auth token in real app
            "gender_restriction": data.get("gender_restriction"),  # Male, Female, or None
        }
        
        res = client.table("sessions").insert(session_data).execute()
        
        if not res.data:
            return jsonify({"error": "Failed to create session"}), 500
        
        row = res.data[0]
        return jsonify({
            "data": {
                "id": row["session_id"],
                "title": row.get("title"),
                "session_date": row.get("session_date"),
                "session_type": row.get("session_type"),
                "group_id": row.get("group_id"),
                "teacher_id": row.get("teacher_id"),
            }
        }), 201
    except Exception as exc:  # pragma: no cover
        import traceback
        print(f"⚠️ Error creating session: {exc}")
        print(traceback.format_exc())
        return jsonify({"error": f"Failed to create session: {str(exc)}"}), 500


@sessions_bp.get("/<session_id>")
def get_session(session_id: str):
    """Get a specific session."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("sessions")
            .select("*, groups(name, room)")
            .eq("session_id", session_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not res.data:
            return jsonify({"error": "Session not found"}), 404
        
        row = res.data[0]
        group = row.get("groups")
        teacher_id = row.get("teacher_id")
        created_by_id = row.get("created_by")
        
        # Get teacher name if teacher_id exists
        teacher_name = None
        if teacher_id:
            try:
                teacher_res = client.table("users").select("name").eq("user_id", teacher_id).execute()
                if teacher_res.data:
                    teacher_name = teacher_res.data[0].get("name")
            except:
                pass
        
        # Get creator name if created_by exists
        created_by_name = None
        if created_by_id:
            try:
                creator_res = client.table("users").select("name").eq("user_id", created_by_id).execute()
                if creator_res.data:
                    created_by_name = creator_res.data[0].get("name")
            except:
                pass
        
        return jsonify({
            "data": {
                "id": row["session_id"],
                "title": row.get("title", ""),
                "description": row.get("description"),
                "session_date": row.get("session_date"),
                "start_time": str(row.get("start_time")) if row.get("start_time") else None,
                "end_time": str(row.get("end_time")) if row.get("end_time") else None,
                "group_id": row.get("group_id"),
                "group_name": group.get("name") if group else None,
                "room": group.get("room") if group else None,
                "teacher_id": teacher_id,
                "teacher_name": teacher_name,
                "created_by": created_by_id,
                "created_by_name": created_by_name,
                "session_type": row.get("session_type", "Regular"),
                "location": row.get("location"),
                "is_recurring": row.get("is_recurring", False),
                "recurrence_pattern": row.get("recurrence_pattern"),
                "gender_restriction": row.get("gender_restriction"),  # Male, Female, or None
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting session: {exc}")
        return jsonify({"error": "Failed to get session"}), 500


@sessions_bp.put("/<session_id>")
def update_session(session_id: str):
    """Update a session."""
    data = request.get_json() or {}
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        update_data = {}
        if "title" in data:
            update_data["title"] = data["title"]
        if "description" in data:
            update_data["description"] = data["description"]
        if "session_date" in data:
            update_data["session_date"] = data["session_date"]
        if "start_time" in data:
            update_data["start_time"] = data["start_time"]
        if "end_time" in data:
            update_data["end_time"] = data["end_time"]
        if "group_id" in data or "groupId" in data:
            update_data["group_id"] = data.get("group_id") or data.get("groupId")
        if "teacher_id" in data or "teacherId" in data:
            update_data["teacher_id"] = data.get("teacher_id") or data.get("teacherId")
        if "session_type" in data:
            update_data["session_type"] = data["session_type"]
        if "location" in data:
            update_data["location"] = data["location"]
        if "is_recurring" in data:
            update_data["is_recurring"] = data["is_recurring"]
        if "recurrence_pattern" in data:
            update_data["recurrence_pattern"] = data["recurrence_pattern"]
        if "gender_restriction" in data:
            update_data["gender_restriction"] = data["gender_restriction"]

        if not update_data:
            return jsonify({"error": "No fields to update"}), 400

        res = (
            client.table("sessions")
            .update(update_data)
            .eq("session_id", session_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not res.data:
            return jsonify({"error": "Session not found"}), 404
        
        return get_session(session_id)
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error updating session: {exc}")
        return jsonify({"error": "Failed to update session"}), 500


@sessions_bp.delete("/<session_id>")
def delete_session(session_id: str):
    """Delete a session."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("sessions")
            .delete()
            .eq("session_id", session_id)
            .eq("church_id", church_id)
            .execute()
        )
        return jsonify({"data": {"success": True}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error deleting session: {exc}")
        return jsonify({"error": "Failed to delete session"}), 500


@sessions_bp.get("/<session_id>/children")
def get_session_children(session_id: str):
    """Get all children eligible for a session (based on group and gender restriction)."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # First get the session
        session_res = (
            client.table("sessions")
            .select("group_id, gender_restriction")
            .eq("session_id", session_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not session_res.data:
            return jsonify({"error": "Session not found"}), 404
        
        session = session_res.data[0]
        group_id = session.get("group_id")
        gender_restriction = session.get("gender_restriction")
        
        if not group_id:
            return jsonify({"data": []})
        
        # Get all children in the group
        query = (
            client.table("children")
            .select("*, groups(name), guardians(name, parent_id)")
            .eq("church_id", church_id)
            .eq("group_id", group_id)
        )
        
        # Apply gender restriction if specified
        if gender_restriction:
            query = query.eq("gender", gender_restriction)
        
        res = query.execute()
        
        children = []
        for row in res.data or []:
            group = row.get("groups")
            guardian = row.get("guardians")
            children.append({
                "id": row["child_id"],
                "registration_id": row.get("registration_id"),
                "name": row.get("name"),
                "date_of_birth": row.get("date_of_birth"),
                "gender": row.get("gender"),
                "group_id": row.get("group_id"),
                "group_name": group.get("name") if group else None,
                "parent_id": row.get("parent_id"),
                "guardian_name": guardian.get("name") if guardian else None,
                "parent_registration_id": guardian.get("parent_id") if guardian else None,
            })
        
        return jsonify({"data": children})
    except Exception as exc:  # pragma: no cover
        import traceback
        print(f"⚠️ Error getting session children: {exc}")
        print(traceback.format_exc())
        return jsonify({"error": "Failed to get session children"}), 500


@sessions_bp.get("/<session_id>/history")
def get_session_history(session_id: str):
    """Get check-in/checkout history for a session."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get all check-in records for this session
        res = (
            client.table("check_in_records")
            .select("*, children(name, registration_id, gender), users(name), session_bookings(booking_id)")
            .eq("church_id", church_id)
            .not_.is_("session_id", "null")
            .eq("session_id", session_id)
            .order("timestamp_in", desc=True)
            .execute()
        )
        
        history = []
        for row in res.data or []:
            child = row.get("children")
            teacher = row.get("users")
            history.append({
                "record_id": row["record_id"],
                "child_id": row.get("child_id"),
                "child_name": child.get("name") if child else None,
                "child_registration_id": child.get("registration_id") if child else None,
                "child_gender": child.get("gender") if child else None,
                "teacher_id": row.get("teacher_id"),
                "teacher_name": teacher.get("name") if teacher else None,
                "timestamp_in": row.get("timestamp_in"),
                "timestamp_out": row.get("timestamp_out"),
                "method": row.get("method"),
            })
        
        return jsonify({"data": history})
    except Exception as exc:  # pragma: no cover
        import traceback
        print(f"⚠️ Error getting session history: {exc}")
        print(traceback.format_exc())
        return jsonify({"error": "Failed to get session history"}), 500

