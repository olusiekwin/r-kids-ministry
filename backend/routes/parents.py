from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

parents_bp = Blueprint("parents", __name__)


@parents_bp.get("")
def list_parents():
    """
    List parents backed by Supabase `guardians` and `children` tables.

    The frontend expects:
    - id
    - name
    - email
    - status
    - childrenCount
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        guardians_res = (
            client.table("guardians")
            .select("*")
            .eq("church_id", church_id)
            .eq("relationship", "Primary")
            .execute()
        )
        guardians = guardians_res.data or []

        # Build children count map
        guardian_ids = [g["guardian_id"] for g in guardians]
        children_counts: dict[str, int] = {}
        if guardian_ids:
            children_res = (
                client.table("children")
                .select("parent_id")
                .in_("parent_id", guardian_ids)
                .execute()
            )
            for row in children_res.data or []:
                pid = row.get("parent_id")
                if pid:
                    children_counts[pid] = children_counts.get(pid, 0) + 1

        parents = []
        for g in guardians:
            gid = g["guardian_id"]
            parents.append(
                {
                    "id": gid,
                    "name": g.get("name", ""),
                    "email": g.get("email") or "",
                    "status": "active"
                    if not g.get("active_until")
                    else "inactive",
                    "childrenCount": children_counts.get(gid, 0),
                }
            )

        return jsonify({"data": parents})
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"⚠️ Error listing parents from Supabase: {exc}")
        return jsonify({"error": "Failed to fetch parents"}), 500


@parents_bp.post("")
def create_parent():
    """
    Create a new primary guardian (parent) in Supabase `guardians` table.
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    data = request.get_json() or {}
    name = str(data.get("name", "")).strip()
    email = (data.get("email") or "").strip() or None
    phone = (data.get("phone") or "").strip() or None

    if not name:
        return jsonify({"error": "Name is required"}), 400

    try:
        # Generate a simple parent code like RS001, RS002...
        count_res = (
            client.table("guardians")
            .select("guardian_id", count="exact")
            .eq("church_id", church_id)
            .execute()
        )
        existing_count = getattr(count_res, "count", None)
        if existing_count is None:
            existing_count = len(count_res.data or [])

        parent_code = f"RS{existing_count + 1:03d}"

        payload = {
            "church_id": church_id,
            "parent_id": parent_code,
            "name": name,
            "email": email,
            "phone": phone,
            "relationship": "Primary",
            "is_primary": True,
        }

        created = client.table("guardians").insert(payload).execute()
        if not created.data:
            return jsonify({"error": "Failed to create parent"}), 500

        g = created.data[0]
        parent = {
            "id": g["guardian_id"],
            "name": g.get("name", ""),
            "email": g.get("email") or "",
            "status": "active",
            "childrenCount": 0,
        }
        return jsonify({"data": parent}), 201
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error creating parent in Supabase: {exc}")
        return jsonify({"error": "Failed to create parent"}), 500


@parents_bp.get("/<parent_id>")
def get_parent(parent_id: str):
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("guardians")
            .select("*")
            .eq("church_id", church_id)
            .eq("guardian_id", parent_id)
            .limit(1)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Parent not found"}), 404

        g = res.data[0]
        # count children for this guardian
        count_res = (
            client.table("children")
            .select("child_id", count="exact")
            .eq("parent_id", g["guardian_id"])
            .execute()
        )
        children_count = getattr(count_res, "count", None)
        if children_count is None:
            children_count = len(count_res.data or [])

        parent = {
            "id": g["guardian_id"],
            "name": g.get("name", ""),
            "email": g.get("email") or "",
            "status": "active"
            if not g.get("active_until")
            else "inactive",
            "childrenCount": children_count or 0,
        }
        return jsonify({"data": parent})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error fetching parent from Supabase: {exc}")
        return jsonify({"error": "Failed to fetch parent"}), 500


@parents_bp.delete("/<parent_id>")
def delete_parent(parent_id: str):
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Delete guardian and cascade will handle children if configured
        client.table("guardians").delete().eq("guardian_id", parent_id).eq(
            "church_id", church_id
        ).execute()
        return jsonify({"data": {"success": True}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error deleting parent from Supabase: {exc}")
        return jsonify({"error": "Failed to delete parent"}), 500



