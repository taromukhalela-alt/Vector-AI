from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.String(50), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    provider = db.Column(db.String(20), default='local')
    avatar = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    memory_summary = db.Column(db.Text)
    preferences = db.Column(db.JSON, default=lambda: {"voice": "default"})
    
    # Relationships
    notes = db.relationship('Note', backref='user', lazy=True, cascade="all, delete-orphan")
    conversations = db.relationship('Conversation', backref='user', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "provider": self.provider,
            "avatar": self.avatar,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "memory_summary": self.memory_summary,
            "preferences": self.preferences,
            "notes_count": len(self.notes)
        }

class Note(db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    topic = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = db.Column(db.JSON, default=list)
    source = db.Column(db.String(50), default='user')

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "topic": self.topic,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "tags": self.tags,
            "source": self.source
        }

class Conversation(db.Model):
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    chat_id = db.Column(db.String(50), nullable=False) # Session ID
    message = db.Column(db.Text, nullable=False)
    reply = db.Column(db.Text, nullable=False)
    intent = db.Column(db.String(50))
    confidence = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "message": self.message,
            "reply": self.reply,
            "intent": self.intent,
            "confidence": self.confidence,
            "time": self.timestamp.isoformat(),
            "chat_id": self.chat_id
        }
