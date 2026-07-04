"""
Database seeder.
Generates 50 Ghanaian member names, 6 meetings, and realistic historical attendance.
Run via: python run.py (auto-triggered on first startup)
Or directly: python seed.py
"""
import random
from datetime import datetime, date, time, timedelta
from app import create_app
from app.extensions import db
from app.models.member import Member
from app.models.meeting import Meeting
from app.models.attendance import Attendance

# ── Seed Data ─────────────────────────────────

GHANAIAN_NAMES = [
    "Kwame Asante", "Akosua Mensah", "Kofi Boateng", "Abena Owusu",
    "Yaw Darko", "Ama Appiah", "Kweku Amoah", "Adwoa Frimpong",
    "Kojo Sarpong", "Efua Agyemang", "Nana Adjei", "Akua Ofori",
    "Kwabena Asare", "Araba Asiedu", "Kwame Adomako", "Maame Akyea",
    "Yaw Amponsah", "Esi Andoh", "Kofi Antwi", "Abena Acheampong",
    "Kwaku Bediako", "Akosua Boakye", "Kojo Bonsu", "Adwoa Danquah",
    "Kwame Donkor", "Efua Dua", "Yaw Duah", "Ama Entsua",
    "Kweku Fofie", "Akua Gyamfi", "Kofi Hammond", "Abena Kusi",
    "Kwabena Manso", "Araba Minta", "Kwame Nkrumah-Baah", "Maame Nyarko",
    "Yaw Osei", "Esi Oteng", "Kofi Owusu-Ansah", "Abena Poku",
    "Kwaku Quansah", "Akosua Saka", "Kojo Sefa", "Adwoa Tabi",
    "Kwame Takyi", "Efua Twum", "Yaw Wiredu", "Ama Yeboah",
    "Kweku Zerby", "Akua Ababio",
]

# Meeting definitions as specified
MEETINGS_DEF = [
    {
        'name': 'Sunday Family Service',
        'description': 'Weekly family worship service for all members.',
        'meeting_type': 'recurring',
        'points': 5,
        'days': ['sunday'],
        'start_date': date(2026, 5, 24),
        'end_date': date(2026, 9, 19),
        'start_time': time(6, 30),
        'end_time': time(9, 30),
    },
    {
        'name': 'Cell Meeting',
        'description': 'Small group fellowship and Bible study.',
        'meeting_type': 'recurring',
        'points': 3,
        'days': ['tuesday', 'saturday'],
        'start_date': date(2026, 5, 24),
        'end_date': date(2026, 9, 19),
        'start_time': time(5, 0),
        'end_time': time(6, 0),
    },
    {
        'name': 'Midweek Service',
        'description': 'Mid-week prayer and worship service.',
        'meeting_type': 'recurring',
        'points': 4,
        'days': ['tuesday'],
        'start_date': date(2026, 5, 24),
        'end_date': date(2026, 9, 19),
        'start_time': time(18, 30),
        'end_time': time(20, 0),
    },
    {
        'name': 'Prayer Investment Hour',
        'description': 'Dedicated hour of intercessory prayer.',
        'meeting_type': 'recurring',
        'points': 3,
        'days': ['friday'],
        'start_date': date(2026, 5, 24),
        'end_date': date(2026, 9, 19),
        'start_time': time(20, 0),
        'end_time': time(21, 0),
    },
    {
        'name': 'Compulsory Family Prayer Ties',
        'description': 'Mandatory family prayer and fellowship session.',
        'meeting_type': 'recurring',
        'points': 4,
        'days': ['saturday'],
        'start_date': date(2026, 5, 24),
        'end_date': date(2026, 9, 19),
        'start_time': time(18, 30),
        'end_time': time(20, 0),
    },
    {
        'name': 'Sunday Service Set-Up',
        'description': 'Preparation and setup team for Sunday service.',
        'meeting_type': 'recurring',
        'points': 2,
        'days': ['saturday'],
        'start_date': date(2026, 5, 24),
        'end_date': date(2026, 9, 19),
        'start_time': time(21, 0),
        'end_time': time(23, 0),
    },
]


