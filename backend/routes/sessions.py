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
                "status": row.get("status", "scheduled"),
                "started_at": row.get("started_at"),
                "ended_at": row.get("ended_at"),
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
            "status": data.get("status", "scheduled"),  # Default to scheduled
            "created_by": data.get("created_by") or data.get("createdBy"),  # From auth token in real app
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
        
        # Get teacher name separately
        teacher_name = None
        if teacher_id:
            try:
                teacher_res = client.table("users").select("name").eq("user_id", teacher_id).execute()
                if teacher_res.data:
                    teacher_name = teacher_res.data[0].get("name")
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
                "session_type": row.get("session_type", "Regular"),
                "location": row.get("location"),
                "is_recurring": row.get("is_recurring", False),
                "recurrence_pattern": row.get("recurrence_pattern"),
                "gender_restriction": row.get("gender_restriction"),
                "status": row.get("status", "scheduled"),
                "started_at": row.get("started_at"),
                "ended_at": row.get("ended_at"),
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


@sessions_bp.post("/<session_id>/start")
def start_session(session_id: str):
    """Start a session - marks it as active."""
    from utils.auth import require_role
    current_user, error, status = require_role(["admin", "super_admin", "teacher"])
    if error:
        return error, status
    
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        from datetime import datetime
        res = (
            client.table("sessions")
            .update({
                "status": "active",
                "started_at": datetime.utcnow().isoformat(),
            })
            .eq("session_id", session_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not res.data:
            return jsonify({"error": "Session not found"}), 404
        
        return get_session(session_id)
    except Exception as exc:
        print(f"⚠️ Error starting session: {exc}")
        return jsonify({"error": "Failed to start session"}), 500


@sessions_bp.post("/<session_id>/end")
def end_session(session_id: str):
    """End a session - marks it as ended."""
    from utils.auth import require_role
    current_user, error, status = require_role(["admin", "super_admin", "teacher"])
    if error:
        return error, status
    
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        from datetime import datetime
        res = (
            client.table("sessions")
            .update({
                "status": "ended",
                "ended_at": datetime.utcnow().isoformat(),
            })
            .eq("session_id", session_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not res.data:
            return jsonify({"error": "Session not found"}), 404
        
        return get_session(session_id)
    except Exception as exc:
        print(f"⚠️ Error ending session: {exc}")
        return jsonify({"error": "Failed to end session"}), 500


@sessions_bp.get("/<session_id>/eligible-children")
def get_eligible_children(session_id: str):
    """Auto-fetch children eligible for session based on group and gender restriction."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get session details
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
        
        # Build query for children in the group
        # Fetch children first, then get groups and guardians separately to avoid relationship ambiguity
        query = (
            client.table("children")
            .select("child_id, registration_id, name, date_of_birth, gender, group_id, parent_id")
            .eq("church_id", church_id)
            .eq("group_id", group_id)
        )
        
        # Apply gender restriction if specified
        if gender_restriction:
            query = query.eq("gender", gender_restriction)
        
        res = query.execute()
        
        # Collect IDs for bulk fetching
        group_ids = set()
        guardian_ids = set()
        for row in res.data or []:
            if row.get("group_id"):
                group_ids.add(row.get("group_id"))
            if row.get("parent_id"):
                guardian_ids.add(row.get("parent_id"))
        
        # Fetch groups in bulk
        groups_map = {}
        if group_ids:
            try:
                groups_res = (
                    client.table("groups")
                    .select("group_id, name")
                    .in_("group_id", list(group_ids))
                    .execute()
                )
                for group in groups_res.data or []:
                    groups_map[group["group_id"]] = group.get("name")
            except Exception as e:
                print(f"⚠️ Warning: Could not fetch groups: {e}")
        
        # Fetch guardians in bulk
        guardians_map = {}
        if guardian_ids:
            try:
                guardians_res = (
                    client.table("guardians")
                    .select("guardian_id, name, parent_id")
                    .in_("guardian_id", list(guardian_ids))
                    .execute()
                )
                for guardian in guardians_res.data or []:
                    guardians_map[guardian["guardian_id"]] = {
                        "name": guardian.get("name"),
                        "parent_id": guardian.get("parent_id"),
                    }
            except Exception as e:
                print(f"⚠️ Warning: Could not fetch guardians: {e}")
        
        children = []
        for row in res.data or []:
            parent_id = row.get("parent_id")
            group_id = row.get("group_id")
            guardian_info = guardians_map.get(parent_id) if parent_id else None
            
            children.append({
                "id": row["child_id"],
                "registration_id": row.get("registration_id"),
                "name": row.get("name"),
                "date_of_birth": row.get("date_of_birth"),
                "gender": row.get("gender"),
                "group_id": group_id,
                "group_name": groups_map.get(group_id) if group_id else None,
                "parent_id": parent_id,
                "guardian_name": guardian_info.get("name") if guardian_info else None,
                "parent_registration_id": guardian_info.get("parent_id") if guardian_info else None,
            })
        
        return jsonify({"data": children})
    except Exception as exc:  # pragma: no cover
        import traceback
        print(f"⚠️ Error getting eligible children: {exc}")
        print(traceback.format_exc())
        return jsonify({"error": "Failed to get eligible children"}), 500

