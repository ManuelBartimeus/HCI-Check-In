"""
Leaderboard routes — public view + admin management.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..services.leaderboard_service import get_leaderboard, reset_leaderboard, recalculate_rankings

leaderboard_bp = Blueprint('leaderboard', __name__)


@leaderboard_bp.route('/api/leaderboard', methods=['GET'])
def public_leaderboard():
    """Public leaderboard — no auth required."""
    member_id = request.args.get('member_id')
    limit = request.args.get('limit')

    try:
        member_id = int(member_id) if member_id else None
    except (ValueError, TypeError):
        member_id = None

    try:
        limit = int(limit) if limit else None
    except (ValueError, TypeError):
        limit = None

    data = get_leaderboard(member_id=member_id, limit=limit)
    return jsonify(data), 200


@leaderboard_bp.route('/api/leaderboard/reset', methods=['POST'])
@jwt_required()
def admin_reset_leaderboard():
    """Admin: reset all points and attendance records."""
    reset_leaderboard()
    return jsonify({'message': 'Leaderboard and attendance history reset successfully'}), 200


@leaderboard_bp.route('/api/leaderboard/recalculate', methods=['POST'])
@jwt_required()
def admin_recalculate():
    """Admin: recalculate all member points from attendance records."""
    result = recalculate_rankings()
    return jsonify({
        'message': f'Recalculated points for {result["recalculated"]} members',
        **result,
    }), 200
