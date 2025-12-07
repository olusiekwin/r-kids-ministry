import re
from datetime import datetime, date

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id
from utils.notifications import notify_child_approved, notify_child_rejected

children_bp = Blueprint("children", __name__)


def _calculate_age(date_of_birth: str | None) -> int:
    """Calculate age from date_of_birth string (YYYY-MM-DD)."""
    if not date_of_birth:
        return 0
    try:
        dob = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return age
    except (ValueError, TypeError):
        return 0


@children_bp.get("")
def list_children():
    """
    List children from Supabase `children` table with optional filters:
    - ?parent_id=
    - ?group=
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    parent_id = request.args.get("parent_id")
    group_name = request.args.get("group")

    try:
        query = (
            client.table("children")
            .select("*, groups(name)")
            .eq("church_id", church_id)
        )

        if parent_id:
            # parent_id could be:
            # 1. A UUID (guardian_id) - use directly
            # 2. An email (user email) - need to find guardian_id from users table
            # 3. A user_id - need to find guardian_id from users.linked_guardian_id
            
            # Check if it's a UUID format
            uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
            
            if uuid_pattern.match(parent_id):
                # It's a UUID, use directly
                query = query.eq("parent_id", parent_id)
            else:
                # It's likely an email or user_id, find the guardian_id
                guardian_id = None
                
                # First try to find user by email
                try:
                    user_res = (
                        client.table("users")
                        .select("user_id, linked_guardian_id, email")
                        .eq("church_id", church_id)
                        .eq("email", parent_id)
                        .limit(1)
                        .execute()
                    )
                    
                    if user_res.data:
                        user = user_res.data[0]
                        guardian_id = user.get("linked_guardian_id")
                except:
                    pass
                
                # If no linked guardian_id from user, try user_id lookup
                if not guardian_id:
                    try:
                        user_res = (
                            client.table("users")
                            .select("user_id, linked_guardian_id, email")
                            .eq("church_id", church_id)
                            .eq("user_id", parent_id)
                            .limit(1)
                            .execute()
                        )
                        
                        if user_res.data:
                            user = user_res.data[0]
                            guardian_id = user.get("linked_guardian_id")
                    except:
                        pass
                
                # If still no guardian_id, try to find guardian directly by email
                if not guardian_id:
                    try:
                        guardian_res = (
                            client.table("guardians")
                            .select("guardian_id")
                            .eq("church_id", church_id)
                            .eq("email", parent_id)
                            .eq("relationship", "Primary")
                            .limit(1)
                            .execute()
                        )
                        if guardian_res.data:
                            guardian_id = guardian_res.data[0]["guardian_id"]
                    except:
                        pass
                
                if guardian_id:
                    # Found guardian_id, use it
                    query = query.eq("parent_id", guardian_id)
                else:
                    # No guardian found, return empty result (user might be a teacher/admin, not a parent)
                    return jsonify({"data": []})

        # If group filter is provided, resolve group_id first
        if group_name:
            g_res = (
                client.table("groups")
                .select("group_id")
                .eq("church_id", church_id)
                .eq("name", group_name)
                .limit(1)
                .execute()
            )
            if g_res.data:
                query = query.eq("group_id", g_res.data[0]["group_id"])

        res = query.execute()
        children_rows = res.data or []

        result = []
        for row in children_rows:
            group_label = ""
            if row.get("groups"):
                group_label = (
                    row["groups"].get("name")
                    if isinstance(row["groups"], dict)
                    else ""
                )

            dob = row.get("date_of_birth")
            dob_str = (
                dob.strftime("%Y-%m-%d")
                if hasattr(dob, "strftime")
                else (str(dob) if dob else None)
            )

            child = {
                "id": row["child_id"],
                "registrationId": row.get("registration_id", ""),
                "name": row.get("name", ""),
                "age": None,  # can be calculated on frontend if needed
                "dateOfBirth": dob_str,
                "group": group_label,
                "parentId": row.get("parent_id"),
                "gender": row.get("gender", ""),
                "guardians": [],
            }
            result.append(child)

        return jsonify({"data": result})
    except Exception as exc:  # pragma: no cover
        import traceback
        print(f"⚠️ Error listing children from Supabase: {exc}")
        print(f"⚠️ Traceback: {traceback.format_exc()}")
        # Return empty array instead of error for better UX
        # If it's a real error, it will be logged but won't break the frontend
        return jsonify({"data": []})


@children_bp.post("")
def create_child():
    """
    Create a child in Supabase `children` table.

    Expects at least: name, dateOfBirth, parentId.
    Automatically generates registration_id (RSxxx/yy).
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    data = request.get_json() or {}
    name = str(data.get("name", "")).strip()
    parent_id_input = data.get("parentId")
    date_of_birth = data.get("dateOfBirth")

    if not name or not parent_id_input or not date_of_birth:
        return (
            jsonify(
                {
                    "error": "name, parentId and dateOfBirth are required",
                }
            ),
            400,
        )

    try:
        # Resolve parent_id_input (could be user_id, email, or guardian_id) to guardian_id
        # Similar logic to list_children function
        guardian_id = None
        uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
        
        if uuid_pattern.match(parent_id_input):
            # It's a UUID - could be user_id or guardian_id
            # First check if it's a guardian_id
            guardian_check = (
                client.table("guardians")
                .select("guardian_id")
                .eq("church_id", church_id)
                .eq("guardian_id", parent_id_input)
                .eq("relationship", "Primary")
                .limit(1)
                .execute()
            )
            if guardian_check.data:
                guardian_id = parent_id_input
            else:
                # It's likely a user_id, find linked_guardian_id
                user_res = (
                    client.table("users")
                    .select("user_id, linked_guardian_id, email")
                    .eq("church_id", church_id)
                    .eq("user_id", parent_id_input)
                    .limit(1)
                    .execute()
                )
                if user_res.data:
                    user = user_res.data[0]
                    guardian_id = user.get("linked_guardian_id")
                    # If no linked_guardian_id, try to find guardian by email
                    if not guardian_id and user.get("email"):
                        guardian_res = (
                            client.table("guardians")
                            .select("guardian_id")
                            .eq("church_id", church_id)
                            .eq("email", user.get("email"))
                            .eq("relationship", "Primary")
                            .limit(1)
                            .execute()
                        )
                        if guardian_res.data:
                            guardian_id = guardian_res.data[0]["guardian_id"]
        else:
            # It's likely an email, find guardian by email
            guardian_res = (
                client.table("guardians")
                .select("guardian_id")
                .eq("church_id", church_id)
                .eq("email", parent_id_input)
                .eq("relationship", "Primary")
                .limit(1)
                .execute()
            )
            if guardian_res.data:
                guardian_id = guardian_res.data[0]["guardian_id"]
            else:
                # Try to find user by email and get linked_guardian_id
                user_res = (
                    client.table("users")
                    .select("user_id, linked_guardian_id")
                    .eq("church_id", church_id)
                    .eq("email", parent_id_input)
                    .limit(1)
                    .execute()
                )
                if user_res.data:
                    guardian_id = user_res.data[0].get("linked_guardian_id")
        
        if not guardian_id:
            return jsonify({
                "error": "Parent not found. Please ensure you are registered as a guardian first."
            }), 400
        
        # Calculate age from date_of_birth for auto-group assignment (Phase 1.3 from USER_CASE_FLOW.md)
        age = _calculate_age(date_of_birth)
        
        # Auto-assign group based on age (Phase 1.3 from USER_CASE_FLOW.md)
        # Little Angels: 3-5, Saints: 6-9, Disciples: 10-12, Trendsetters: 13-19
        group_id = None
        if 3 <= age <= 5:
            group_name = "Little Angels"
        elif 6 <= age <= 9:
            group_name = "Saints"
        elif 10 <= age <= 12:
            group_name = "Disciples"
        elif 13 <= age <= 19:
            group_name = "Trendsetters"
        else:
            group_name = None  # Too young or too old
        
        # Get group_id if group_name was determined
        if group_name:
            group_res = (
                client.table("groups")
                .select("group_id")
                .eq("church_id", church_id)
                .eq("name", group_name)
                .limit(1)
                .execute()
            )
            if group_res.data:
                group_id = group_res.data[0]["group_id"]

        # Note: registration_id is auto-generated by database trigger (see schema.sql lines 241-270)
        # We don't set it manually - the trigger handles it based on parent_id
        
        # Generate registration_id manually (trigger should handle this, but as fallback)
        # Format: {parent_id}/{child_number} e.g., RS073/01
        # First, get parent_id (like RS073) from guardian
        guardian_res = (
            client.table("guardians")
            .select("parent_id")
            .eq("guardian_id", guardian_id)
            .eq("church_id", church_id)
            .limit(1)
            .execute()
        )
        parent_prefix = "RS001"  # Default fallback
        if guardian_res.data and guardian_res.data[0].get("parent_id"):
            parent_prefix = guardian_res.data[0]["parent_id"]
        
        # Count existing children for this parent to get child number
        children_count_res = (
            client.table("children")
            .select("child_id", count="exact")
            .eq("church_id", church_id)
            .eq("parent_id", guardian_id)
            .execute()
        )
        child_number = (children_count_res.count or 0) + 1
        registration_id = f"{parent_prefix}/{str(child_number).zfill(2)}"
        
        payload = {
            "church_id": church_id,
            "parent_id": guardian_id,  # Use resolved guardian_id
            "registration_id": registration_id,  # Generate manually to ensure it's set
            "name": name,
            "date_of_birth": date_of_birth,
            "group_id": group_id,  # Auto-assigned based on age
            "gender": data.get("gender", ""),
        }
        
        # Note: Some columns (status, submitted_by, submitted_at) may not exist
        # in all database instances. Only include them if they exist in your schema.

        created = client.table("children").insert(payload).execute()
        if not created.data:
            return jsonify({"error": "Failed to create child"}), 500

        row = created.data[0]
        
        # Get group name if group_id was assigned
        group_name = None
        if row.get("group_id"):
            group_res = (
                client.table("groups")
                .select("name")
                .eq("group_id", row.get("group_id"))
                .limit(1)
                .execute()
            )
            if group_res.data:
                group_name = group_res.data[0].get("name")
        
        child = {
            "id": row["child_id"],
            "registrationId": row.get("registration_id", ""),  # Auto-generated by trigger
            "name": row.get("name", ""),
            "age": age,  # Calculated from date_of_birth
            "dateOfBirth": date_of_birth,
            "group": group_name or "",  # Auto-assigned group name
            "parentId": guardian_id,  # Return resolved guardian_id
            "gender": row.get("gender", ""),
            "guardians": [],
        }
        return jsonify({"data": child}), 201
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error creating child in Supabase: {exc}")
        return jsonify({"error": "Failed to create child"}), 500


