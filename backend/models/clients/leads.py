from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from database.base import Base

if TYPE_CHECKING:
	from models.clients.missions import Mission


class Lead(Base):
	__tablename__ = "leads"

	id: Mapped[int] = mapped_column(primary_key=True)
	slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)

	mission_id: Mapped[int] = mapped_column(
		ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True
	)

	name: Mapped[str] = mapped_column(String(160), nullable=False)
	description: Mapped[str] = mapped_column(String(255), default="", nullable=False)
	location: Mapped[str] = mapped_column(String(120), default="", nullable=False)
	website: Mapped[str] = mapped_column(String(255), default="", nullable=False)
	email: Mapped[str] = mapped_column(String(255), default="", nullable=False)
	phone: Mapped[str] = mapped_column(String(60), default="", nullable=False)

	initials: Mapped[str] = mapped_column(String(4), default="", nullable=False)
	logo_color: Mapped[str] = mapped_column(String(20), default="#475569", nullable=False)
	contact_badge: Mapped[str] = mapped_column(String(120), default="", nullable=False)

	# Scoring
	score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
	score_label: Mapped[str] = mapped_column(String(40), default="", nullable=False)
	score_tone: Mapped[str] = mapped_column(String(20), default="orange", nullable=False)
	contactability: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
	confidence: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)

	# Workflow
	status: Mapped[str] = mapped_column(String(40), default="High fit", nullable=False)
	category: Mapped[str] = mapped_column(String(40), default="high_fit", nullable=False)

	# Company facts
	industry: Mapped[str] = mapped_column(String(120), default="", nullable=False)
	employees: Mapped[str] = mapped_column(String(60), default="", nullable=False)
	service_area: Mapped[str] = mapped_column(String(120), default="", nullable=False)
	business_type: Mapped[str] = mapped_column(String(120), default="", nullable=False)

	# Rich JSON fields
	why: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
	missing: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
	recommended: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
	evidence: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
	sources_scanned: Mapped[list[dict[str, Any]]] = mapped_column(
		JSON, default=list, nullable=False
	)
	ai_summary: Mapped[str] = mapped_column(String(600), default="", nullable=False)

	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), nullable=False
	)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
	)

	mission: Mapped["Mission"] = relationship(back_populates="leads")
