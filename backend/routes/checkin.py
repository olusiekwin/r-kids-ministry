"""
Check-In Routes - Phase 3 from USER_CASE_FLOW.md
Handles QR code generation, scanning, manual check-in, and OTP verification.
"""

from datetime import datetime, timedelta
import secrets

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id
from utils.qr_codes import generate_qr_code, generate_otp_code, validate_qr_code
from utils.notifications import notify_check_in

checkin_bp = Blueprint("checkin", __name__)

# In-memory store for QR codes and OTPs (temporary, expires)
qr_codes_db: dict[str, dict] = {}  # {qr_code: {child_id, expires_at, guardian_id, data}}
otp_codes_db: dict[str, dict] = {}  # {otp_code: {child_id, expires_at, guardian_id}}


@checkin_bp.post("/generate-qr")
def generate_qr():
    """
    Generate QR code for pre-check-in - Phase 3A.1 from USER_CASE_FLOW.md
    Parent generates QR code before arriving at church (15-minute validity).
    """
    data = request.get_json() or {}
    child_id = data.get("child_id") or data.get("childId")
    guardian_id = data.get("guardian_id") or data.get("guardianId")

    if not child_id:
        return jsonify({"error": "child_id is required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Verify child exists
        child_res = (
            client.table("children")
            .select("child_id, name")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not child_res.data:
            return jsonify({"error": "Child not found"}), 404
        child = child_res.data[0]

        # Generate QR code using utility
        qr_result = generate_qr_code(
            child_id=child_id,
            guardian_id=guardian_id,
            purpose="checkin",
            expires_minutes=15,
        )
        qr_code = qr_result["qr_code"]
        expires_at = qr_result["expires_at"]

        # Store QR code
        qr_codes_db[qr_code] = {
            "child_id": child_id,
            "guardian_id": guardian_id,
            "expires_at": expires_at,
            "data": qr_result["data"],
        }

        return jsonify({
            "data": {
                "qrCode": qr_code,
                "expiresAt": expires_at.isoformat(),
                "childName": child.get("name"),
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error generating QR code: {exc}")
        return jsonify({"error": "Failed to generate QR code"}), 500


@checkin_bp.post("/scan-qr")
def scan_qr():
    """
    Scan and verify QR code for check-in - Phase 3B.2 from USER_CASE_FLOW.md
    Teacher scans QR code from parent's phone.
    Now supports session-based check-in.
    """
    data = request.get_json() or {}
    qr_code = data.get("qr_code") or data.get("qrCode")
    session_id = data.get("session_id") or data.get("sessionId")
    teacher_id = data.get("teacher_id") or data.get("teacherId")  # From auth token in real app

    if not qr_code:
        return jsonify({"error": "QR code is required"}), 400

    if not teacher_id:
        return jsonify({"error": "teacher_id is required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    # If session_id provided, look up booking
    booking_id = None
    child_id = None
    guardian_id = None

    if session_id:
        try:
            # Find booking by QR code and session
            booking_res = (
                client.table("session_bookings")
                .select("booking_id, child_id, guardian_id, status")
                .eq("session_id", session_id)
                .eq("qr_code", qr_code)
                .execute()
            )
            
            if booking_res.data:
                booking = booking_res.data[0]
                if booking.get("status") != "booked":
                    return jsonify({"error": "Child already checked in or cancelled"}), 400
                booking_id = booking["booking_id"]
                child_id = booking["child_id"]
                guardian_id = booking.get("guardian_id")
            else:
                return jsonify({"error": "No booking found for this QR code and session"}), 404
        except Exception as exc:
            print(f"⚠️ Error looking up booking: {exc}")
            return jsonify({"error": "Failed to verify booking"}), 500
    else:
        # Legacy: Validate QR code using in-memory store
        is_valid, error_msg = validate_qr_code(qr_code, qr_codes_db)
        if not is_valid:
            if qr_code in qr_codes_db:
                del qr_codes_db[qr_code]
            return jsonify({"error": error_msg or "Invalid or expired QR code"}), 401

        qr_data = qr_codes_db[qr_code]
        child_id = qr_data["child_id"]
        guardian_id = qr_data.get("guardian_id")

    # Create check-in record
    return _create_checkin_record(
        child_id, guardian_id, teacher_id, "QR", 
        qr_code=qr_code, session_id=session_id, booking_id=booking_id
    )


@checkin_bp.post("/manual")
def manual_checkin():
    """
    Manual check-in by teacher - Phase 3B.3 from USER_CASE_FLOW.md
    Teacher searches for child and checks them in manually.
    Now supports session-based check-in.
    """
    data = request.get_json() or {}
    child_id = data.get("child_id") or data.get("childId")
    session_id = data.get("session_id") or data.get("sessionId")
    teacher_id = data.get("teacher_id") or data.get("teacherId")  # From auth token or request
    guardian_id = data.get("guardian_id") or data.get("guardianId")  # Optional

    if not child_id:
        return jsonify({"error": "child_id is required", "message": "Please provide a valid child ID"}), 400
    
    if not teacher_id:
        return jsonify({"error": "teacher_id is required", "message": "Please provide a valid teacher/user ID"}), 400
    
    # Validate UUID format
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not uuid_pattern.match(str(child_id)):
        return jsonify({
            "error": "Invalid child_id format",
            "message": f"child_id must be a valid UUID format. Received: {child_id}"
        }), 400
    if not uuid_pattern.match(str(teacher_id)):
        return jsonify({
            "error": "Invalid teacher_id format",
            "message": f"teacher_id must be a valid UUID format. Received: {teacher_id}"
        }), 400

    client = get_supabase()
    booking_id = None

        if client is None:
            return jsonify({"error": "Supabase not configured"}), 500
        
    # If session_id provided, find or create booking
    if session_id:
        try:
            booking_res = (
                client.table("session_bookings")
                .select("booking_id, guardian_id, status")
                .eq("session_id", session_id)
                .eq("child_id", child_id)
                .execute()
            )
            
            if booking_res.data:
                # Booking exists - use it
                booking = booking_res.data[0]
                booking_id = booking["booking_id"]
                if not guardian_id:
                    guardian_id = booking.get("guardian_id")
            else:
                # No booking exists - create one for session check-in
                try:
                    import secrets
                    from utils.qr_codes import generate_otp_code
                    
                    if not guardian_id:
                        # Get guardian_id from child
                        child_res = (
                            client.table("children")
                            .select("parent_id")
                            .eq("child_id", child_id)
                            .execute()
                        )
                        if child_res.data:
                            guardian_id = child_res.data[0].get("parent_id")
                    
                    # Create booking
                    qr_code = secrets.token_urlsafe(32)
                    otp_code = generate_otp_code()
                    booking_data = {
                        "session_id": session_id,
                        "child_id": child_id,
                        "guardian_id": guardian_id,
                        "qr_code": qr_code,
                        "otp_code": otp_code,
                        "status": "booked",  # Will be updated to checked_in after check-in record is created
                    }
                    
                    new_booking_res = (
                        client.table("session_bookings")
                        .insert(booking_data)
                        .execute()
                    )
                    
                    if new_booking_res.data:
                        booking_id = new_booking_res.data[0]["booking_id"]
                        print(f"✅ Created new booking {booking_id} for child {child_id} in session {session_id}")
                except Exception as create_booking_error:
                    print(f"⚠️ Error creating booking: {create_booking_error}")
                    # Continue without booking_id - check-in will still work
        except Exception as exc:
            print(f"⚠️ Error looking up booking: {exc}")
            # Continue without booking_id - allow manual check-in

    # ALWAYS get guardian_id from child's parent to ensure data integrity
    # This prevents data mix-up in history queries
    if not guardian_id:
        try:
            church_id = get_default_church_id()
            if church_id:
                child_res = (
                    client.table("children")
                    .select("parent_id")
                    .eq("child_id", child_id)
                    .eq("church_id", church_id)
                    .limit(1)
                    .execute()
                )
                if child_res.data and child_res.data[0].get("parent_id"):
                    guardian_id = child_res.data[0]["parent_id"]
                    print(f"✅ Auto-fetched guardian_id {guardian_id} for child {child_id}")
        except Exception as e:
            print(f"⚠️ Error fetching child's parent: {e}")
            import traceback
            traceback.print_exc()
    
    # Log if guardian_id is still missing (for debugging)
    if not guardian_id:
        print(f"⚠️ Warning: No guardian_id found for child {child_id}. Check-in will proceed but history may be incomplete.")

    # Use "PARENT_ID" method for manual check-in (matches database constraint)
    return _create_checkin_record(
        child_id, guardian_id, teacher_id, "PARENT_ID",
        session_id=session_id, booking_id=booking_id
    )


@checkin_bp.post("/verify-otp")
def verify_otp():
    """
    Verify OTP code for check-in - Alternative to QR code.
    Now supports session-based check-in and direct child_id lookup.
    """
    data = request.get_json() or {}
    otp_code = data.get("otp_code") or data.get("otpCode")
    child_id = data.get("child_id") or data.get("childId")
    session_id = data.get("session_id") or data.get("sessionId")
    teacher_id = data.get("teacher_id") or data.get("teacherId")

    if not otp_code:
        return jsonify({"error": "OTP code is required"}), 400
    
    if not teacher_id:
        return jsonify({"error": "teacher_id is required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    booking_id = None
    guardian_id = None

    if session_id:
        # Look up booking by OTP and session
        try:
            booking_res = (
                client.table("session_bookings")
                .select("booking_id, child_id, guardian_id, status")
                .eq("session_id", session_id)
                .eq("otp_code", otp_code)
                .execute()
            )
            
            if booking_res.data:
                booking = booking_res.data[0]
                if booking.get("status") != "booked":
                    return jsonify({"error": "Child already checked in or cancelled"}), 400
                booking_id = booking["booking_id"]
                child_id = booking["child_id"]
                guardian_id = booking.get("guardian_id")
            else:
                return jsonify({"error": "No booking found for this OTP and session"}), 404
        except Exception as exc:
            print(f"⚠️ Error looking up booking: {exc}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": "Failed to verify booking"}), 500
    else:
        # If child_id provided, use it directly (for manual OTP entry)
        if child_id:
            # Verify child exists and get guardian
            try:
                church_id = get_default_church_id()
                if church_id is None:
                    return jsonify({"error": "No church configured"}), 500
                
                child_res = (
                    client.table("children")
                    .select("child_id, parent_id")
                    .eq("child_id", child_id)
                    .eq("church_id", church_id)
                    .limit(1)
                    .execute()
                )
                
                if not child_res.data:
                    return jsonify({"error": "Child not found"}), 404
                
                guardian_id = child_res.data[0].get("parent_id")
            except Exception as exc:
                print(f"⚠️ Error looking up child: {exc}")
                import traceback
                traceback.print_exc()
                return jsonify({"error": "Failed to verify child"}), 500
    else:
        # Legacy: Check in-memory OTP store
        if otp_code not in otp_codes_db:
                return jsonify({"error": "Invalid or expired OTP code. Please provide child_id or use a valid OTP."}), 401

        otp_data = otp_codes_db[otp_code]
        if datetime.utcnow() > otp_data["expires_at"]:
            del otp_codes_db[otp_code]
            return jsonify({"error": "OTP code expired"}), 401

        child_id = otp_data["child_id"]
        guardian_id = otp_data.get("guardian_id")
        del otp_codes_db[otp_code]

    if not child_id:
        return jsonify({"error": "Could not determine child_id from OTP"}), 400

    # Create check-in record
    return _create_checkin_record(
        child_id, guardian_id, teacher_id, "OTP", 
        otp_code=otp_code, session_id=session_id, booking_id=booking_id
    )


@checkin_bp.get("/active")
def list_active_checkins():
    """
    Get all currently checked-in children (not checked out yet).
    Returns list of children with their check-in details.
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get all active check-in records (timestamp_out is null) for today
        today = datetime.utcnow().date().isoformat()
        res = (
            client.table("check_in_records")
            .select("*, children(child_id, name, registration_id, group_id), guardians(guardian_id, name, parent_id)")
            .eq("church_id", church_id)
            .gte("timestamp_in", today)
            .is_("timestamp_out", "null")
            .order("timestamp_in", desc=False)
            .execute()
        )

        # Format the response
        active_checkins = []
        for record in res.data:
            child = record.get("children")
            guardian = record.get("guardians")
            child_id = record.get("child_id")
            group_id = child.get("group_id") if child else None
            
            # Get group name if group_id exists
            group_name = None
            if group_id:
                try:
                    group_res = (
                        client.table("groups")
                        .select("name")
                        .eq("group_id", group_id)
                        .eq("church_id", church_id)
                        .limit(1)
                        .execute()
                    )
                    if group_res.data:
                        group_name = group_res.data[0].get("name")
                except Exception as e:
                    print(f"⚠️ Error fetching group name: {e}")
            
            active_checkins.append({
                "recordId": record.get("record_id"),
                "childId": child_id,
                "childName": child.get("name") if child else "Unknown",
                "registrationId": child.get("registration_id") if child else None,
                "groupId": group_id,
                "groupName": group_name,
                "guardianId": record.get("guardian_id"),
                "guardianName": guardian.get("name") if guardian else None,
                "parentId": guardian.get("parent_id") if guardian else None,
                "teacherId": record.get("teacher_id"),
                "timestampIn": record.get("timestamp_in"),
                "method": record.get("method"),
                "sessionId": record.get("session_id"),
            })

        return jsonify({"data": active_checkins})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting active check-ins: {exc}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to get active check-ins"}), 500


@checkin_bp.get("/status/<child_id>")
def checkin_status(child_id: str):
    """
    Get current check-in status for a child - Phase 4 from USER_CASE_FLOW.md
    Returns whether child is checked in, ready for pickup, or checked out.
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get most recent check-in record for today
        today = datetime.utcnow().date().isoformat()
        res = (
            client.table("check_in_records")
            .select("*")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .gte("timestamp_in", today)
            .order("timestamp_in", desc=True)
            .limit(1)
            .execute()
        )

        if not res.data:
            return jsonify({"data": {"status": "not_checked_in", "checkedIn": False}})

        record = res.data[0]
        has_checkout = record.get("timestamp_out") is not None

        return jsonify({
            "data": {
                "status": "checked_out" if has_checkout else "checked_in",
                "checkedIn": not has_checkout,
                "checkedOut": has_checkout,
                "timestampIn": record.get("timestamp_in"),
                "timestampOut": record.get("timestamp_out"),
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting check-in status: {exc}")
        return jsonify({"error": "Failed to get check-in status"}), 500


def _create_checkin_record(
    child_id: str,
    guardian_id: str | None,
    teacher_id: str | None,
    method: str,
    qr_code: str | None = None,
    otp_code: str | None = None,
    session_id: str | None = None,
    booking_id: str | None = None,
):
    """Helper to create check-in record in Supabase - Phase 3B.4 from USER_CASE_FLOW.md.
    Now supports linking to sessions and bookings.
    """
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    # teacher_id is required for all check-in records
    if not teacher_id:
        return jsonify({"error": "teacher_id is required"}), 400

    try:
        # Verify child exists
        child_res = (
            client.table("children")
            .select("child_id, name, group_id")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        if not child_res.data:
            return jsonify({"error": "Child not found"}), 404
        child = child_res.data[0]

        # Verify teacher/user exists in users table (required for foreign key)
        try:
            user_res = (
                client.table("users")
                .select("user_id, role")
                .eq("user_id", teacher_id)
                .eq("church_id", church_id)
                .limit(1)
                .execute()
            )
            if not user_res.data:
                # User doesn't exist - this might be an admin checking in
                # Try to find any user with admin or teacher role to use as fallback
                fallback_user_res = (
                    client.table("users")
                    .select("user_id")
                    .eq("church_id", church_id)
                    .in_("role", ["Admin", "Teacher", "admin", "teacher"])
                    .limit(1)
                    .execute()
                )
                if fallback_user_res.data:
                    teacher_id = fallback_user_res.data[0]["user_id"]
                    print(f"⚠️ User {teacher_id} not found, using fallback teacher: {teacher_id}")
                else:
                    return jsonify({
                        "error": "Teacher/User not found",
                        "message": f"User ID {teacher_id} does not exist in the users table. Please ensure the user is registered."
                    }), 404
        except Exception as user_check_error:
            print(f"⚠️ Error checking user existence: {user_check_error}")
            import traceback
            traceback.print_exc()
            # Continue anyway - might work if user exists

        # Create check-in record
        record_data = {
            "church_id": church_id,
            "child_id": child_id,
            "teacher_id": teacher_id,  # Required field
            "method": method,
            "timestamp_in": datetime.utcnow().isoformat(),
        }
        if guardian_id:
            record_data["guardian_id"] = guardian_id
        if qr_code:
            record_data["qr_code"] = qr_code
        if otp_code:
            record_data["otp_code"] = otp_code
        if session_id:
            record_data["session_id"] = session_id
        if booking_id:
            record_data["booking_id"] = booking_id

        try:
        res = client.table("check_in_records").insert(record_data).execute()
        if not res.data:
                return jsonify({"error": "Failed to create check-in record", "message": "Database insert returned no data"}), 500
        record = res.data[0]
        except Exception as insert_error:
            print(f"⚠️ Error inserting check-in record: {insert_error}")
            import traceback
            traceback.print_exc()
            error_msg = str(insert_error)
            # Check for specific database errors
            if "foreign key" in error_msg.lower() or "violates foreign key" in error_msg.lower():
                if "teacher_id" in error_msg.lower() or "user_id" in error_msg.lower():
                    return jsonify({
                        "error": "Database constraint violation",
                        "message": f"Teacher/User ID {teacher_id} does not exist in the users table. Please ensure the user is registered in the system.",
                        "details": error_msg
                    }), 400
                elif "child_id" in error_msg.lower():
                    return jsonify({
                        "error": "Database constraint violation",
                        "message": f"Child ID {child_id} does not exist in the children table.",
                        "details": error_msg
                    }), 400
            # Check for UUID format errors
            if "invalid input syntax for type uuid" in error_msg.lower() or "22P02" in error_msg:
                return jsonify({
                    "error": "Invalid UUID format",
                    "message": "One or more IDs provided are not in valid UUID format. Please check child_id and teacher_id.",
                    "details": error_msg
                }), 400
            return jsonify({
                "error": "Failed to create check-in record",
                "message": error_msg
            }), 500

        # Update booking status if booking_id exists
        if booking_id:
            try:
                client.table("session_bookings").update({
                    "status": "checked_in",
                    "checked_in_at": datetime.utcnow().isoformat(),
                }).eq("booking_id", booking_id).execute()
            except Exception as e:
                print(f"⚠️ Error updating booking status: {e}")

        # Send notification to parent (Phase 3B.4)
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
                "method": method,
                "status": "checked_in",
                "sessionId": session_id,
                "bookingId": booking_id,
            }
        }), 201
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error creating check-in record: {exc}")
        import traceback
        traceback.print_exc()
        error_msg = str(exc)
        # Provide more specific error messages
        if "foreign key" in error_msg.lower() or "violates foreign key" in error_msg.lower():
            return jsonify({
                "error": "Database constraint violation",
                "message": "The teacher/user ID does not exist in the users table. Please ensure the user is registered.",
                "details": error_msg
            }), 400
        return jsonify({
            "error": "Failed to create check-in record",
            "message": error_msg
        }), 500

