"""
Settings routes — church info and configuration.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('/api/settings', methods=['GET'])
@jwt_required()
def get_settings():
    return jsonify({
        'church_name': current_app.config.get('CHURCH_NAME', 'Harvest Chapel KNUST'),
        'timezone': current_app.config.get('CHURCH_TIMEZONE', 'Africa/Accra'),
        'admin_username': current_app.config.get('ADMIN_USERNAME', 'admin'),
    }), 200


@settings_bp.route('/api/settings/public', methods=['GET'])
def get_public_settings():
    """Public settings for landing page."""
    return jsonify({
        'church_name': current_app.config.get('CHURCH_NAME', 'Harvest Chapel KNUST'),
    }), 200
