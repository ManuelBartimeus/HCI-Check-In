"""
Check-in service — core business logic for member attendance.
"""
from datetime import datetime
from ..extensions import db
from ..models.member import Member
from ..models.meeting import Meeting
from ..models.attendance import Attendance


def get_active_meetings(check_time=None):
    """Return all meetings currently open for check-in."""
    if check_time is None:
        check_time = datetime.utcnow()

    all_meetings = Meeting.query.filter_by(is_active=True, is_archived=False).all()
    return [m for m in all_meetings if m.is_currently_active(check_time)]


def checkin(member_id: int, ip_address: str = None, device_info: str = None, check_time: datetime = None):
    """
    Perform a member check-in.

    Returns a dict with:
      - success / error
      - attendance record
      - meeting that was matched
      - leaderboard data
    """
    if check_time is None:
        check_time = datetime.utcnow()

    # ── Validate member ───────────────────────
    member = Member.query.get(member_id)
    if not member:
        return {'error': 'member_not_found', 'message': 'Member not found.'}, 404

    # ── Find active meetings ───────────────────
    active_meetings = get_active_meetings(check_time)

    if not active_meetings:
        return {
            'error': 'no_active_meeting',
            'message': 'No meeting is currently open for attendance.',
        }, 404

    # Use the first active meeting (most specific if overlaps exist)
    meeting = active_meetings[0]

    # ── Duplicate check (per member per meeting per day) ──
    today_str = check_time.date()
    existing = (
        Attendance.query
        .filter(
            Attendance.member_id == member_id,
            Attendance.meeting_id == meeting.id,
            db.func.date(Attendance.timestamp) == today_str,
        )
        .first()
    )

    if existing:
        return {
            'error': 'already_checked_in',
            'message': f'You have already checked in to "{meeting.name}" today.',
            'attendance': existing.to_dict(include_names=True),
        }, 409

    # ── Create attendance record ──────────────
    attendance = Attendance(
        member_id=member_id,
        meeting_id=meeting.id,
        timestamp=check_time,
        points_awarded=meeting.points,
        status='present',
        ip_address=ip_address,
        device_info=device_info,
        source='self',
    )
    db.session.add(attendance)

    # ── Award points to member ────────────────
    member.points += meeting.points

    db.session.commit()

    return {
        'success': True,
        'message': f'Checked in to "{meeting.name}" — +{meeting.points} pts!',
        'attendance': attendance.to_dict(include_names=True),
        'meeting': meeting.to_dict(),
        'points_earned': meeting.points,
    }, 200
