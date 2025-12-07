"""
QR Code Utilities - Generate and validate QR codes for check-in/check-out
Phase 3A.1, 3B.2, 6A.2, 6A.3 from USER_CASE_FLOW.md
"""

import secrets
import json
from datetime import datetime, timedelta
from typing import Optional, Dict


def generate_qr_code(
    child_id: str,
    guardian_id: Optional[str] = None,
    purpose: str = "checkin",  # "checkin" or "pickup"
    expires_minutes: int = 15,
) -> Dict[str, any]:
    """
    Generate a QR code for check-in or pickup.
    
    Args:
        child_id: Child UUID
        guardian_id: Optional guardian UUID
        purpose: "checkin" or "pickup"
        expires_minutes: Minutes until QR code expires
    
    Returns:
        Dict with qr_code, expires_at, and data
    """
    qr_data = {
        "child_id": child_id,
        "guardian_id": guardian_id,
        "purpose": purpose,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    # Generate secure random token
    qr_code = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)
    
    return {
        "qr_code": qr_code,
        "expires_at": expires_at,
        "data": qr_data,
    }


def generate_otp_code(length: int = 6) -> str:
    """Generate a numeric OTP code."""
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def validate_qr_code(qr_code: str, stored_data: Dict) -> tuple[bool, Optional[str]]:
    """
    Validate a QR code against stored data.
    
    Args:
        qr_code: The QR code to validate
        stored_data: Dict with qr_code, expires_at, child_id, etc.
    
    Returns:
        (is_valid, error_message)
    """
    if not qr_code or qr_code not in stored_data:
        return False, "Invalid QR code"
    
    data = stored_data[qr_code]
    
    # Check expiration
    if datetime.utcnow() > data.get("expires_at"):
        return False, "QR code expired"
    
    return True, None


def encode_qr_data(data: Dict) -> str:
    """Encode data as JSON string for QR code."""
    return json.dumps(data)


def decode_qr_data(encoded: str) -> Optional[Dict]:
    """Decode JSON string from QR code."""
    try:
        return json.loads(encoded)
    except (json.JSONDecodeError, TypeError):
        return None

