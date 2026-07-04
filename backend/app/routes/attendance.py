"""
Attendance routes — check-in (public) + history, correction, deletion (admin).
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models.attendance import Attendance
from ..models.member import Member
from ..models.meeting import Meeting
from ..services.checkin_service import checkin
from ..services.leaderboard_service import get_leaderboard

attendance_bp = Blueprint('attendance', __name__)


# ── Public: check-in ──────────────────────────

@attendance_bp.route('/api/attendance/checkin', methods=['POST'])
def do_checkin():
    """Public endpoint — anyone with a name can check in."""
    data = request.get_json(silent=True) or {}
    member_id = data.get('member_id')

    if not member_id:
        return jsonify({'error': 'member_id is required'}), 400

    try:
        member_id = int(member_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'member_id must be an integer'}), 400

    ip = request.remote_addr
    device = request.headers.get('User-Agent', '')[:500]

    result, status_code = checkin(member_id, ip_address=ip, device_info=device)

    if status_code == 200:
        # Attach leaderboard data
        lb = get_leaderboard(member_id=member_id)
        result['leaderboard'] = lb

    return jsonify(result), status_code


# ── Admin: attendance history ─────────────────

@attendance_bp.route('/api/attendance', methods=['GET'])
@jwt_required()
def list_attendance():
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 30)), 100)

    # Filters
    member_id = request.args.get('member_id')
    meeting_id = request.args.get('meeting_id')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    status = request.args.get('status')

    query = Attendance.query

    if member_id:
        query = query.filter(Attendance.member_id == int(member_id))
    if meeting_id:
        query = query.filter(Attendance.meeting_id == int(meeting_id))
    if status:
        query = query.filter(Attendance.status == status)
    if date_from:
        try:
            df = datetime.strptime(date_from, '%Y-%m-%d')
            query = query.filter(Attendance.timestamp >= df)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, '%Y-%m-%d')
            query = query.filter(Attendance.timestamp <= dt.replace(hour=23, minute=59, second=59))
        except ValueError:
            pass

    query = query.order_by(Attendance.timestamp.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'items': [a.to_dict(include_names=True) for a in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages,
    }), 200


@attendance_bp.route('/api/attendance/<int:attendance_id>', methods=['GET'])
@jwt_required()
def get_attendance(attendance_id):
    a = Attendance.query.get_or_404(attendance_id)
    return jsonify(a.to_dict(include_names=True)), 200


@attendance_bp.route('/api/attendance/<int:attendance_id>', methods=['PATCH'])
@jwt_required()
def update_attendance(attendance_id):
    """Manual attendance correction (admin only)."""
    a = Attendance.query.get_or_404(attendance_id)
    data = request.get_json(silent=True) or {}

    if 'status' in data:
        valid_statuses = ('present', 'absent', 'excused', 'manual')
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'status must be one of {valid_statuses}'}), 400
        a.status = data['status']

    if 'points_awarded' in data:
        try:
            new_pts = int(data['points_awarded'])
            diff = new_pts - a.points_awarded
            # Adjust member points
            member = Member.query.get(a.member_id)
            if member:
                member.points = max(0, member.points + diff)
            a.points_awarded = new_pts
        except (ValueError, TypeError):
            return jsonify({'error': 'points_awarded must be an integer'}), 400

    a.source = 'admin'
    db.session.commit()
    return jsonify(a.to_dict(include_names=True)), 200


@attendance_bp.route('/api/attendance/<int:attendance_id>', methods=['DELETE'])
@jwt_required()
def delete_attendance(attendance_id):
    """Undo / remove an attendance record."""
    a = Attendance.query.get_or_404(attendance_id)

    # Deduct points from member
    member = Member.query.get(a.member_id)
    if member:
        member.points = max(0, member.points - a.points_awarded)

    db.session.delete(a)
    db.session.commit()
    return jsonify({'message': 'Attendance record removed and points reversed'}), 200


# ── Admin: manual add ─────────────────────────

@attendance_bp.route('/api/attendance/manual', methods=['POST'])
@jwt_required()
def manual_checkin():
    """Admin manually marks a member as present for a specific meeting."""
    data = request.get_json(silent=True) or {}
    member_id = data.get('member_id')
    meeting_id = data.get('meeting_id')
    timestamp_str = data.get('timestamp')

    if not member_id or not meeting_id:
        return jsonify({'error': 'member_id and meeting_id are required'}), 400

    member = Member.query.get_or_404(int(member_id))
    meeting = Meeting.query.get_or_404(int(meeting_id))

    ts = datetime.utcnow()
    if timestamp_str:
        try:
            ts = datetime.fromisoformat(timestamp_str)
        except ValueError:
            return jsonify({'error': 'Invalid timestamp format'}), 400

    # Duplicate check
    existing = Attendance.query.filter(
        Attendance.member_id == member.id,
        Attendance.meeting_id == meeting.id,
        db.func.date(Attendance.timestamp) == ts.date(),
    ).first()
    if existing:
        return jsonify({'error': 'Already checked in for this meeting on this date'}), 409

    a = Attendance(
        member_id=member.id,
        meeting_id=meeting.id,
        timestamp=ts,
        points_awarded=meeting.points,
        status='present',
        source='admin',
    )
    db.session.add(a)
    member.points += meeting.points
    db.session.commit()

    return jsonify(a.to_dict(include_names=True)), 201
