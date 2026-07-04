"""
Members routes — CRUD + search + profile.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models.member import Member
from ..models.meeting import Meeting
from ..models.attendance import Attendance

members_bp = Blueprint('members', __name__)


# ── Public: autocomplete search ───────────────

@members_bp.route('/api/members/search', methods=['GET'])
def search_members():
    """Real-time autocomplete — no auth required for check-in flow."""
    q = (request.args.get('q') or '').strip()
    limit = min(int(request.args.get('limit', 10)), 20)

    if not q or len(q) < 1:
        return jsonify([]), 200

    members = (
        Member.query
        .filter(Member.name.ilike(f'%{q}%'))
        .order_by(Member.name)
        .limit(limit)
        .all()
    )
    return jsonify([{'id': m.id, 'name': m.name, 'points': m.points} for m in members]), 200


# ── Admin: full member list ───────────────────

@members_bp.route('/api/members', methods=['GET'])
@jwt_required()
def list_members():
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 20)), 100)
    q = (request.args.get('q') or '').strip()
    sort_by = request.args.get('sort', 'points')  # 'points' | 'name' | 'created_at'
    order = request.args.get('order', 'desc')

    query = Member.query

    if q:
        query = query.filter(Member.name.ilike(f'%{q}%'))

    # Sort
    col_map = {'points': Member.points, 'name': Member.name, 'created_at': Member.created_at}
    col = col_map.get(sort_by, Member.points)
    query = query.order_by(col.desc() if order == 'desc' else col.asc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    total_meetings = Meeting.query.filter_by(is_active=True, is_archived=False).count()
    items = [m.to_dict(include_stats=True, total_meetings=total_meetings) for m in pagination.items]

    return jsonify({
        'items': items,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages,
    }), 200


@members_bp.route('/api/members', methods=['POST'])
@jwt_required()
def create_member():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()

    if not name:
        return jsonify({'error': 'Name is required'}), 400
    if len(name) > 200:
        return jsonify({'error': 'Name too long (max 200 chars)'}), 400

    # Case-insensitive duplicate check
    existing = Member.query.filter(
        db.func.lower(Member.name) == name.lower()
    ).first()
    if existing:
        return jsonify({'error': f'Member "{name}" already exists'}), 409

    member = Member(name=name)
    db.session.add(member)
    db.session.commit()
    return jsonify(member.to_dict()), 201


@members_bp.route('/api/members/<int:member_id>', methods=['GET'])
@jwt_required()
def get_member(member_id):
    member = Member.query.get_or_404(member_id)
    return jsonify(member.to_dict(include_stats=True)), 200


@members_bp.route('/api/members/<int:member_id>', methods=['PUT'])
@jwt_required()
def update_member(member_id):
    member = Member.query.get_or_404(member_id)
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()

    if not name:
        return jsonify({'error': 'Name is required'}), 400

    # Check duplicate (exclude self)
    existing = Member.query.filter(
        db.func.lower(Member.name) == name.lower(),
        Member.id != member_id,
    ).first()
    if existing:
        return jsonify({'error': f'Another member named "{name}" already exists'}), 409

    member.name = name
    db.session.commit()
    return jsonify(member.to_dict()), 200


@members_bp.route('/api/members/<int:member_id>', methods=['DELETE'])
@jwt_required()
def delete_member(member_id):
    member = Member.query.get_or_404(member_id)
    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': f'Member "{member.name}" deleted'}), 200


# ── Admin: member profile page ────────────────

@members_bp.route('/api/members/<int:member_id>/profile', methods=['GET'])
@jwt_required()
def member_profile(member_id):
    """Full profile: personal stats, attendance history, streaks."""
    member = Member.query.get_or_404(member_id)

    # Attendance history (most recent first)
    records = (
        Attendance.query
        .filter_by(member_id=member_id)
        .order_by(Attendance.timestamp.desc())
        .all()
    )
    history = [a.to_dict(include_names=True) for a in records]

    # Compute streaks
    dates_attended = sorted({a.timestamp.date() for a in records})
    current_streak = _compute_streak(dates_attended, reverse=True)
    longest_streak = _compute_longest_streak(dates_attended)

    total_meetings = Meeting.query.filter_by(is_active=True, is_archived=False).count()

    # Meetings attended (unique meeting ids)
    attended_meeting_ids = {a.meeting_id for a in records}
    meetings_missed = total_meetings - len(attended_meeting_ids)

    # Points over time (cumulative)
    points_history = []
    cumulative = 0
    for a in sorted(records, key=lambda x: x.timestamp):
        cumulative += a.points_awarded
        points_history.append({
            'date': a.timestamp.date().isoformat(),
            'points': cumulative,
            'earned': a.points_awarded,
            'meeting': a.meeting.name if a.meeting else '',
        })

    # Rank (position in leaderboard)
    from ..services.leaderboard_service import get_leaderboard
    lb = get_leaderboard()
    rank = next((e['rank'] for e in lb['leaderboard'] if e['id'] == member_id), None)

    return jsonify({
        'member': member.to_dict(include_stats=True, total_meetings=total_meetings),
        'rank': rank,
        'total_members': lb['total'],
        'attendance_history': history,
        'points_history': points_history,
        'current_streak': current_streak,
        'longest_streak': longest_streak,
        'meetings_attended': len(attended_meeting_ids),
        'meetings_missed': max(0, meetings_missed),
        'total_meetings': total_meetings,
    }), 200


def _compute_streak(sorted_dates: list, reverse: bool = True) -> int:
    """Current streak: consecutive calendar days from today backwards."""
    from datetime import date, timedelta
    if not sorted_dates:
        return 0
    today = date.today()
    streak = 0
    check = today
    date_set = set(sorted_dates)
    while check in date_set:
        streak += 1
        check -= timedelta(days=1)
    return streak


def _compute_longest_streak(sorted_dates: list) -> int:
    """Longest consecutive-day attendance streak."""
    from datetime import timedelta
    if not sorted_dates:
        return 0
    longest = 1
    current = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1
    return longest
