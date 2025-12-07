from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id, get_supabase_error_response

# Note: Removed postgrest.desc import - using Python sorting instead

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
    Validates for duplicate email and phone.
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
        # Validate for duplicate email
        if email:
            existing_email = (
                client.table("guardians")
                .select("guardian_id, name")
                .eq("church_id", church_id)
                .eq("email", email)
                .limit(1)
                .execute()
            )
            if existing_email.data:
                return jsonify({
                    "error": f"Email '{email}' is already registered to {existing_email.data[0].get('name', 'another parent')}"
                }), 400

        # Validate for duplicate phone
        if phone:
            existing_phone = (
                client.table("guardians")
                .select("guardian_id, name")
                .eq("church_id", church_id)
                .eq("phone", phone)
                .limit(1)
                .execute()
            )
            if existing_phone.data:
                return jsonify({
                    "error": f"Phone number '{phone}' is already registered to {existing_phone.data[0].get('name', 'another parent')}"
                }), 400

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
            "parentId": g.get("parent_id", ""),  # Include Parent ID in response
            "name": g.get("name", ""),
            "email": g.get("email") or "",
            "phone": g.get("phone") or "",
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


@parents_bp.get("/search")
def search_parents():
    """
    Search parents by Parent ID (e.g., RS073) or name (partial match).
    Query param: ?q=<parent_id_or_name>
    Returns: List of matching parents with their children.
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Search query (q) is required"}), 400

    try:
        guardians = []
        query_upper = query.upper()
        
        # Try exact parent_id match first (e.g., RS073)
        exact_res = (
            client.table("guardians")
            .select("*")
            .eq("church_id", church_id)
            .eq("relationship", "Primary")
            .eq("parent_id", query_upper)
            .execute()
        )
        if exact_res.data:
            guardians = exact_res.data
        else:
            # Try name search (case-insensitive partial match)
            name_res = (
                client.table("guardians")
                .select("*")
                .eq("church_id", church_id)
                .eq("relationship", "Primary")
                .ilike("name", f"%{query}%")
                .execute()
            )
            guardians = name_res.data or []

        if not guardians:
            return jsonify({"data": []})

        # Get all children for these guardians
        guardian_ids = [g["guardian_id"] for g in guardians]
        children_res = (
            client.table("children")
            .select("*, groups(name)")
            .in_("parent_id", guardian_ids)
            .eq("church_id", church_id)
            .execute()
        )
        children_by_guardian: dict[str, list] = {}
        for child in children_res.data or []:
            pid = child.get("parent_id")
            if pid:
                if pid not in children_by_guardian:
                    children_by_guardian[pid] = []
                group = child.get("groups")
                children_by_guardian[pid].append({
                    "id": child.get("child_id"),
                    "registrationId": child.get("registration_id", ""),
                    "name": child.get("name", ""),
                    "dateOfBirth": child.get("date_of_birth"),
                    "group": group.get("name") if group else None,
                    "status": "active",  # Could check pending status if needed
                    "photoUrl": child.get("photo_url"),
                })

        # Build response with children
        results = []
        for g in guardians:
            gid = g["guardian_id"]
            results.append({
                "id": gid,
                "parentId": g.get("parent_id", ""),
                "name": g.get("name", ""),
                "email": g.get("email") or "",
                "phone": g.get("phone") or "",
                "status": "active" if not g.get("active_until") else "inactive",
                "childrenCount": len(children_by_guardian.get(gid, [])),
                "children": children_by_guardian.get(gid, []),
            })

        return jsonify({"data": results})
    except Exception as exc:
        print(f"⚠️ Error searching parents: {exc}")
        return jsonify({"error": "Failed to search parents"}), 500


@parents_bp.get("/<parent_id>/details")
def get_parent_details(parent_id: str):
    """
    Get complete parent information with all children and registration history.
    parent_id can be either UUID (guardian_id) or Parent ID (e.g., RS073).
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Try to find by guardian_id (UUID) first, then by parent_id (RS073)
        res = (
            client.table("guardians")
            .select("*")
            .eq("church_id", church_id)
            .eq("guardian_id", parent_id)
            .limit(1)
            .execute()
        )
        
        # If not found by UUID, try by parent_id (RS073)
        if not res.data:
            res = (
                client.table("guardians")
                .select("*")
                .eq("church_id", church_id)
                .eq("parent_id", parent_id.upper())
                .limit(1)
                .execute()
            )

        if not res.data:
            return jsonify({"error": "Parent not found"}), 404

        g = res.data[0]
        guardian_id = g["guardian_id"]

        # Get all children for this parent
        # Try with groups join, but fallback to without if it fails
        try:
            children_res = (
                client.table("children")
                .select("*, groups(name, group_id)")
                .eq("parent_id", guardian_id)
                .eq("church_id", church_id)
                .execute()
            )
        except Exception as group_error:
            print(f"⚠️ Warning: Could not fetch children with groups join: {group_error}")
            # Fallback: fetch without groups join
            children_res = (
                client.table("children")
                .select("*")
                .eq("parent_id", guardian_id)
                .eq("church_id", church_id)
                .execute()
            )

        children = []
        for child in children_res.data or []:
            group = child.get("groups")
            children.append({
                "id": child.get("child_id"),
                "registrationId": child.get("registration_id", ""),
                "name": child.get("name", ""),
                "dateOfBirth": child.get("date_of_birth"),
                "group": {
                    "id": group.get("group_id") if group and isinstance(group, dict) else None,
                    "name": group.get("name") if group and isinstance(group, dict) else None,
                } if group else None,
                "gender": child.get("gender"),
                "status": "active",  # Could check pending status
                "photoUrl": child.get("photo_url"),
                "createdAt": child.get("created_at"),
            })

        # Get recent check-in records (last 10)
        # Try with joins, but handle gracefully if they fail
        recent_checkins = []
        try:
            # Fetch check-in records and sort in Python to avoid desc import issues
            checkin_res = (
                client.table("check_in_records")
                .select("*, children(name, registration_id), users(name)")
                .eq("guardian_id", guardian_id)
                .eq("church_id", church_id)
                .limit(50)  # Get more records to sort and take top 10
                .execute()
            )
            
            # Filter and sort by timestamp_in descending
            all_records = []
            for record in checkin_res.data or []:
                record_guardian_id = record.get("guardian_id")
                record_child_id = record.get("child_id")
                
                # If guardian_id matches, or if we can verify through child_id
                if record_guardian_id == guardian_id or (record_child_id and any(c["id"] == record_child_id for c in children)):
                    child = record.get("children")
                    teacher = record.get("users")
                    timestamp_in = record.get("timestamp_in")
                    all_records.append({
                        "recordId": record.get("record_id"),
                        "childName": child.get("name") if child and isinstance(child, dict) else "",
                        "childRegistrationId": child.get("registration_id") if child and isinstance(child, dict) else "",
                        "timestampIn": timestamp_in,
                        "timestampOut": record.get("timestamp_out"),
                        "method": record.get("method"),
                        "teacherName": teacher.get("name") if teacher and isinstance(teacher, dict) else "",
                        "_sort_key": timestamp_in or "",  # For sorting
                    })
            
            # Sort by timestamp_in descending and take top 10
            all_records.sort(key=lambda x: x["_sort_key"], reverse=True)
            recent_checkins = [{"recordId": r["recordId"], "childName": r["childName"], 
                               "childRegistrationId": r["childRegistrationId"], 
                               "timestampIn": r["timestampIn"], "timestampOut": r["timestampOut"],
                               "method": r["method"], "teacherName": r["teacherName"]} 
                              for r in all_records[:10]]
        except Exception as checkin_error:
            print(f"⚠️ Warning: Could not fetch check-in records with joins: {checkin_error}")
            # Fallback: try simpler query
            try:
                checkin_res = (
                    client.table("check_in_records")
                    .select("*")
                    .eq("guardian_id", guardian_id)
                    .eq("church_id", church_id)
                    .limit(50)  # Get more to sort
                    .execute()
                )
                
                # Filter and build manually, then sort
                child_ids = [c["id"] for c in children]
                all_records = []
                for record in checkin_res.data or []:
                    if record.get("child_id") in child_ids:
                        timestamp_in = record.get("timestamp_in")
                        all_records.append({
                            "recordId": record.get("record_id"),
                            "childName": "",
                            "childRegistrationId": "",
                            "timestampIn": timestamp_in,
                            "timestampOut": record.get("timestamp_out"),
                            "method": record.get("method"),
                            "teacherName": "",
                            "_sort_key": timestamp_in or "",
                        })
                
                # Sort and take top 10
                all_records.sort(key=lambda x: x["_sort_key"], reverse=True)
                recent_checkins = [{"recordId": r["recordId"], "childName": r["childName"], 
                                   "childRegistrationId": r["childRegistrationId"], 
                                   "timestampIn": r["timestampIn"], "timestampOut": r["timestampOut"],
                                   "method": r["method"], "teacherName": r["teacherName"]} 
                                  for r in all_records[:10]]
            except Exception as simple_checkin_error:
                print(f"⚠️ Warning: Could not fetch check-in records at all: {simple_checkin_error}")
                recent_checkins = []

        parent = {
            "id": guardian_id,
            "parentId": g.get("parent_id", ""),
            "name": g.get("name", ""),
            "email": g.get("email") or "",
            "phone": g.get("phone") or "",
            "photoUrl": g.get("photo_url"),
            "status": "active" if not g.get("active_until") else "inactive",
            "activeUntil": g.get("active_until"),
            "createdAt": g.get("created_at"),
            "childrenCount": len(children),
            "children": children,
            "recentCheckIns": recent_checkins,
        }

        return jsonify({"data": parent})
    except Exception as exc:
        print(f"⚠️ Error fetching parent details: {exc}")
        return jsonify({"error": "Failed to fetch parent details"}), 500




