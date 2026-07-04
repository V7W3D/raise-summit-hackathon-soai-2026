from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
	from models.clients.leads import Lead
	from models.clients.user_mission_links import UserMissionLink


class Mission(Base):
	__tablename__ = "missions"

	id: Mapped[int] = mapped_column(primary_key=True)
	search_status: Mapped[str] = mapped_column(
		String(20), default="ready", server_default="ready", nullable=False
	)
	name: Mapped[str] = mapped_column(String(160), nullable=False)
	target: Mapped[str] = mapped_column(String(255), default="", nullable=False)
	location: Mapped[str] = mapped_column(String(120), default="", nullable=False)
	progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
	is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

	description: Mapped[str] = mapped_column(String(500), default="", nullable=False)
	target_industry: Mapped[str | None] = mapped_column(String(120), nullable=True)
	target_business_size: Mapped[str | None] = mapped_column(String(120), nullable=True)
	desired_lead_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
	urgency: Mapped[str | None] = mapped_column(String(10), nullable=True)
	language: Mapped[str | None] = mapped_column(String(10), nullable=True)

	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), nullable=False
	)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
	)
	last_activity_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), nullable=False
	)

	user_links: Mapped[list["UserMissionLink"]] = relationship(
		back_populates="mission", cascade="all, delete-orphan"
	)
	leads: Mapped[list["Lead"]] = relationship(
		back_populates="mission", cascade="all, delete-orphan"
	)
