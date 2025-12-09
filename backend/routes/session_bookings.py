"""Session Bookings Routes - For parents to book children for sessions"""

from datetime import datetime, timedelta
import secrets
import json

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id
from utils.qr_codes import generate_qr_code, generate_otp_code

session_bookings_bp = Blueprint("session_bookings", __name__)


@session_bookings_bp.get("/sessions/<session_id>/bookings")
def list_session_bookings(session_id: str):
    """List all bookings for a specific session."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        res = (
            client.table("session_bookings")
            .select("*, children(name, registration_id, group_id, date_of_birth, gender, groups!children_group_id_fkey(name)), guardians(name, email, phone)")
            .eq("session_id", session_id)
            .order("booked_at", desc=True)
            .execute()
        )
        
        bookings = []
        for row in res.data or []:
            child = row.get("children")
            guardian = row.get("guardians")
            # Handle both direct group_id access and nested groups object
            group = None
            if child:
                # Try nested groups object first
                if "groups" in child and child.get("groups"):
                    group = child.get("groups")
                # If groups is a list, take first item
                elif isinstance(child.get("groups"), list) and len(child.get("groups", [])) > 0:
                    group = child.get("groups")[0]
            
            bookings.append({
                "id": row["booking_id"],
                "session_id": row.get("session_id"),
                "child_id": row.get("child_id"),
                "child_name": child.get("name") if child else None,
                "registration_id": child.get("registration_id") if child else None,
                "date_of_birth": child.get("date_of_birth") if child else None,
                "gender": child.get("gender") if child else None,
                "group_id": child.get("group_id") if child else None,
                "group_name": group.get("name") if group else None,
                "guardian_id": row.get("guardian_id"),
                "guardian_name": guardian.get("name") if guardian else None,
                "guardian_email": guardian.get("email") if guardian else None,
                "guardian_phone": guardian.get("phone") if guardian else None,
                "status": row.get("status", "booked"),
                "qr_code": row.get("qr_code"),
                "otp_code": row.get("otp_code"),
                "booked_at": row.get("booked_at"),
                "checked_in_at": row.get("checked_in_at"),
                "checked_out_at": row.get("checked_out_at"),
            })
        
        return jsonify({"data": bookings})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing session bookings: {exc}")
        return jsonify({"error": "Failed to list bookings"}), 500


@session_bookings_bp.post("/sessions/<session_id>/book")
def book_session(session_id: str):
    """Book one or more children for a session."""
    data = request.get_json() or {}
    child_ids = data.get("child_ids") or data.get("childIds") or []
    guardian_id = data.get("guardian_id") or data.get("guardianId")

    if not child_ids:
        # Support single child booking
        child_id = data.get("child_id") or data.get("childId")
        if child_id:
            child_ids = [child_id]
        else:
            return jsonify({"error": "child_id or child_ids is required"}), 400

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Verify session exists
        session_res = (
            client.table("sessions")
            .select("session_id, title, session_date")
            .eq("session_id", session_id)
            .eq("church_id", church_id)
            .execute()
        )
        
        if not session_res.data:
            return jsonify({"error": "Session not found"}), 404

        bookings = []
        errors = []

        for child_id in child_ids:
            try:
                # Check if already booked
                existing = (
                    client.table("session_bookings")
                    .select("booking_id")
                    .eq("session_id", session_id)
                    .eq("child_id", child_id)
                    .execute()
                )
                
                if existing.data:
                    errors.append(f"Child {child_id} already booked for this session")
                    continue

                # Generate QR code and OTP
                # Generate a simple token for QR code (not using the utility that returns datetime)
                qr_code = secrets.token_urlsafe(32)  # Simple token for session booking
                otp_code = generate_otp_code()

                # Create booking
                booking_data = {
                    "session_id": session_id,
                    "child_id": child_id,
                    "guardian_id": guardian_id,
                    "qr_code": qr_code,
                    "otp_code": otp_code,
                    "status": "booked",
                }
                
                booking_res = (
                    client.table("session_bookings")
                    .insert(booking_data)
                    .execute()
                )
                
                if booking_res.data:
                    booking_row = booking_res.data[0]
                    # Convert datetime objects to strings for JSON serialization
                    booked_at = booking_row.get("booked_at")
                    checked_in_at = booking_row.get("checked_in_at")
                    checked_out_at = booking_row.get("checked_out_at")
                    
                    booking_result = {
                        "booking_id": booking_row.get("booking_id"),
                        "session_id": booking_row.get("session_id"),
                        "child_id": booking_row.get("child_id"),
                        "guardian_id": booking_row.get("guardian_id"),
                        "qr_code": booking_row.get("qr_code"),
                        "otp_code": booking_row.get("otp_code"),
                        "status": booking_row.get("status"),
                        "booked_at": booked_at.isoformat() if booked_at and hasattr(booked_at, 'isoformat') else (str(booked_at) if booked_at else None),
                        "checked_in_at": checked_in_at.isoformat() if checked_in_at and hasattr(checked_in_at, 'isoformat') else (str(checked_in_at) if checked_in_at else None),
                        "checked_out_at": checked_out_at.isoformat() if checked_out_at and hasattr(checked_out_at, 'isoformat') else (str(checked_out_at) if checked_out_at else None),
                    }
                    bookings.append(booking_result)
            except Exception as e:
                import traceback
                print(f"⚠️ Error booking child {child_id}: {e}")
                print(traceback.format_exc())
                errors.append(f"Failed to book child {child_id}: {str(e)}")

        if errors and not bookings:
            return jsonify({"error": "; ".join(errors)}), 400

        return jsonify({
            "data": {
                "bookings": bookings,
                "errors": errors if errors else None,
            }
        }), 201
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error booking session: {exc}")
        return jsonify({"error": "Failed to book session"}), 500


@session_bookings_bp.get("/bookings/<booking_id>")
def get_booking(booking_id: str):
    """Get a specific booking."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    try:
        res = (
            client.table("session_bookings")
            .select("*, children(name, registration_id), guardians(name), sessions(title, session_date)")
            .eq("booking_id", booking_id)
            .execute()
        )
        
        if not res.data:
            return jsonify({"error": "Booking not found"}), 404
        
        row = res.data[0]
        child = row.get("children")
        guardian = row.get("guardians")
        session = row.get("sessions")
        
        return jsonify({
            "data": {
                "id": row["booking_id"],
                "session_id": row.get("session_id"),
                "session_title": session.get("title") if session else None,
                "session_date": session.get("session_date") if session else None,
                "child_id": row.get("child_id"),
                "child_name": child.get("name") if child else None,
                "registration_id": child.get("registration_id") if child else None,
                "guardian_id": row.get("guardian_id"),
                "guardian_name": guardian.get("name") if guardian else None,
                "status": row.get("status"),
                "qr_code": row.get("qr_code"),
                "otp_code": row.get("otp_code"),
                "booked_at": row.get("booked_at"),
                "checked_in_at": row.get("checked_in_at"),
                "checked_out_at": row.get("checked_out_at"),
            }
        })
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting booking: {exc}")
        return jsonify({"error": "Failed to get booking"}), 500


