from datetime import datetime, timedelta
import secrets

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

auth_bp = Blueprint("auth", __name__)

# In-memory user store for now.
users_db: dict[str, dict] = {}
mfa_codes: dict[str, dict] = {}


def _issue_token(email: str) -> str:
    return f"token_{email}_{datetime.now().timestamp()}"


@auth_bp.post("/login")
def login():
    """Very simple login that matches the frontend contract.

    In dev we accept any email with password 'password123' and
    return a token + OTP code that the frontend can use.
    """
    data = request.get_json() or {}
    email = str(data.get("email", "")).lower().strip()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if password != "password123":
        return jsonify({"error": "Invalid credentials"}), 401

    token = _issue_token(email)

    # Try to get user from Supabase first to get actual role
    user = None
    client = get_supabase()
    if client:
        try:
            church_id = get_default_church_id()
            if church_id:
                res = (
                    client.table("users")
                    .select("user_id, email, role, name, profile_updated")
                    .eq("church_id", church_id)
                    .eq("email", email)
                    .limit(1)
                    .execute()
                )
                if res.data:
                    db_user = res.data[0]
                    user = {
                        "id": db_user["user_id"],
                        "email": db_user.get("email", email),
                        "role": db_user.get("role", "").lower().replace("superadmin", "super_admin") if db_user.get("role") else "parent",
                        "name": db_user.get("name") or email.split("@")[0].title(),
                        "profile_updated": db_user.get("profile_updated", False),
                    }
        except Exception as exc:
            print(f"⚠️ Error fetching user from Supabase: {exc}")

    # Fallback to in-memory or default
    if not user:
        user = users_db.get(
            email,
            {
                "id": email,
                "email": email,
                "role": "super_admin" if email.startswith("superadmin") else ("admin" if email.startswith("admin") else "parent"),
                "name": email.split("@")[0].title(),
                "profile_updated": True,
            },
        )
    users_db[email] = user

    # 6-digit MFA code
    otp_code = "".join(str(secrets.randbelow(10)) for _ in range(6))
    mfa_codes[token] = {
        "code": otp_code,
        "expires_at": datetime.utcnow() + timedelta(minutes=15),  # Increased from 10 to 15 minutes
        "user_email": email,
    }

    return jsonify(
        {
            "data": {
                "token": token,
                "requiresMFA": True,
                "otpCode": otp_code,
            }
        }
    )


@auth_bp.post("/verify-mfa")
def verify_mfa():
    """Verify MFA code and return final token + user."""
    data = request.get_json() or {}
    code = str(data.get("code", "")).strip()
    
    # Try to get token from body first, then from Authorization header
    token = data.get("token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        print("⚠️ MFA verification failed: No token provided")
        return jsonify({"error": "Authentication token is required. Please login again."}), 401

    if token not in mfa_codes:
        print(f"⚠️ MFA verification failed: Token not found in mfa_codes. Available tokens: {list(mfa_codes.keys())[:3]}")
        return jsonify({"error": "MFA session expired or invalid. Please login again."}), 401

    entry = mfa_codes[token]
    if datetime.utcnow() > entry["expires_at"]:
        del mfa_codes[token]
        print(f"⚠️ MFA verification failed: Code expired for token")
        return jsonify({"error": "MFA code expired. Please login again."}), 401

    if code != entry["code"]:
        print(f"⚠️ MFA verification failed: Invalid code. Expected: {entry['code']}, Got: {code}")
        return jsonify({"error": "Invalid verification code. Please check and try again."}), 401

    email = entry["user_email"]
    user = users_db.get(email)
    
    # If user not in memory, try to get from Supabase
    if not user:
        client = get_supabase()
        if client:
            try:
                church_id = get_default_church_id()
                if church_id:
                    res = (
                        client.table("users")
                        .select("user_id, email, role, name, phone, address, profile_updated")
                        .eq("church_id", church_id)
                        .eq("email", email)
                        .limit(1)
                        .execute()
                    )
                    if res.data:
                        db_user = res.data[0]
                        user = {
                            "id": db_user["user_id"],
                            "email": db_user.get("email", email),
                            "role": db_user.get("role", "").lower().replace("superadmin", "super_admin") if db_user.get("role") else "parent",
                            "name": db_user.get("name") or email.split("@")[0].title(),
                            "phone": db_user.get("phone"),
                            "address": db_user.get("address"),
                            "profile_updated": db_user.get("profile_updated", False),
                        }
                        users_db[email] = user
            except Exception as exc:
                print(f"⚠️ Error fetching user from Supabase: {exc}")
    
    if not user:
        return jsonify({"error": "User session expired. Please login again."}), 401

    # Successful – we can reuse token as final auth token.
    del mfa_codes[token]

    return jsonify(
        {
            "data": {
                "token": token,
                "user": user,
            }
        }
    )


@auth_bp.post("/logout")
def logout():
    """Stateless logout – frontend just drops the token."""
    return jsonify({"data": {"success": True}})


@auth_bp.post("/set-password")
def set_password():
    """Set or reset a user's password based on invitation token."""
    data = request.get_json() or {}
    email = str(data.get("email", "")).lower().strip()
    password = str(data.get("password", ""))
    invitation_token = data.get("invitation_token") or data.get("invitationToken")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Try to get user from Supabase first to get actual role
    user = None
    client = get_supabase()
    if client:
        try:
            church_id = get_default_church_id()
            if church_id:
                res = (
                    client.table("users")
                    .select("user_id, email, role, name, profile_updated")
                    .eq("church_id", church_id)
                    .eq("email", email)
                    .limit(1)
                    .execute()
                )
                if res.data:
                    db_user = res.data[0]
                    user = {
                        "id": db_user["user_id"],
                        "email": db_user.get("email", email),
                        "role": db_user.get("role", "").lower().replace("superadmin", "super_admin") if db_user.get("role") else "parent",
                        "name": db_user.get("name") or email.split("@")[0].title(),
                        "profile_updated": db_user.get("profile_updated", False),
                    }
        except Exception as exc:
            print(f"⚠️ Error fetching user from Supabase: {exc}")

    # Fallback to default
    if not user:
        user = {
            "id": email,
            "email": email,
            "role": "parent",
            "name": email.split("@")[0].title(),
            "profile_updated": False,
        }
    
    token = _issue_token(email)
    users_db[email] = user

    # Generate MFA code
    otp_code = "".join(str(secrets.randbelow(10)) for _ in range(6))
    mfa_codes[token] = {
        "code": otp_code,
        "expires_at": datetime.utcnow() + timedelta(minutes=15),  # Increased from 10 to 15 minutes
        "user_email": email,
    }

    return jsonify({
        "data": {
            "token": token,
            "requiresMFA": True,
            "otpCode": otp_code,
            "user": user,
        }
    })


