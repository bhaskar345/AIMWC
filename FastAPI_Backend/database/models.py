from __future__ import annotations
from datetime import datetime
from typing import List
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .connections import Base

def default_emotions() -> list:
    return []

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(24), nullable=False)
    last_name: Mapped[str] = mapped_column(String(24), nullable=False)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)

    entries: Mapped[List["JournalEntry"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(String, nullable=False)
    emotions: Mapped[list] = mapped_column(JSON, default=default_emotions)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped["User"] = relationship(back_populates="entries")

    def __repr__(self) -> str:
        return f"{self.user.first_name} {self.user.last_name} - {self.created_at.strftime('%Y-%m-%d')}"
