"""
Notification Helper - Creates notifications in Supabase database
Phase 3B.4, 5, 6A.2, 6A.4 from USER_CASE_FLOW.md
"""

from datetime import datetime
from typing import Optional

from supabase_client import get_supabase, get_default_church_id


def create_notification(
    notification_type: str,
    content: str,
    title: Optional[str] = None,
    child_id: Optional[str] = None,
    guardian_id: Optional[str] = None,
    user_id: Optional[str] = None,
    metadata: Optional[dict] = None,
    action_required: bool = False,  # Not used, kept for API compatibility
) -> Optional[str]:
    """
    Create a notification record in Supabase notifications table.
    Also attempts to send email/SMS if guardian email/phone is available.
    
    Args:
        notification_type: One of 'CheckIn', 'CheckOut', 'Birthday', 'Reminder', 'OTP' (per schema constraint)
        content: Notification message text
        title: Optional title (will be prepended to content)
        child_id: Optional child UUID
        guardian_id: Optional guardian UUID
        user_id: Optional user UUID (not in schema, ignored)
        metadata: Optional JSON metadata (will be appended to content)
        action_required: Not used (not in schema), kept for API compatibility
    
    Returns:
        notification_id if successful, None otherwise
    """
    client = get_supabase()
    if client is None:
        print("⚠️ Supabase not configured, cannot create notification")
        return None

    church_id = get_default_church_id()
    if church_id is None:
        print("⚠️ No church configured, cannot create notification")
        return None

    try:
        # Build notification content with title if provided
        full_content = content
        if title:
            full_content = f"{title}\n\n{content}"
        
        # Append metadata if provided (for pickup QR/OTP codes)
        if metadata:
            metadata_parts = []
            for k, v in metadata.items():
                if k not in ["action", "timestamp"]:  # Skip internal metadata
                    if k == "pickup_qr":
                        metadata_parts.append(f"Pickup QR: {v}")
                    elif k == "pickup_otp":
                        metadata_parts.append(f"Pickup OTP: {v}")
                    else:
                        metadata_parts.append(f"{k}: {v}")
            if metadata_parts:
                full_content = f"{full_content}\n\n{', '.join(metadata_parts)}"

        notification_data = {
            "church_id": church_id,
            "type": notification_type,
            "content": full_content,
            "email_sent": False,
            "sms_sent": False,
            "delivery_status": "pending",
        }

        if child_id:
            notification_data["child_id"] = child_id
        if guardian_id:
            notification_data["guardian_id"] = guardian_id

        # Insert notification
        res = client.table("notifications").insert(notification_data).execute()
        if not res.data:
            print("⚠️ Failed to create notification record")
            return None
        
        notification_id = res.data[0].get("notification_id")
        
        # Attempt to send email/SMS if guardian_id is provided
        email_sent = False
        sms_sent = False
        if guardian_id:
            try:
                # Get guardian contact info
                guardian_res = (
                    client.table("guardians")
                    .select("email, phone, name")
                    .eq("guardian_id", guardian_id)
                    .eq("church_id", church_id)
                    .limit(1)
                    .execute()
                )
                
                if guardian_res.data:
                    guardian = guardian_res.data[0]
                    guardian_email = guardian.get("email")
                    guardian_phone = guardian.get("phone")
                    guardian_name = guardian.get("name", "Parent")
                    
                    # Send email if email is available
                    if guardian_email:
                        try:
                            # TODO: Implement actual email sending via SMTP or email service
                            # For now, just mark as sent (in production, use SendGrid, AWS SES, etc.)
                            email_sent = _send_email_notification(
                                to_email=guardian_email,
                                to_name=guardian_name,
                                subject=title or f"Ministry Notification: {notification_type}",
                                body=full_content,
                            )
                        except Exception as e:
                            print(f"⚠️ Error sending email notification: {e}")
                    
                    # Send SMS if phone is available
                    if guardian_phone:
                        try:
                            # TODO: Implement actual SMS sending via Twilio, AWS SNS, etc.
                            # For now, just mark as sent
                            sms_sent = _send_sms_notification(
                                to_phone=guardian_phone,
                                message=content,  # Shorter message for SMS
                            )
                        except Exception as e:
                            print(f"⚠️ Error sending SMS notification: {e}")
                    
                    # Update notification with delivery status
                    delivery_status = "sent" if (email_sent or sms_sent) else "pending"
                    client.table("notifications").update({
                        "email_sent": email_sent,
                        "sms_sent": sms_sent,
                        "delivery_status": delivery_status,
                        "sent_at": datetime.utcnow().isoformat() if (email_sent or sms_sent) else None,
                    }).eq("notification_id", notification_id).execute()
            except Exception as e:
                print(f"⚠️ Error sending traditional notifications (email/SMS): {e}")
        
        print(f"✅ Notification created: {notification_type} - {notification_id} (Email: {email_sent}, SMS: {sms_sent})")
        return notification_id
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error creating notification: {exc}")
        return None


