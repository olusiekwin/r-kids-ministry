"""
R-KIDS Ministry Management System - Flask Backend API (clean structure)
"""

from flask import Flask
from flask_cors import CORS

from config import config
from routes import register_blueprints


def create_app() -> Flask:
    app = Flask(__name__)

    # Basic config
    app.config["SECRET_KEY"] = config.SECRET_KEY

    # CORS: allow frontend (and dev localhost) to call /api/*
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=False,
    )

    # Register all route blueprints
    register_blueprints(app)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


