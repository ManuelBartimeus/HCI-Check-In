"""
Leaderboard service — ranking logic with tie-breaking by earliest accumulated timestamp.
"""
from ..extensions import db
from ..models.member import Member
from ..models.attendance import Attendance


def get_leaderboard(member_id: int = None, limit: int = None):
    """
    Build the ranked leaderboard.

    Ranking order:
      1. Higher points first
      2. Tie-break: earliest first attendance timestamp (most consistent earner wins)

    Returns dict with leaderboard list + meta for the checked-in member.
    """
    # Subquery: first attendance timestamp per member (for tie-breaking)
    first_ts_subq = (
        db.session.query(
            Attendance.member_id,
            db.func.min(Attendance.timestamp).label('first_ts'),
        )
        .group_by(Attendance.member_id)
        .subquery()
    )

    # Main query: members + their first_ts for ordering
    query = (
        db.session.query(Member, first_ts_subq.c.first_ts)
        .outerjoin(first_ts_subq, Member.id == first_ts_subq.c.member_id)
        .order_by(
            Member.points.desc(),
            db.func.coalesce(first_ts_subq.c.first_ts, db.func.now()).asc(),
        )
    )

    results = query.all()

    # Build ranked list
    leaderboard = []
    for rank, (member, first_ts) in enumerate(results, start=1):
        leaderboard.append({
            'rank': rank,
            'id': member.id,
            'name': member.name,
            'points': member.points,
            'first_ts': first_ts.isoformat() if first_ts else None,
        })

    total = len(leaderboard)

    # Compute "ahead of XX%" for checked-in member
    checked_in_rank = None
    percentage_ahead = None

    if member_id is not None:
        for entry in leaderboard:
            if entry['id'] == member_id:
                checked_in_rank = entry['rank']
                break

        if checked_in_rank is not None and total > 0:
            percentage_ahead = round(((total - checked_in_rank) / total) * 100)

    if limit:
        leaderboard = leaderboard[:limit]

    return {
        'leaderboard': leaderboard,
        'total': total,
        'checked_in_member_id': member_id,
        'checked_in_rank': checked_in_rank,
        'percentage_ahead': percentage_ahead,
    }


def reset_leaderboard():
    """Reset all member points to zero and delete all attendance records."""
    Member.query.update({'points': 0})
    Attendance.query.delete()
    db.session.commit()


def recalculate_rankings():
    """
    Recalculate every member's points from their attendance records.
    Use this to repair inconsistencies.
    """
    from ..models.meeting import Meeting

    # Reset all points
    Member.query.update({'points': 0})
    db.session.flush()

    # Re-sum from attendance
    rows = (
        db.session.query(
            Attendance.member_id,
            db.func.sum(Attendance.points_awarded).label('total'),
        )
        .filter(Attendance.status == 'present')
        .group_by(Attendance.member_id)
        .all()
    )

    for member_id, total_pts in rows:
        Member.query.filter_by(id=member_id).update({'points': int(total_pts or 0)})

    db.session.commit()
    return {'recalculated': len(rows)}
