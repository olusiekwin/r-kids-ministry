from datetime import datetime

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

children_bp = Blueprint("children", __name__)


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
            query = query.eq("parent_id", parent_id)

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
                "status": row.get("status", "active"),
                "gender": row.get("gender", ""),
                "guardians": [],
                "submittedBy": row.get("submitted_by") or "parent",
                "submittedAt": row.get("submitted_at")
                or row.get("created_at")
                or datetime.utcnow().isoformat() + "Z",
            }
            result.append(child)

        return jsonify({"data": result})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing children from Supabase: {exc}")
        return jsonify({"error": "Failed to fetch children"}), 500


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
    parent_id = data.get("parentId")
    date_of_birth = data.get("dateOfBirth")

    if not name or not parent_id or not date_of_birth:
        return (
            jsonify(
                {
                    "error": "name, parentId and dateOfBirth are required",
                }
            ),
            400,
        )

    try:
        # Get parent's parent_code (RSxxx)
        parent_res = (
            client.table("guardians")
            .select("parent_id")
            .eq("guardian_id", parent_id)
            .eq("church_id", church_id)
            .limit(1)
            .execute()
        )
        parent_code = (
            parent_res.data[0]["parent_id"] if parent_res.data else "RS000"
        )

        # Count existing children for this guardian to generate registration_id
        existing_res = (
            client.table("children")
            .select("child_id")
            .eq("parent_id", parent_id)
            .execute()
        )
        child_number = len(existing_res.data or []) + 1

        registration_id = f"{parent_code}/{child_number:02d}"

        payload = {
            "church_id": church_id,
            "parent_id": parent_id,
            "registration_id": registration_id,
            "name": name,
            "date_of_birth": date_of_birth,
            "gender": data.get("gender", ""),
            "status": data.get("status", "active"),
            "submitted_by": data.get("submittedBy", "parent"),
            "submitted_at": datetime.utcnow().isoformat() + "Z",
        }

        created = client.table("children").insert(payload).execute()
        if not created.data:
            return jsonify({"error": "Failed to create child"}), 500

        row = created.data[0]
        child = {
            "id": row["child_id"],
            "registrationId": row.get("registration_id", ""),
            "name": row.get("name", ""),
            "age": None,
            "dateOfBirth": date_of_birth,
            "group": "",
            "parentId": parent_id,
            "status": row.get("status", "active"),
            "gender": row.get("gender", ""),
            "guardians": [],
            "submittedBy": row.get("submitted_by") or "parent",
            "submittedAt": row.get("submitted_at"),
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
            "submittedBy": row.get("submitted_by") or "parent",
            "submittedAt": row.get("submitted_at")
            or row.get("created_at")
            or datetime.utcnow().isoformat() + "Z",
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



