from datetime import datetime, timedelta
import secrets

from flask import Blueprint, jsonify, request

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

    # Basic user object – the frontend mostly needs id, email, role.
    user = users_db.get(
        email,
        {
            "id": email,
            "email": email,
            "role": "admin" if email.startswith("admin") else "parent",
            "name": email.split("@")[0].title(),
            "profile_updated": True,
        },
    )
    users_db[email] = user

    # 6-digit MFA code
    otp_code = "".join(str(secrets.randbelow(10)) for _ in range(6))
    mfa_codes[token] = {
        "code": otp_code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
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
    token = data.get("token")

    if not token or token not in mfa_codes:
        return jsonify({"error": "MFA code expired. Please login again."}), 401

    entry = mfa_codes[token]
    if datetime.utcnow() > entry["expires_at"]:
        del mfa_codes[token]
        return jsonify({"error": "MFA code expired. Please login again."}), 401

    if code != entry["code"]:
        return jsonify({"error": "Invalid verification code"}), 401

    email = entry["user_email"]
    user = users_db.get(email)
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


