"""
Database connection and initialization for Supabase/PostgreSQL
"""
from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from config import Config

# Initialize SQLAlchemy
db = SQLAlchemy()

def init_db(app: Flask):
    """Initialize database connection"""
    app.config.from_object(Config)
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✅ Database initialized successfully")
    
    return db

def get_db_connection():
    """Get database connection"""
    return db