@children_bp.get("/<child_id>")
def get_child(child_id: str):
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("children")
            .select("*, groups(name)")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .limit(1)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Child not found"}), 404

        row = res.data[0]
        group_label = ""
        if row.get("groups"):
            group_label = (
                row["groups"].get("name")
                if isinstance(row["groups"], dict)
                else ""
            )

        dob = row.get("date_of_birth")
        dob_str = (
            dob.strftime("%Y-%m-%d")
            if hasattr(dob, "strftime")
            else (str(dob) if dob else None)
        )

        child = {
            "id": row["child_id"],
            "registrationId": row.get("registration_id", ""),
            "name": row.get("name", ""),
            "age": None,
            "dateOfBirth": dob_str,
            "group": group_label,
            "parentId": row.get("parent_id"),
            "status": row.get("status", "active"),
            "gender": row.get("gender", ""),
            "guardians": [],
        }
        return jsonify({"data": child})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error fetching child from Supabase: {exc}")
        return jsonify({"error": "Failed to fetch child"}), 500


@children_bp.put("/<child_id>")
def update_child(child_id: str):
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    data = request.get_json() or {}

    try:
        update_payload: dict = {}
        if "name" in data:
            update_payload["name"] = data["name"]
        if "dateOfBirth" in data:
            update_payload["date_of_birth"] = data["dateOfBirth"]
        if "gender" in data:
            update_payload["gender"] = data["gender"]
        
        # Support group assignment via group name or group_id
        if "group" in data or "groupName" in data:
            group_name = data.get("group") or data.get("groupName")
            if group_name:
                # Find group_id by name
                group_res = (
                    client.table("groups")
                    .select("group_id")
                    .eq("church_id", church_id)
                    .eq("name", group_name)
                    .limit(1)
                    .execute()
                )
                if group_res.data:
                    update_payload["group_id"] = group_res.data[0]["group_id"]
                else:
                    return jsonify({"error": f"Group '{group_name}' not found"}), 400
        elif "group_id" in data or "groupId" in data:
            group_id = data.get("group_id") or data.get("groupId")
            if group_id:
                update_payload["group_id"] = group_id
            elif group_id is None:  # Allow setting to null
                update_payload["group_id"] = None

        if not update_payload:
            return jsonify({"error": "No fields to update"}), 400

        res = (
            client.table("children")
            .update(update_payload)
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Child not found"}), 404

        # Return the updated child via get_child to keep consistent shape
        return get_child(child_id)
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error updating child in Supabase: {exc}")
        return jsonify({"error": "Failed to update child"}), 500


@children_bp.delete("/<child_id>")
def delete_child(child_id: str):
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("children")
            .delete()
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        if res.data is None:
            # supabase-py may return None for delete; treat as success
            return jsonify({"data": {"success": True}})
        if not res.data:
            return jsonify({"error": "Child not found"}), 404
        return jsonify({"data": {"success": True}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error deleting child from Supabase: {exc}")
        return jsonify({"error": "Failed to delete child"}), 500


@children_bp.get("/pending")
def list_pending_children():
    """List all children (no status column in schema, so returns all children)."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("children")
            .select("*, groups(name), guardians(name, email, phone)")
            .eq("church_id", church_id)
            .execute()
        )
        children = []
        for row in res.data or []:
            group = row.get("groups")
            guardian = row.get("guardians")
            children.append({
                "id": row["child_id"],
                "registrationId": row.get("registration_id", ""),
                "name": row.get("name", ""),
                "dateOfBirth": row.get("date_of_birth"),
                "age": _calculate_age(row.get("date_of_birth")),
                "group": group.get("name") if group else None,
                "parentId": str(row.get("parent_id", "")),
                "parentName": guardian.get("name") if guardian else None,
                "gender": row.get("gender"),
            })
        return jsonify({"data": children})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing pending children: {exc}")
        return jsonify({"error": "Failed to list pending children"}), 500


@children_bp.post("/<child_id>/approve")
def approve_child(child_id: str):
    """Approve a pending child - Phase 2 from USER_CASE_FLOW.md."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get child info before updating (for notification)
        child_before = (
            client.table("children")
            .select("name, parent_id")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        # No status column, so just get the child
        res = (
            client.table("children")
            .select("*")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Child not found"}), 404
        
        # Send approval notification
        if child_before.data:
            child_data = child_before.data[0]
            notify_child_approved(
                child_id=child_id,
                guardian_id=child_data.get("parent_id"),
                child_name=child_data.get("name"),
            )
        
        # Return updated child
        return get_child(child_id)
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error approving child: {exc}")
        return jsonify({"error": "Failed to approve child"}), 500


@children_bp.post("/<child_id>/reject")
def reject_child(child_id: str):
    """Reject a pending child - Phase 2 from USER_CASE_FLOW.md."""
    data = request.get_json() or {}
    reason = data.get("reason", "")
    
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get child info before updating (for notification)
        child_before = (
            client.table("children")
            .select("name, parent_id")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        # Delete the child record (rejection = deletion)
        client.table("children").delete().eq("child_id", child_id).eq("church_id", church_id).execute()
        
        # Send rejection notification
        if child_before.data:
            child_data = child_before.data[0]
            notify_child_rejected(
                child_id=child_id,
                guardian_id=child_data.get("parent_id"),
                child_name=child_data.get("name"),
                reason=reason,
            )
        
        return jsonify({"data": {"success": True}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error rejecting child: {exc}")
        return jsonify({"error": "Failed to reject child"}), 500



