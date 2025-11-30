"""
User Model
"""
from database import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    church_id = db.Column(UUID(as_uuid=True), db.ForeignKey('churches.church_id'), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # Admin, Teacher, Parent, Teen
    linked_guardian_id = db.Column(UUID(as_uuid=True), nullable=True)
    linked_child_id = db.Column(UUID(as_uuid=True), nullable=True)
    mfa_secret = db.Column(db.String(255), nullable=True)
    mfa_enabled = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), onupdate=db.func.now())
    
    __table_args__ = (
        db.UniqueConstraint('church_id', 'email', name='uq_users_church_email'),
    )
    
    def to_dict(self):
        return {
            'id': str(self.user_id),
            'email': self.email,
            'role': self.role.lower(),
            'name': self.email.split('@')[0].title() + ' User',
            'church_id': str(self.church_id),
            'is_active': self.is_active,
        }