def _send_email_notification(to_email: str, to_name: str, subject: str, body: str) -> bool:
    """
    Send email notification (placeholder - implement with actual email service).
    
    In production, integrate with:
    - SendGrid
    - AWS SES
    - Mailgun
    - SMTP server
    
    Returns:
        True if sent successfully, False otherwise
    """
    # TODO: Implement actual email sending
    # For now, just log that we would send it
    print(f"📧 [Email] Would send to {to_email}: {subject}")
    # In production, return True only if email was actually sent
    return False  # Change to True when email service is configured


def _send_sms_notification(to_phone: str, message: str) -> bool:
    """
    Send SMS notification (placeholder - implement with actual SMS service).
    
    In production, integrate with:
    - Twilio
    - AWS SNS
    - MessageBird
    
    Returns:
        True if sent successfully, False otherwise
    """
    # TODO: Implement actual SMS sending
    # For now, just log that we would send it
    print(f"📱 [SMS] Would send to {to_phone}: {message[:50]}...")
    # In production, return True only if SMS was actually sent
    return False  # Change to True when SMS service is configured


def notify_check_in(child_id: str, guardian_id: Optional[str] = None, child_name: Optional[str] = None):
    """Send check-in notification to parent - Phase 3B.4 from USER_CASE_FLOW.md"""
    child_name = child_name or "Your child"
    content = f"Your child {child_name} has been checked in successfully."
    return create_notification(
        notification_type="CheckIn",
        title="Child Checked In",
        content=content,
        child_id=child_id,
        guardian_id=guardian_id,
        metadata={"action": "check_in", "timestamp": datetime.utcnow().isoformat()},
    )


def notify_pickup_ready(
    child_id: str,
    guardian_id: Optional[str] = None,
    child_name: Optional[str] = None,
    pickup_qr: Optional[str] = None,
    pickup_otp: Optional[str] = None,
):
    """Send pickup ready notification - Phase 6A.2 from USER_CASE_FLOW.md"""
    child_name = child_name or "Your child"
    content = f"Your child {child_name} is ready for pickup. Please proceed to the pickup area."
    metadata = {
        "action": "pickup_ready",
        "timestamp": datetime.utcnow().isoformat(),
    }
    if pickup_qr:
        metadata["pickup_qr"] = pickup_qr
    if pickup_otp:
        metadata["pickup_otp"] = pickup_otp

    return create_notification(
        notification_type="Reminder",  # Changed from "Pickup" - schema only allows: CheckIn, CheckOut, Birthday, Reminder, OTP
        title="Ready for Pickup",
        content=content,
        child_id=child_id,
        guardian_id=guardian_id,
        metadata=metadata,
        action_required=True,
    )


def notify_checkout_complete(
    child_id: str,
    guardian_id: Optional[str] = None,
    child_name: Optional[str] = None,
):
    """Send checkout confirmation notification - Phase 6A.4 from USER_CASE_FLOW.md"""
    child_name = child_name or "Your child"
    content = f"You have successfully picked up {child_name}."
    return create_notification(
        notification_type="CheckOut",
        title="Check-Out Complete",
        content=content,
        child_id=child_id,
        guardian_id=guardian_id,
        metadata={"action": "checkout", "timestamp": datetime.utcnow().isoformat()},
    )


def notify_child_approved(child_id: str, guardian_id: Optional[str] = None, child_name: Optional[str] = None):
    """Send child approval notification - Phase 2 from USER_CASE_FLOW.md"""
    child_name = child_name or "Your child"
    content = f"Great news! {child_name} has been approved and is now active in the ministry."
    return create_notification(
        notification_type="Reminder",  # Changed from "Approval" - schema only allows: CheckIn, CheckOut, Birthday, Reminder, OTP
        title="Child Approved",
        content=content,
        child_id=child_id,
        guardian_id=guardian_id,
        metadata={"action": "approval", "timestamp": datetime.utcnow().isoformat()},
    )


def notify_child_rejected(child_id: str, guardian_id: Optional[str] = None, child_name: Optional[str] = None, reason: Optional[str] = None):
    """Send child rejection notification - Phase 2 from USER_CASE_FLOW.md"""
    child_name = child_name or "Your child"
    content = f"{child_name}'s registration has been reviewed. Please contact the ministry for more information."
    if reason:
        content += f" Reason: {reason}"
    return create_notification(
        notification_type="Reminder",  # Changed from "Rejection" - schema only allows: CheckIn, CheckOut, Birthday, Reminder, OTP
        title="Registration Update",
        content=content,
        child_id=child_id,
        guardian_id=guardian_id,
        metadata={"action": "rejection", "reason": reason, "timestamp": datetime.utcnow().isoformat()},
        action_required=True,
    )

