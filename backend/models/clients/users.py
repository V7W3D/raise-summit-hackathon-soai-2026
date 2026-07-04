from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
	from models.clients.missions import Mission


class User(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(primary_key=True)
	name: Mapped[str] = mapped_column(String(120), nullable=False)
	email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
	plan: Mapped[str] = mapped_column(String(60), default="Enterprise Plan", nullable=False)
	initials: Mapped[str] = mapped_column(String(4), default="", nullable=False)
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), nullable=False
	)

	missions: Mapped[list["Mission"]] = relationship(
		back_populates="owner", cascade="all, delete-orphan"
	)
