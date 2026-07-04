"""
Member SQLAlchemy model.
"""
from datetime import datetime
from ..extensions import db


class Member(db.Model):
    __tablename__ = 'members'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    points = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    attendances = db.relationship(
        'Attendance',
        back_populates='member',
        lazy='dynamic',
        cascade='all, delete-orphan',
    )

    # Indexes for fast search and leaderboard sorting
    __table_args__ = (
        db.Index('ix_member_name_lower', db.func.lower(db.Column('name', db.String(200)))),
        db.Index('ix_member_points', 'points'),
    )

    # ── Computed Properties ───────────────────

    def attendance_count(self):
        return self.attendances.count()

    def first_attendance_timestamp(self):
        """Used as tie-breaker in leaderboard ranking."""
        first = self.attendances.order_by('timestamp').first()
        return first.timestamp if first else datetime.utcnow()

    def attendance_percentage(self, total_meetings=None):
        """Percentage of all active meetings attended."""
        if total_meetings is None:
            from .meeting import Meeting
            total_meetings = Meeting.query.filter_by(is_active=True, is_archived=False).count()
        if total_meetings == 0:
            return 0.0
        count = self.attendance_count()
        return round((count / total_meetings) * 100, 1)

    def current_streak(self):
        """Consecutive weeks with at least one check-in."""
        from .attendance import Attendance
        from datetime import timedelta
        records = (
            db.session.query(db.func.date(Attendance.timestamp).label('day'))
            .filter(Attendance.member_id == self.id)
            .order_by(db.desc('day'))
            .all()
        )
        if not records:
            return 0
        days = sorted({r.day for r in records}, reverse=True)
        streak = 1
        for i in range(1, len(days)):
            delta = (days[i - 1] - days[i]).days if hasattr(days[i - 1], 'days') else (
                (datetime.strptime(str(days[i - 1]), '%Y-%m-%d') -
                 datetime.strptime(str(days[i]), '%Y-%m-%d')).days
            )
            if delta <= 7:
                streak += 1
            else:
                break
        return streak

    # ── Serialization ─────────────────────────

    def to_dict(self, include_stats=False, total_meetings=None):
        data = {
            'id': self.id,
            'name': self.name,
            'points': self.points,
            'created_at': self.created_at.isoformat(),
        }
        if include_stats:
            data['attendance_count'] = self.attendance_count()
            data['attendance_percentage'] = self.attendance_percentage(total_meetings)
        return data

    def __repr__(self):
        return f'<Member {self.name!r} pts={self.points}>'
