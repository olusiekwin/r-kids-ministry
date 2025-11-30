"""
Configuration settings for R KIDS Backend
Supports both local PostgreSQL and Supabase
"""
import os
from datetime import timedelta
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend directory
backend_dir = Path(__file__).parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)


class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Supabase/PostgreSQL Configuration
    # For Supabase: Use connection string from Supabase dashboard
    # Format: postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
    DATABASE_URL = os.environ.get('DATABASE_URL') or \
        f"postgresql://{os.environ.get('DB_USER', 'postgres')}:" \
        f"{os.environ.get('DB_PASSWORD', 'postgres')}@" \
        f"{os.environ.get('DB_HOST', 'localhost')}:" \
        f"{os.environ.get('DB_PORT', '5432')}/" \
        f"{os.environ.get('DB_NAME', 'rkids_ministry')}"
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    
    # CORS Configuration
    CORS_ORIGINS = [
        os.environ.get('FRONTEND_URL', 'http://localhost:5173'),
        os.environ.get('MOBILE_APP_URL', 'https://rkids.app'),
    ]
    
    # MFA Configuration
    MFA_ISSUER = os.environ.get('MFA_ISSUER', 'R KIDS Ministry')
    
    # SendGrid Email Configuration
    SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
    SENDGRID_FROM_EMAIL = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@rkids.church')
    
    # Twilio SMS Configuration
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')
    
    # QR Code Configuration
    QR_CODE_EXPIRY_MINUTES = int(os.environ.get('QR_CODE_EXPIRY_MINUTES', '15'))
    
    # Guardian Expiry
    GUARDIAN_EXPIRY_DAYS = int(os.environ.get('GUARDIAN_EXPIRY_DAYS', '90'))
    
    # File Upload
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_FILE_SIZE', '5242880'))  # 5MB
    UPLOAD_FOLDER = os.environ.get('UPLOAD_DEST', './uploads')
    
    # Pagination
    ITEMS_PER_PAGE = 20


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_ECHO = False


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

