from flask import Blueprint

# Package marker and central place to register blueprints.

from .auth import auth_bp
from .parents import parents_bp
from .children import children_bp
from .health import health_bp


def register_blueprints(app):
    """Register all blueprints on the given Flask app."""
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(parents_bp, url_prefix="/api/parents")
    app.register_blueprint(children_bp, url_prefix="/api/children")


