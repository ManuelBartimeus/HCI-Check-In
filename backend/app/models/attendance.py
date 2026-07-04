"""
Attendance SQLAlchemy model.
Records each check-in event for a member at a meeting.
"""
from datetime import datetime
from ..extensions import db


class Attendance(db.Model):
    __tablename__ = 'attendance'

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='CASCADE'), nullable=False)
    meeting_id = db.Column(db.Integer, db.ForeignKey('meetings.id', ondelete='CASCADE'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    points_awarded = db.Column(db.Integer, default=0, nullable=False)
    # 'present' | 'absent' | 'excused' | 'manual'
    status = db.Column(db.String(20), default='present', nullable=False)
    ip_address = db.Column(db.String(50), nullable=True)
    device_info = db.Column(db.String(500), nullable=True)
    # 'self' | 'admin' | 'csv'
    source = db.Column(db.String(20), default='self', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    member = db.relationship('Member', back_populates='attendances')
    meeting = db.relationship('Meeting', back_populates='attendances')

    __table_args__ = (
        db.Index('ix_attendance_member_id', 'member_id'),
        db.Index('ix_attendance_meeting_id', 'meeting_id'),
        db.Index('ix_attendance_timestamp', 'timestamp'),
        db.Index('ix_attendance_member_meeting_day', 'member_id', 'meeting_id', 'timestamp'),
    )

    # ── Serialization ─────────────────────────

    def to_dict(self, include_names=False):
        data = {
            'id': self.id,
            'member_id': self.member_id,
            'meeting_id': self.meeting_id,
            'timestamp': self.timestamp.isoformat(),
            'points_awarded': self.points_awarded,
            'status': self.status,
            'source': self.source,
            'created_at': self.created_at.isoformat(),
        }
        if include_names:
            data['member_name'] = self.member.name if self.member else None
            data['meeting_name'] = self.meeting.name if self.meeting else None
            data['meeting_points'] = self.meeting.points if self.meeting else None
        return data

    def __repr__(self):
        return f'<Attendance member={self.member_id} meeting={self.meeting_id} ts={self.timestamp}>'
