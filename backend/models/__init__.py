"""
Database Models for R-KIDS
"""
try:
    from .user import User
except ImportError:
    User = None

try:
    from .church import Church
except ImportError:
    Church = None

try:
    from .group import Group
except ImportError:
    Group = None

# Optional models - only import if files exist
Guardian = None
Child = None
ChildGuardian = None
CheckInRecord = None
AttendanceSummary = None
Notification = None
AuditLog = None

__all__ = [
    'User',
    'Church',
    'Group',
    'Guardian',
    'Child',
    'ChildGuardian',
    'CheckInRecord',
    'AttendanceSummary',
    'Notification',
    'AuditLog',
]
