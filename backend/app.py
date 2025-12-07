"""
R-KIDS Ministry Management System - Flask Backend API (clean structure)
"""

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import traceback
from flask import Flask, jsonify
from flask_cors import CORS

from config import config
from routes import register_blueprints


def create_app() -> Flask:
    app = Flask(__name__)

    # Basic config
    app.config["SECRET_KEY"] = config.SECRET_KEY

    # CORS: allow frontend (Vercel and dev localhost) to call /api/*
    allowed_origins = [
        "https://r-kids-ministry.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",  # Vite dev server port
        "http://127.0.0.1:8080",  # Alternative localhost format
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # Global error handlers
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors with proper logging."""
        import sys
        exc_type, exc_value, exc_traceback = sys.exc_info()
        error_details = traceback.format_exception(exc_type, exc_value, exc_traceback)
        error_msg = "".join(error_details)
        print(f"❌ 500 Error: {error_msg}", flush=True)
        
        # In production, don't expose full error details
        is_dev = app.config.get("ENV") == "development" or app.debug
        return jsonify({
            "error": "Internal server error",
            "message": str(error) if is_dev else "An error occurred processing your request",
            "details": error_msg if is_dev else None
        }), 500

    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return jsonify({"error": "Not found", "message": "The requested resource was not found"}), 404

    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle all unhandled exceptions."""
        import sys
        exc_type, exc_value, exc_traceback = sys.exc_info()
        error_details = traceback.format_exception(exc_type, exc_value, exc_traceback)
        error_msg = "".join(error_details)
        print(f"❌ Unhandled Exception: {error_msg}", flush=True)
        
        is_dev = app.config.get("ENV") == "development" or app.debug
        return jsonify({
            "error": "Internal server error",
            "message": str(e) if is_dev else "An unexpected error occurred",
            "details": error_msg if is_dev else None
        }), 500

    # Register all route blueprints
    register_blueprints(app)

    # Initialize Supabase on startup to verify configuration
    try:
        from supabase_client import get_supabase, get_default_church_id
        print("🔍 Initializing Supabase client on startup...", flush=True)
        client = get_supabase()
        if client:
            church_id = get_default_church_id()
            if church_id:
                print(f"✅ Startup check: Supabase configured, church_id={church_id}", flush=True)
            else:
                print("⚠️  Startup check: Supabase connected but no church_id available", flush=True)
        else:
            print("❌ Startup check: Supabase NOT configured - check SUPABASE_URL and SUPABASE_ANON_KEY", flush=True)
    except Exception as e:
        print(f"⚠️  Startup check error: {e}", flush=True)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


