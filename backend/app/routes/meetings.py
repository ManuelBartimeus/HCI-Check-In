"""
Meetings routes — full CRUD + toggle active/archived.
"""
from datetime import datetime, time, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models.meeting import Meeting

meetings_bp = Blueprint('meetings', __name__)

VALID_DAYS = {'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'}


def _parse_meeting_data(data: dict, partial: bool = False):
    """Validate and parse meeting fields. Returns (fields_dict, error_str)."""
    errors = []
    fields = {}

    name = (data.get('name') or '').strip()
    if not partial or 'name' in data:
        if not name:
            errors.append('name is required')
        elif len(name) > 200:
            errors.append('name too long (max 200 chars)')
        else:
            fields['name'] = name

    if 'description' in data:
        fields['description'] = (data.get('description') or '').strip() or None

    meeting_type = data.get('meeting_type')
    if not partial or 'meeting_type' in data:
        if meeting_type not in ('one-time', 'recurring'):
            errors.append("meeting_type must be 'one-time' or 'recurring'")
        else:
            fields['meeting_type'] = meeting_type

    points = data.get('points')
    if not partial or 'points' in data:
        try:
            points = int(points)
            if points < 0:
                raise ValueError
            fields['points'] = points
        except (TypeError, ValueError):
            errors.append('points must be a non-negative integer')

    # Days (for recurring)
    if 'days' in data:
        days = data.get('days') or []
        invalid = [d for d in days if d.lower() not in VALID_DAYS]
        if invalid:
            errors.append(f'Invalid days: {invalid}')
        else:
            fields['days'] = [d.lower() for d in days]

    # Dates
    for field in ('start_date', 'end_date'):
        if field in data and data[field]:
            try:
                fields[field] = date.fromisoformat(data[field])
            except (ValueError, TypeError):
                errors.append(f'{field} must be YYYY-MM-DD')

    # Times
    for field in ('start_time', 'end_time'):
        if field in data and data[field]:
            try:
                parts = data[field].split(':')
                fields[field] = time(int(parts[0]), int(parts[1]))
            except (ValueError, TypeError, IndexError):
                errors.append(f'{field} must be HH:MM')

    return fields, ', '.join(errors) if errors else None


@meetings_bp.route('/api/meetings', methods=['GET'])
@jwt_required()
def list_meetings():
    include_archived = request.args.get('archived', 'false').lower() == 'true'
    q = (request.args.get('q') or '').strip()

    query = Meeting.query
    if not include_archived:
        query = query.filter_by(is_archived=False)
    if q:
        query = query.filter(Meeting.name.ilike(f'%{q}%'))

    meetings = query.order_by(Meeting.name).all()
    return jsonify([m.to_dict(include_stats=True) for m in meetings]), 200


@meetings_bp.route('/api/meetings/active', methods=['GET'])
def get_active_meetings():
    """Public: list of currently active meetings (for check-in display)."""
    from ..services.checkin_service import get_active_meetings
    active = get_active_meetings()
    return jsonify([m.to_dict() for m in active]), 200


@meetings_bp.route('/api/meetings/<int:meeting_id>', methods=['GET'])
@jwt_required()
def get_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    return jsonify(meeting.to_dict(include_stats=True)), 200


@meetings_bp.route('/api/meetings', methods=['POST'])
@jwt_required()
def create_meeting():
    data = request.get_json(silent=True) or {}
    fields, err = _parse_meeting_data(data)
    if err:
        return jsonify({'error': err}), 400

    # Require start_date and times for new meetings
    for required in ('name', 'meeting_type', 'points', 'start_date', 'start_time', 'end_time'):
        if required not in fields:
            return jsonify({'error': f'{required} is required'}), 400

    if fields.get('meeting_type') == 'recurring' and not fields.get('days'):
        return jsonify({'error': 'days are required for recurring meetings'}), 400

    meeting = Meeting(**fields)
    db.session.add(meeting)
    db.session.commit()
    return jsonify(meeting.to_dict()), 201


@meetings_bp.route('/api/meetings/<int:meeting_id>', methods=['PUT'])
@jwt_required()
def update_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    data = request.get_json(silent=True) or {}
    fields, err = _parse_meeting_data(data, partial=True)
    if err:
        return jsonify({'error': err}), 400

    for key, value in fields.items():
        setattr(meeting, key, value)

    db.session.commit()
    return jsonify(meeting.to_dict()), 200


@meetings_bp.route('/api/meetings/<int:meeting_id>', methods=['DELETE'])
@jwt_required()
def delete_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    db.session.delete(meeting)
    db.session.commit()
    return jsonify({'message': f'Meeting "{meeting.name}" deleted'}), 200


@meetings_bp.route('/api/meetings/<int:meeting_id>/toggle', methods=['PATCH'])
@jwt_required()
def toggle_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    meeting.is_active = not meeting.is_active
    db.session.commit()
    return jsonify({'is_active': meeting.is_active, 'meeting': meeting.to_dict()}), 200


@meetings_bp.route('/api/meetings/<int:meeting_id>/archive', methods=['PATCH'])
@jwt_required()
def archive_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    meeting.is_archived = not meeting.is_archived
    if meeting.is_archived:
        meeting.is_active = False
    db.session.commit()
    return jsonify({'is_archived': meeting.is_archived, 'meeting': meeting.to_dict()}), 200