def _get_past_occurrences(meeting: Meeting, from_date: date, to_date: date) -> list:
    """Return list of dates when this meeting occurred in the given range."""
    occurrences = []
    current = from_date

    while current <= to_date:
        if meeting.meeting_type == 'one-time':
            if current == meeting.start_date:
                occurrences.append(current)
        elif meeting.meeting_type == 'recurring':
            if current.strftime('%A').lower() in meeting.days:
                occurrences.append(current)
        current += timedelta(days=1)

    return occurrences


def seed_database(app=None):
    """Main seed function. Pass app instance or run standalone."""
    if app is None:
        from config import DevelopmentConfig
        app = create_app(DevelopmentConfig)

    with app.app_context():
        print("🌱 Seeding database...")

        # ── Members ───────────────────────────────
        print(f"  👥 Creating {len(GHANAIAN_NAMES)} members...")
        members = []
        for name in GHANAIAN_NAMES:
            existing = Member.query.filter(
                db.func.lower(Member.name) == name.lower()
            ).first()
            if not existing:
                m = Member(name=name)
                db.session.add(m)
                members.append(m)
            else:
                members.append(existing)

        db.session.flush()  # get IDs

        # ── Meetings ──────────────────────────────
        print(f"  📅 Creating {len(MEETINGS_DEF)} meetings...")
        meetings = []
        for mdef in MEETINGS_DEF:
            existing = Meeting.query.filter_by(name=mdef['name']).first()
            if not existing:
                m = Meeting(
                    name=mdef['name'],
                    description=mdef['description'],
                    meeting_type=mdef['meeting_type'],
                    points=mdef['points'],
                    start_date=mdef['start_date'],
                    end_date=mdef['end_date'],
                    start_time=mdef['start_time'],
                    end_time=mdef['end_time'],
                    is_active=True,
                )
                m.days = mdef['days']
                db.session.add(m)
                meetings.append(m)
            else:
                meetings.append(existing)

        db.session.flush()

        # ── Historical Attendance ─────────────────
        print("  📊 Generating historical attendance...")

        seed_start = date(2026, 5, 24)
        seed_end = date(2026, 7, 2)  # yesterday (keeping today free for demo)

        total_records = 0

        # Assign each member a personal attendance rate (30% – 95%)
        member_rates = {m.id: random.uniform(0.30, 0.95) for m in members}

        for meeting in meetings:
            past_dates = _get_past_occurrences(meeting, seed_start, seed_end)

            for occ_date in past_dates:
                for member in members:
                    # Decide if this member attended
                    rate = member_rates[member.id]
                    if random.random() > rate:
                        continue

                    # Random time within the meeting window
                    start_minutes = meeting.start_time.hour * 60 + meeting.start_time.minute
                    end_minutes = meeting.end_time.hour * 60 + meeting.end_time.minute
                    checkin_minutes = random.randint(start_minutes, min(start_minutes + 30, end_minutes))
                    checkin_hour = checkin_minutes // 60
                    checkin_min = checkin_minutes % 60

                    ts = datetime(
                        occ_date.year, occ_date.month, occ_date.day,
                        checkin_hour, checkin_min,
                        random.randint(0, 59),
                    )

                    # Skip if already recorded
                    existing_att = Attendance.query.filter(
                        Attendance.member_id == member.id,
                        Attendance.meeting_id == meeting.id,
                        db.func.date(Attendance.timestamp) == occ_date,
                    ).first()

                    if existing_att:
                        continue

                    att = Attendance(
                        member_id=member.id,
                        meeting_id=meeting.id,
                        timestamp=ts,
                        points_awarded=meeting.points,
                        status='present',
                        source='self',
                    )
                    db.session.add(att)
                    member.points += meeting.points
                    total_records += 1

        db.session.commit()

        final_count = Member.query.count()
        print(f"  ✅ {final_count} members seeded")
        print(f"  ✅ {Meeting.query.count()} meetings seeded")
        print(f"  ✅ {total_records} attendance records generated")
        print("🎉 Seed complete!")


if __name__ == '__main__':
    seed_database()
