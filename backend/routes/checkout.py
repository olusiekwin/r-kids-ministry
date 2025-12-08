"""
Check-Out Routes - Phase 6 from USER_CASE_FLOW.md
Handles pickup notifications, verification, and check-out completion.
"""

from datetime import datetime, timedelta
import secrets

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id
from utils.qr_codes import generate_qr_code, generate_otp_code, validate_qr_code
from utils.notifications import notify_pickup_ready, notify_checkout_complete

checkout_bp = Blueprint("checkout", __name__)

# In-memory store for pickup codes (temporary)
pickup_codes_db: dict[str, dict] = {}  # {pickup_code: {child_id, guardian_id, expires_at}}


@checkout_bp.post("/notify/<child_id>")
def send_pickup_notification(child_id: str):
    """
    Send pickup notification to parent - Phase 6A.2 from USER_CASE_FLOW.md
    Teacher initiates check-out process and generates pickup QR/OTP codes.
    Now supports session-based check-out.
    """
    data = request.get_json() or {}
    session_id = data.get("session_id") or data.get("sessionId")
    
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Verify child is checked in (optionally for specific session)
        today = datetime.utcnow().date().isoformat()
        query = (
            client.table("check_in_records")
            .select("*")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .gte("timestamp_in", today)
            .is_("timestamp_out", "null")
        )
        
        if session_id:
            query = query.eq("session_id", session_id)
        
        checkin_res = query.order("timestamp_in", desc=True).limit(1).execute()

        if not checkin_res.data:
            return jsonify({"error": "Child is not checked in"}), 404
        
        checkin_record = checkin_res.data[0]
        booking_id = checkin_record.get("booking_id")

        # Get child info
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
        guardian_id = child.get("parent_id")

        # Generate pickup codes using utilities
        qr_result = generate_qr_code(
            child_id=child_id,
            guardian_id=guardian_id,
            purpose="pickup",
            expires_minutes=30,
        )
        pickup_qr = qr_result["qr_code"]
        pickup_otp = generate_otp_code(6)
        expires_at = qr_result["expires_at"]

        # Store pickup codes
        pickup_codes_db[pickup_qr] = {
            "child_id": child_id,
            "guardian_id": guardian_id,
            "expires_at": expires_at,
        }
        pickup_codes_db[pickup_otp] = {
            "child_id": child_id,
            "guardian_id": guardian_id,
            "expires_at": expires_at,
        }

        # Send notification to parent (Phase 6A.2)
        notify_pickup_ready(
            child_id=child_id,
            guardian_id=guardian_id,
            child_name=child.get("name"),
            pickup_qr=pickup_qr,
            pickup_otp=pickup_otp,
        )

        return jsonify({
            "data": {
                "childId": child_id,
                "childName": child.get("name"),
                "pickupQR": pickup_qr,
                "pickupOTP": pickup_otp,
                "expiresAt": expires_at.isoformat(),
                "sessionId": session_id,
                "bookingId": booking_id,
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error sending pickup notification: {exc}")
        return jsonify({"error": "Failed to send pickup notification"}), 500


@checkout_bp.post("/verify")
def verify_pickup():
    """
    Verify pickup identity (QR or OTP) - Phase 6A.3 from USER_CASE_FLOW.md
    Teacher verifies parent/guardian identity before releasing child.
    """
    data = request.get_json() or {}
    pickup_code = data.get("pickup_code") or data.get("pickupCode") or data.get("qr_code") or data.get("otp_code")
    child_id = data.get("child_id") or data.get("childId")

    if not pickup_code:
        return jsonify({"error": "Pickup code (QR or OTP) is required"}), 400

    # Validate pickup code using utility
    is_valid, error_msg = validate_qr_code(pickup_code, pickup_codes_db)
    if not is_valid:
        if pickup_code in pickup_codes_db:
            del pickup_codes_db[pickup_code]
        return jsonify({"error": error_msg or "Invalid or expired pickup code"}), 401

    code_data = pickup_codes_db[pickup_code]

    verified_child_id = code_data["child_id"]
    if child_id and child_id != verified_child_id:
        return jsonify({"error": "Pickup code does not match child"}), 400

    # Verify guardian is authorized (Phase 6B.2)
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Check if guardian is authorized for this child
        guardian_id = code_data["guardian_id"]
        guardians_res = (
            client.table("child_guardians")
            .select("*, guardians(name, relationship)")
            .eq("child_id", verified_child_id)
            .eq("guardian_id", guardian_id)
            .eq("is_authorized", True)
            .execute()
        )

        # Primary guardian is always authorized (check parent_id directly)
        child_res = (
            client.table("children")
            .select("parent_id")
            .eq("child_id", verified_child_id)
            .eq("church_id", church_id)
            .execute()
        )
        is_primary = child_res.data and child_res.data[0].get("parent_id") == guardian_id
        is_authorized = is_primary or (guardians_res.data and len(guardians_res.data) > 0)

        if not is_authorized:
            return jsonify({"error": "Guardian is not authorized to pick up this child"}), 403

        return jsonify({
            "data": {
                "verified": True,
                "childId": verified_child_id,
                "guardianId": guardian_id,
                "authorized": True,
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error verifying pickup: {exc}")
        return jsonify({"error": "Failed to verify pickup"}), 500


@checkout_bp.post("/pickup-code/<child_id>")
def generate_pickup_code(child_id: str):
    """
    Generate pickup code for a child - Alternative endpoint.
    """
    return send_pickup_notification(child_id)


@checkout_bp.post("/release/<child_id>")
def release_child(child_id: str):
    """
    Complete check-out and release child - Phase 6A.4 from USER_CASE_FLOW.md
    Marks child as checked out in check_in_records table.
    """
    data = request.get_json() or {}
    guardian_id = data.get("guardian_id") or data.get("guardianId")

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Find active check-in record
        today = datetime.utcnow().date().isoformat()
        checkin_res = (
            client.table("check_in_records")
            .select("*")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .gte("timestamp_in", today)
            .is_("timestamp_out", "null")
            .order("timestamp_in", desc=True)
            .limit(1)
            .execute()
        )

        if not checkin_res.data:
            # Check if child has any check-ins today (might be already checked out)
            all_today_checkins = (
                client.table("check_in_records")
                .select("timestamp_in, timestamp_out")
                .eq("child_id", child_id)
                .eq("church_id", church_id)
                .gte("timestamp_in", today)
                .order("timestamp_in", desc=True)
                .limit(5)
                .execute()
            )
            
            if all_today_checkins.data:
                # Child has check-ins today but all are checked out
                return jsonify({
                    "error": "Child is not currently checked in",
                    "message": "Child has already been checked out or has no active check-in record for today"
                }), 404
            else:
                return jsonify({
                    "error": "Child is not checked in",
                    "message": f"No check-in record found for child {child_id} today"
                }), 404

        record = checkin_res.data[0]
        record_id = record["record_id"]
        booking_id = record.get("booking_id")
        session_id = record.get("session_id")

        # Update check-out timestamp
        update_res = (
            client.table("check_in_records")
            .update({
                "timestamp_out": datetime.utcnow().isoformat(),
                "guardian_id": guardian_id,  # Update if provided
            })
            .eq("record_id", record_id)
            .execute()
        )

        if not update_res.data:
            return jsonify({"error": "Failed to update check-out record"}), 500

        # Update booking status if booking_id exists
        if booking_id:
            try:
                client.table("session_bookings").update({
                    "status": "checked_out",
                    "checked_out_at": datetime.utcnow().isoformat(),
                }).eq("booking_id", booking_id).execute()
            except Exception as e:
                print(f"⚠️ Error updating booking status: {e}")

        # Send confirmation notification (Phase 6A.4)
        # Get child name for notification
        child_res = (
            client.table("children")
            .select("name")
            .eq("child_id", child_id)
            .eq("church_id", church_id)
            .execute()
        )
        child_name = child_res.data[0].get("name") if child_res.data else None
        
        notify_checkout_complete(
            child_id=child_id,
            guardian_id=guardian_id,
            child_name=child_name,
        )

        return jsonify({
            "data": {
                "recordId": record_id,
                "childId": child_id,
                "timestampOut": update_res.data[0].get("timestamp_out"),
                "status": "checked_out",
                "sessionId": session_id,
                "bookingId": booking_id,
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error releasing child: {exc}")
        import traceback
        traceback.print_exc()
        error_msg = str(exc)
        # Provide more specific error messages
        if "foreign key" in error_msg.lower():
            return jsonify({
                "error": "Database constraint violation",
                "message": "The child or guardian ID does not exist in the database",
                "details": error_msg
            }), 400
        return jsonify({
            "error": "Failed to release child",
            "message": error_msg
        }), 500

