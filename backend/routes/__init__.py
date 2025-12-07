from flask import Blueprint

# Package marker and central place to register blueprints.

from .auth import auth_bp
from .parents import parents_bp
from .children import children_bp
from .health import health_bp
from .checkin import checkin_bp
from .checkout import checkout_bp
from .guardians import guardians_bp
from .notifications import notifications_bp
from .attendance import attendance_bp
from .groups import groups_bp
from .users import users_bp
from .analytics import analytics_bp
from .audit import audit_bp
from .teachers import teachers_bp
from .teens import teens_bp
from .sessions import sessions_bp
from .session_bookings import session_bookings_bp
from .reports import reports_bp


def register_blueprints(app):
    """Register all blueprints on the given Flask app."""
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(parents_bp, url_prefix="/api/parents")
    app.register_blueprint(children_bp, url_prefix="/api/children")
    app.register_blueprint(checkin_bp, url_prefix="/api/checkin")
    app.register_blueprint(checkout_bp, url_prefix="/api/checkout")
    app.register_blueprint(guardians_bp, url_prefix="/api/guardians")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(groups_bp, url_prefix="/api/groups")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")
    app.register_blueprint(teachers_bp, url_prefix="/api/teachers")
    app.register_blueprint(teens_bp, url_prefix="/api/teens")
    app.register_blueprint(sessions_bp, url_prefix="/api/sessions")
    app.register_blueprint(session_bookings_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")


