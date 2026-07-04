# Models package — import all so SQLAlchemy registers them
from .member import Member
from .meeting import Meeting
from .attendance import Attendance

__all__ = ['Member', 'Meeting', 'Attendance']
