from flask import Blueprint, jsonify
from datetime import datetime

health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.get("/health")
def health():
    """Simple health check endpoint used by render and local dev."""
    from supabase_client import get_supabase, get_default_church_id
    
    status = {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    
    # Check Supabase connectivity
    client = get_supabase()
    if client:
        status["supabase"] = "connected"
        church_id = get_default_church_id()
        if church_id:
            status["church_id"] = church_id
        else:
            status["supabase"] = "connected (no church)"
    else:
        status["supabase"] = "not_configured"
        status["status"] = "degraded"
    
    return jsonify(status)


