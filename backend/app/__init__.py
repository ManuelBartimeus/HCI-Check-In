"""
Flask App Factory
"""
from flask import Flask, jsonify
from .extensions import db, jwt, cors, limiter


def create_app(config_object=None):
    app = Flask(__name__)

    # ── Load Config ───────────────────────────
    if config_object is None:
        import os, sys
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
        from config import DevelopmentConfig
        config_object = DevelopmentConfig

    app.config.from_object(config_object)

    # ── Extensions ────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r'/api/*': {'origins': app.config['CORS_ORIGINS']}},
        supports_credentials=True,
        allow_headers=['Content-Type', 'Authorization'],
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    )
    limiter.init_app(app)

    # ── Create Tables ─────────────────────────
    with app.app_context():
        from .models import member, meeting, attendance  # noqa: F401 register models
        db.create_all()

    # ── Register Blueprints ───────────────────
    from .routes.auth import auth_bp
    from .routes.members import members_bp
    from .routes.meetings import meetings_bp
    from .routes.attendance import attendance_bp
    from .routes.leaderboard import leaderboard_bp
    from .routes.analytics import analytics_bp
    from .routes.import_csv import import_bp
    from .routes.export import export_bp
    from .routes.settings import settings_bp

    for bp in [auth_bp, members_bp, meetings_bp, attendance_bp,
               leaderboard_bp, analytics_bp, import_bp, export_bp, settings_bp]:
        app.register_blueprint(bp)

    # ── Error Handlers ────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method not allowed'}), 405

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({'error': 'Unprocessable entity'}), 422

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({'error': 'Too many requests. Please slow down.'}), 429

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired', 'code': 'token_expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token', 'code': 'invalid_token'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token required', 'code': 'authorization_required'}), 401

    # ── Health check ──────────────────────────
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'service': 'church-attendance-api'}), 200

    return app
