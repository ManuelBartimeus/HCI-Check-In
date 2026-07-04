"""
Authentication routes — login / logout / me.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    admin_user = current_app.config['ADMIN_USERNAME']
    admin_pass = current_app.config['ADMIN_PASSWORD']

    if username != admin_user or password != admin_pass:
        return jsonify({'error': 'Invalid username or password'}), 401

    token = create_access_token(identity=username)
    return jsonify({
        'access_token': token,
        'username': username,
        'message': 'Login successful',
    }), 200


@auth_bp.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    # Stateless JWT — client simply discards the token
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    identity = get_jwt_identity()
    return jsonify({
        'username': identity,
        'church_name': current_app.config.get('CHURCH_NAME', 'Harvest Chapel KNUST'),
    }), 200
