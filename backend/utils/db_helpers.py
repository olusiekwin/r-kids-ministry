"""
Database helper functions for Supabase operations
"""
try:
    from database import db
    from models import User, Church, Group, Guardian, Child
    from sqlalchemy import text
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    db = None
    User = None
    Church = None
    Group = None
    Guardian = None
    Child = None

from typing import Optional, List, Dict, Any

def get_church_by_id(church_id: str) -> Optional[Church]:
    """Get church by ID"""
    if not DB_AVAILABLE or not Church:
        return None
    try:
        return Church.query.filter_by(church_id=church_id).first()
    except Exception as e:
        print(f"Error getting church: {e}")
        return None

def get_user_by_email(email: str, church_id: str = None) -> Optional[User]:
    """Get user by email"""
    if not DB_AVAILABLE or not User:
        return None
    try:
        query = User.query.filter_by(email=email.lower())
        if church_id:
            query = query.filter_by(church_id=church_id)
        return query.first()
    except Exception as e:
        print(f"Error getting user: {e}")
        return None

def get_users_by_role(role: str, church_id: str = None) -> List[User]:
    """Get users by role"""
    if not DB_AVAILABLE or not User:
        return []
    try:
        query = User.query.filter_by(role=role)
        if church_id:
            query = query.filter_by(church_id=church_id)
        return query.all()
    except Exception as e:
        print(f"Error getting users by role: {e}")
        return []

def get_groups(church_id: str = None) -> List[Group]:
    """Get all groups"""
    if not DB_AVAILABLE or not Group:
        return []
    try:
        query = Group.query
        if church_id:
            query = query.filter_by(church_id=church_id)
        return query.all()
    except Exception as e:
        print(f"Error getting groups: {e}")
        return []

def get_group_by_name(name: str, church_id: str = None) -> Optional[Group]:
    """Get group by name"""
    if not DB_AVAILABLE or not Group:
        return None
    try:
        query = Group.query.filter_by(name=name)
        if church_id:
            query = query.filter_by(church_id=church_id)
        return query.first()
    except Exception as e:
        print(f"Error getting group: {e}")
        return None

def get_children(filters: Dict[str, Any] = None) -> List[Child]:
    """Get children with optional filters"""
    if not DB_AVAILABLE or not Child:
        return []
    try:
        query = Child.query
        if filters:
            if 'parent_id' in filters:
                query = query.filter_by(parent_id=filters['parent_id'])
            if 'group_id' in filters:
                query = query.filter_by(group_id=filters['group_id'])
            if 'status' in filters:
                query = query.filter_by(status=filters['status'])
        return query.all()
    except Exception as e:
        print(f"Error getting children: {e}")
        return []

def test_db_connection() -> bool:
    """Test database connection"""
    if not DB_AVAILABLE or not db:
        return False
    try:
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False

