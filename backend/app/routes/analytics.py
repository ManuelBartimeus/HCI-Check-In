"""
Analytics routes — dashboard stats + trend data.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..services.analytics_service import (
    get_dashboard_stats,
    get_attendance_trends,
    get_meeting_analytics,
    get_member_analytics,
    get_weekly_heatmap,
)

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/api/analytics/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    return jsonify(get_dashboard_stats()), 200


@analytics_bp.route('/api/analytics/trends', methods=['GET'])
@jwt_required()
def trends():
    days = min(int(request.args.get('days', 30)), 365)
    return jsonify(get_attendance_trends(days=days)), 200


@analytics_bp.route('/api/analytics/meetings', methods=['GET'])
@jwt_required()
def meeting_analytics():
    return jsonify(get_meeting_analytics()), 200


@analytics_bp.route('/api/analytics/members', methods=['GET'])
@jwt_required()
def member_analytics():
    limit = min(int(request.args.get('limit', 20)), 50)
    return jsonify(get_member_analytics(limit=limit)), 200


@analytics_bp.route('/api/analytics/heatmap', methods=['GET'])
@jwt_required()
def heatmap():
    return jsonify(get_weekly_heatmap()), 200