@session_bookings_bp.delete("/bookings/<booking_id>")
def cancel_booking(booking_id: str):
    """Cancel a booking."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    try:
        # Update status to cancelled instead of deleting
        res = (
            client.table("session_bookings")
            .update({"status": "cancelled"})
            .eq("booking_id", booking_id)
            .execute()
        )
        
        if not res.data:
            return jsonify({"error": "Booking not found"}), 404
        
        return jsonify({"data": {"success": True}})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error cancelling booking: {exc}")
        return jsonify({"error": "Failed to cancel booking"}), 500


@session_bookings_bp.get("/children/<child_id>/bookings")
def list_child_bookings(child_id: str):
    """List all bookings for a specific child."""
    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    try:
        res = (
            client.table("session_bookings")
            .select("*, sessions(title, session_date, start_time, end_time, session_type)")
            .eq("child_id", child_id)
            .order("booked_at", desc=True)
            .execute()
        )
        
        bookings = []
        for row in res.data or []:
            session = row.get("sessions")
            bookings.append({
                "id": row["booking_id"],
                "session_id": row.get("session_id"),
                "session_title": session.get("title") if session else None,
                "session_date": session.get("session_date") if session else None,
                "start_time": str(session.get("start_time")) if session and session.get("start_time") else None,
                "end_time": str(session.get("end_time")) if session and session.get("end_time") else None,
                "session_type": session.get("session_type") if session else None,
                "status": row.get("status", "booked"),
                "qr_code": row.get("qr_code"),
                "otp_code": row.get("otp_code"),
                "booked_at": row.get("booked_at"),
                "checked_in_at": row.get("checked_in_at"),
                "checked_out_at": row.get("checked_out_at"),
            })
        
        return jsonify({"data": bookings})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error listing child bookings: {exc}")
        return jsonify({"error": "Failed to list bookings"}), 500

