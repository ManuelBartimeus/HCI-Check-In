"""
Flask Configuration
Supports SQLite (dev) and PostgreSQL (prod) via DATABASE_URL env var.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env from backend dir or parent dir
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()


class Config:
    # ── Core ──────────────────────────────────
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-change-me')
    DEBUG = os.environ.get('FLASK_DEBUG', '0') == '1'

    # ── Database ──────────────────────────────
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///' + os.path.join(os.path.dirname(__file__), 'church_attendance.db')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    # ── JWT ───────────────────────────────────
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-me')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ['headers']

    # ── Admin ─────────────────────────────────
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'passw0rd')

    # ── Church ────────────────────────────────
    CHURCH_NAME = os.environ.get('CHURCH_NAME', 'Harvest Chapel KNUST')
    CHURCH_TIMEZONE = os.environ.get('CHURCH_TIMEZONE', 'Africa/Accra')

    # ── CORS ──────────────────────────────────
    CORS_ORIGINS = [
        o.strip()
        for o in os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    ]

    # ── Rate Limiting ─────────────────────────
    RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '500 per day;100 per hour')
    RATELIMIT_CHECKIN = os.environ.get('RATELIMIT_CHECKIN', '20 per minute')


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
