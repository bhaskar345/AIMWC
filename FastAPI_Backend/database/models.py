from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from .connections import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(24), nullable=False)
    last_name = Column(String(24), nullable=False)
    email = Column(String(254), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)

    entries = relationship("JournalEntry", back_populates="user")

    def __repr__(self):
        return f"<User {self.email}>"

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    text = Column(String, nullable=False)
    emotions = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="entries")

    def __repr__(self):
        return f"{self.user.username} - {self.created_at.strftime('%Y-%m-%d')}"