@parents_bp.patch("/<parent_id>")
def update_parent(parent_id: str):
    """
    Update parent information. Supports updating name, email, phone, photo_url, and status.
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    data = request.get_json() or {}
    
    # Validate parent exists
    try:
        res = (
            client.table("guardians")
            .select("guardian_id")
            .eq("church_id", church_id)
            .eq("guardian_id", parent_id)
            .limit(1)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Parent not found"}), 404
    except Exception as exc:
        print(f"⚠️ Error checking parent existence: {exc}")
        return jsonify({"error": "Failed to verify parent"}), 500

    # Build update payload (only include provided fields)
    update_data = {}
    if "name" in data:
        name = str(data["name"]).strip()
        if name:
            update_data["name"] = name
        else:
            return jsonify({"error": "Name cannot be empty"}), 400
    
    if "email" in data:
        email = (data["email"] or "").strip() or None
        # Validate for duplicate email (excluding current parent)
        if email:
            existing_email = (
                client.table("guardians")
                .select("guardian_id, name")
                .eq("church_id", church_id)
                .eq("email", email)
                .neq("guardian_id", parent_id)  # Exclude current parent
                .limit(1)
                .execute()
            )
            if existing_email.data:
                return jsonify({
                    "error": f"Email '{email}' is already registered to {existing_email.data[0].get('name', 'another parent')}"
                }), 400
        update_data["email"] = email
    
    if "phone" in data:
        phone = (data["phone"] or "").strip() or None
        # Validate for duplicate phone (excluding current parent)
        if phone:
            existing_phone = (
                client.table("guardians")
                .select("guardian_id, name")
                .eq("church_id", church_id)
                .eq("phone", phone)
                .neq("guardian_id", parent_id)  # Exclude current parent
                .limit(1)
                .execute()
            )
            if existing_phone.data:
                return jsonify({
                    "error": f"Phone number '{phone}' is already registered to {existing_phone.data[0].get('name', 'another parent')}"
                }), 400
        update_data["phone"] = phone
    
    if "photo_url" in data:
        photo_url = (data["photo_url"] or "").strip() or None
        # Validate URL format if provided
        if photo_url and not (photo_url.startswith("http://") or photo_url.startswith("https://")):
            return jsonify({"error": "Invalid photo URL format"}), 400
        update_data["photo_url"] = photo_url
    
    if "photoUrl" in data:  # Support camelCase
        photo_url = (data["photoUrl"] or "").strip() or None
        if photo_url and not (photo_url.startswith("http://") or photo_url.startswith("https://")):
            return jsonify({"error": "Invalid photo URL format"}), 400
        update_data["photo_url"] = photo_url
    
    if "status" in data:
        status = data["status"]
        if status == "inactive":
            # Set active_until to now if deactivating
            from datetime import datetime, timezone
            update_data["active_until"] = datetime.now(timezone.utc).isoformat()
        elif status == "active":
            update_data["active_until"] = None

    if not update_data:
        return jsonify({"error": "No fields to update"}), 400

    try:
        updated = (
            client.table("guardians")
            .update(update_data)
            .eq("guardian_id", parent_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not updated.data:
            return jsonify({"error": "Failed to update parent"}), 500

        g = updated.data[0]
        parent = {
            "id": g["guardian_id"],
            "parentId": g.get("parent_id", ""),
            "name": g.get("name", ""),
            "email": g.get("email") or "",
            "phone": g.get("phone") or "",
            "photoUrl": g.get("photo_url"),
            "status": "active" if not g.get("active_until") else "inactive",
        }
        return jsonify({"data": parent})
    except Exception as exc:
        print(f"⚠️ Error updating parent in Supabase: {exc}")
        return jsonify({"error": "Failed to update parent"}), 500


@parents_bp.post("/<parent_id>/upload-image")
def upload_parent_image(parent_id: str):
    """
    Upload parent image. Currently accepts image URL (can be extended to handle file uploads).
    For production, this should upload to S3 or similar storage and return the URL.
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    data = request.get_json() or {}
    
    # Accept hex format (new) or URL format (legacy)
    image_hex = data.get("image_hex") or data.get("imageHex")
    mime_type = data.get("mime_type") or data.get("mimeType") or "image/jpeg"
    image_url = (data.get("image_url") or data.get("imageUrl") or "").strip()

    # Convert hex to base64 data URL if hex is provided
    if image_hex:
        try:
            # Convert hex string to bytes
            hex_string = str(image_hex).strip()
            # Remove any whitespace, newlines, or separators
            hex_string = ''.join(hex_string.split())
            # Remove any common hex prefixes if present
            if hex_string.startswith('0x') or hex_string.startswith('0X'):
                hex_string = hex_string[2:]
            
            # Convert to lowercase for consistent parsing
            hex_string = hex_string.lower()
            
            # Validate hex string contains only valid hex characters
            if not all(c in '0123456789abcdef' for c in hex_string):
                return jsonify({"error": "Invalid hex format: contains non-hexadecimal characters"}), 400
            
            # Ensure even length (hex pairs)
            if len(hex_string) % 2 != 0:
                return jsonify({"error": "Invalid hex format: odd number of hex digits"}), 400
            
            # Convert hex to bytes
            image_bytes = bytes.fromhex(hex_string)
            
            # Validate we got some data
            if len(image_bytes) == 0:
                return jsonify({"error": "Invalid hex format: empty image data"}), 400
            
            # Convert bytes to base64
            import base64
            base64_string = base64.b64encode(image_bytes).decode('utf-8')
            # Create data URL
            image_url = f"data:{mime_type};base64,{base64_string}"
        except ValueError as hex_error:
            print(f"⚠️ Error converting hex to base64: {hex_error}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Invalid hex format: {str(hex_error)}"}), 400
        except Exception as hex_error:
            print(f"⚠️ Unexpected error converting hex to base64: {hex_error}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Failed to process hex data: {str(hex_error)}"}), 500
    
    if not image_url:
        return jsonify({"error": "Image data (hex or URL) is required"}), 400

    # Validate URL format - accept http/https URLs or data URLs (base64)
    is_http_url = image_url.startswith("http://") or image_url.startswith("https://")
    is_data_url = image_url.startswith("data:image/") or image_url.startswith("data:")
    
    if not (is_http_url or is_data_url):
        return jsonify({"error": "Invalid image format. Must be http/https URL or base64 data URL"}), 400

    # Validate parent exists - try by guardian_id (UUID) first, then by parent_id (RS032)
    try:
        res = (
            client.table("guardians")
            .select("guardian_id")
            .eq("church_id", church_id)
            .eq("guardian_id", parent_id)
            .limit(1)
            .execute()
        )
        
        # If not found by UUID, try by parent_id (RS032)
        if not res.data:
            res = (
                client.table("guardians")
                .select("guardian_id")
                .eq("church_id", church_id)
                .eq("parent_id", parent_id.upper())
                .limit(1)
                .execute()
            )
        
        if not res.data:
            return jsonify({"error": "Parent not found"}), 404
        
        actual_guardian_id = res.data[0]["guardian_id"]
    except Exception as exc:
        print(f"⚠️ Error checking parent existence: {exc}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to verify parent: {str(exc)}"}), 500

    try:
        updated = (
            client.table("guardians")
            .update({"photo_url": image_url})
            .eq("guardian_id", actual_guardian_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not updated.data:
            return jsonify({"error": "Failed to update parent image - no rows updated"}), 500

        return jsonify({
            "data": {
                "photo_url": image_url,
                "message": "Image uploaded successfully"
            }
        })
    except Exception as exc:
        print(f"⚠️ Error uploading parent image: {exc}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to upload image: {str(exc)}"}), 500


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



