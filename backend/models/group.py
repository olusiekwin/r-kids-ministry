"""
Group Model
"""
from database import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Group(db.Model):
    __tablename__ = 'groups'
    
    group_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    church_id = db.Column(UUID(as_uuid=True), db.ForeignKey('churches.church_id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age_range_min = db.Column(db.Integer, nullable=False)
    age_range_max = db.Column(db.Integer, nullable=False)
    room = db.Column(db.String(100), nullable=True)
    schedule = db.Column(db.String(255), nullable=True)
    teacher_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.user_id'), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), onupdate=db.func.now())
    
    __table_args__ = (
        db.UniqueConstraint('church_id', 'name', name='uq_groups_church_name'),
    )
    
    def to_dict(self):
        return {
            'id': str(self.group_id),
            'name': self.name,
            'age_range_min': self.age_range_min,
            'age_range_max': self.age_range_max,
            'room': self.room,
            'schedule': self.schedule,
            'teacher_id': str(self.teacher_id) if self.teacher_id else None,
        }

