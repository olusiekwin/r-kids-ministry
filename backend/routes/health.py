from flask import Blueprint, jsonify
from datetime import datetime

health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.get("/health")
def health():
    """Simple health check endpoint used by render and local dev."""
    return jsonify(
        {
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    )


