"""
Meeting SQLAlchemy model.
Supports both one-time and recurring meetings.
"""
import json
from datetime import datetime
from ..extensions import db


class Meeting(db.Model):
    __tablename__ = 'meetings'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    # 'one-time' | 'recurring'
    meeting_type = db.Column(db.String(20), nullable=False, default='recurring')
    points = db.Column(db.Integer, default=1, nullable=False)
    # JSON array of lowercase day names: ["sunday"], ["tuesday","saturday"]
    _days = db.Column('days', db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_archived = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    attendances = db.relationship(
        'Attendance',
        back_populates='meeting',
        lazy='dynamic',
        cascade='all, delete-orphan',
    )

    __table_args__ = (
        db.Index('ix_meeting_active', 'is_active', 'is_archived'),
    )

    # ── Days property ─────────────────────────

    @property
    def days(self):
        """Return list of lowercase day name strings."""
        if self._days:
            try:
                return json.loads(self._days)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    @days.setter
    def days(self, value):
        if value is not None:
            self._days = json.dumps([d.lower() for d in value])
        else:
            self._days = None

    # ── Active check ─────────────────────────

    def is_currently_active(self, check_time=None):
        """
        Returns True if this meeting is open for attendance right now.
        check_time: datetime (default: utcnow)
        """
        if not self.is_active or self.is_archived:
            return False

        if check_time is None:
            check_time = datetime.utcnow()

        today = check_time.date()
        current_time = check_time.time()

        # Date range check
        if today < self.start_date:
            return False
        if self.end_date and today > self.end_date:
            return False

        # Day-of-week check for recurring
        if self.meeting_type == 'recurring':
            day_name = today.strftime('%A').lower()  # e.g. 'sunday'
            if day_name not in self.days:
                return False
        elif self.meeting_type == 'one-time':
            if today != self.start_date:
                return False

        # Time window check
        if current_time < self.start_time or current_time > self.end_time:
            return False

        return True

    def attendance_count(self):
        return self.attendances.count()

    # ── Serialization ─────────────────────────

    def to_dict(self, include_stats=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'meeting_type': self.meeting_type,
            'points': self.points,
            'days': self.days,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'is_active': self.is_active,
            'is_archived': self.is_archived,
            'created_at': self.created_at.isoformat(),
        }
        if include_stats:
            data['attendance_count'] = self.attendance_count()
        return data

    def __repr__(self):
        return f'<Meeting {self.name!r} type={self.meeting_type}>'
