"""
Church Model
"""
from database import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

class Church(db.Model):
    __tablename__ = 'churches'
    
    church_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(500), nullable=True)
    settings = db.Column(JSONB, default={})
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), onupdate=db.func.now())
    
    def to_dict(self):
        return {
            'id': str(self.church_id),
            'name': self.name,
            'location': self.location,
            'settings': self.settings or {},
        }

