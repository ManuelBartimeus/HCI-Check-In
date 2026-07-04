"""
Analytics service — aggregated stats for the admin dashboard and analytics page.
"""
from datetime import datetime, timedelta, date
from collections import defaultdict
from ..extensions import db
from ..models.member import Member
from ..models.meeting import Meeting
from ..models.attendance import Attendance


def _today():
    return datetime.utcnow().date()


def get_dashboard_stats():
    """Return all stats widgets for the admin dashboard."""
    today = _today()
    week_start = today - timedelta(days=today.weekday())  # Monday
    month_start = today.replace(day=1)

    total_members = Member.query.count()
    total_meetings = Meeting.query.filter_by(is_archived=False).count()

    attendance_today = Attendance.query.filter(
        db.func.date(Attendance.timestamp) == today
    ).count()

    attendance_week = Attendance.query.filter(
        Attendance.timestamp >= datetime.combine(week_start, datetime.min.time())
    ).count()

    attendance_month = Attendance.query.filter(
        Attendance.timestamp >= datetime.combine(month_start, datetime.min.time())
    ).count()

    total_checkins = Attendance.query.count()

    total_points = db.session.query(db.func.sum(Member.points)).scalar() or 0

    # Average attendance % (distinct members who attended at least once / total)
    active_members = (
        db.session.query(db.func.count(db.func.distinct(Attendance.member_id)))
        .scalar() or 0
    )
    avg_attendance_pct = round((active_members / total_members * 100), 1) if total_members else 0

    # Top attended meeting
    top_meeting_row = (
        db.session.query(
            Meeting.name,
            db.func.count(Attendance.id).label('cnt'),
        )
        .join(Attendance, Attendance.meeting_id == Meeting.id)
        .group_by(Meeting.id)
        .order_by(db.desc('cnt'))
        .first()
    )

    # Lowest attended meeting (among those with at least one record)
    low_meeting_row = (
        db.session.query(
            Meeting.name,
            db.func.count(Attendance.id).label('cnt'),
        )
        .join(Attendance, Attendance.meeting_id == Meeting.id)
        .group_by(Meeting.id)
        .order_by('cnt')
        .first()
    )

    # Upcoming meeting (next occurrence)
    upcoming = _get_upcoming_meeting()

    # Recent activity (last 15 check-ins)
    recent = (
        Attendance.query
        .order_by(Attendance.timestamp.desc())
        .limit(15)
        .all()
    )
    recent_list = [a.to_dict(include_names=True) for a in recent]

    return {
        'total_members': total_members,
        'total_meetings': total_meetings,
        'attendance_today': attendance_today,
        'attendance_week': attendance_week,
        'attendance_month': attendance_month,
        'total_checkins': total_checkins,
        'total_points_awarded': int(total_points),
        'avg_attendance_pct': avg_attendance_pct,
        'top_attended_meeting': top_meeting_row[0] if top_meeting_row else 'N/A',
        'top_attended_count': int(top_meeting_row[1]) if top_meeting_row else 0,
        'lowest_attended_meeting': low_meeting_row[0] if low_meeting_row else 'N/A',
        'lowest_attended_count': int(low_meeting_row[1]) if low_meeting_row else 0,
        'upcoming_meeting': upcoming,
        'recent_activity': recent_list,
    }


def _get_upcoming_meeting():
    """Find the next scheduled meeting occurrence."""
    now = datetime.utcnow()
    today = now.date()
    current_time = now.time()

    meetings = Meeting.query.filter_by(is_active=True, is_archived=False).all()
    candidates = []

    for m in meetings:
        if m.end_date and today > m.end_date:
            continue
        if m.meeting_type == 'one-time':
            if m.start_date > today or (m.start_date == today and m.start_time > current_time):
                candidates.append({
                    'id': m.id,
                    'name': m.name,
                    'next_date': m.start_date.isoformat(),
                    'start_time': m.start_time.strftime('%H:%M'),
                    'points': m.points,
                })
        elif m.meeting_type == 'recurring':
            # Find next day that matches
            for delta in range(0, 8):
                check = today + timedelta(days=delta)
                if m.end_date and check > m.end_date:
                    break
                if check < m.start_date:
                    continue
                day_name = check.strftime('%A').lower()
                if day_name in m.days:
                    if delta == 0 and current_time > m.end_time:
                        continue  # already passed today
                    candidates.append({
                        'id': m.id,
                        'name': m.name,
                        'next_date': check.isoformat(),
                        'start_time': m.start_time.strftime('%H:%M'),
                        'points': m.points,
                    })
                    break

    if not candidates:
        return None

    # Sort by next_date then start_time
    candidates.sort(key=lambda x: (x['next_date'], x['start_time']))
    return candidates[0]


def get_attendance_trends(days: int = 30):
    """Daily attendance counts for the past N days."""
    end = _today()
    start = end - timedelta(days=days - 1)

    rows = (
        db.session.query(
            db.func.date(Attendance.timestamp).label('day'),
            db.func.count(Attendance.id).label('count'),
        )
        .filter(Attendance.timestamp >= datetime.combine(start, datetime.min.time()))
        .group_by('day')
        .order_by('day')
        .all()
    )

    # Build full date range with 0-fill
    day_map = {str(r.day): int(r.count) for r in rows}
    result = []
    for i in range(days):
        d = (start + timedelta(days=i)).isoformat()
        result.append({'date': d, 'count': day_map.get(d, 0)})

    return result


def get_meeting_analytics():
    """Per-meeting attendance stats."""
    rows = (
        db.session.query(
            Meeting.id,
            Meeting.name,
            Meeting.points,
            db.func.count(Attendance.id).label('total_checkins'),
        )
        .outerjoin(Attendance, Attendance.meeting_id == Meeting.id)
        .filter(Meeting.is_archived == False)
        .group_by(Meeting.id)
        .order_by(db.desc('total_checkins'))
        .all()
    )

    return [
        {
            'id': r.id,
            'name': r.name,
            'points': r.points,
            'total_checkins': int(r.total_checkins or 0),
        }
        for r in rows
    ]


def get_member_analytics(limit: int = 20):
    """Top members and inactive members."""
    top = (
        Member.query
        .order_by(Member.points.desc())
        .limit(limit)
        .all()
    )

    # Inactive: no attendance in last 30 days
    cutoff = datetime.utcnow() - timedelta(days=30)
    active_ids = db.session.query(
        db.func.distinct(Attendance.member_id)
    ).filter(Attendance.timestamp >= cutoff).all()
    active_id_set = {r[0] for r in active_ids}

    inactive = [m for m in Member.query.all() if m.id not in active_id_set]

    return {
        'top_members': [m.to_dict(include_stats=False) for m in top],
        'inactive_members': [m.to_dict(include_stats=False) for m in inactive[:20]],
    }


def get_weekly_heatmap():
    """Attendance count by day-of-week and hour for heatmap visualization."""
    rows = (
        db.session.query(
            db.extract('dow', Attendance.timestamp).label('dow'),   # 0=Sun … 6=Sat
            db.extract('hour', Attendance.timestamp).label('hour'),
            db.func.count(Attendance.id).label('count'),
        )
        .group_by('dow', 'hour')
        .all()
    )

    # Flatten to list of {dow, hour, count}
    return [
        {'dow': int(r.dow), 'hour': int(r.hour), 'count': int(r.count)}
        for r in rows
    ]
