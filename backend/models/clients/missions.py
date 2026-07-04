from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
	from models.clients.leads import Lead
	from models.clients.users import User


class Mission(Base):
	__tablename__ = "missions"

	id: Mapped[int] = mapped_column(primary_key=True)
	name: Mapped[str] = mapped_column(String(160), nullable=False)
	target: Mapped[str] = mapped_column(String(255), default="", nullable=False)
	location: Mapped[str] = mapped_column(String(120), default="", nullable=False)
	status: Mapped[str] = mapped_column(String(30), default="Draft", nullable=False)
	progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

	user_id: Mapped[int] = mapped_column(
		ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
	)

	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), nullable=False
	)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
	)
	last_activity_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), nullable=False
	)

	owner: Mapped["User"] = relationship(back_populates="missions")
	leads: Mapped[list["Lead"]] = relationship(
		back_populates="mission", cascade="all, delete-orphan"
	)
