import os


class Config:
    """Base configuration for the Flask backend."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret")
    # CORS / frontend URL
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


config = Config()


