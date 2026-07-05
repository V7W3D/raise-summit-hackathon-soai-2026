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

	mission_id: Mapped[int] = mapped_column(
		ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True
	)

	name: Mapped[str] = mapped_column(String(160), nullable=False)
	description: Mapped[str] = mapped_column(String(255), default="", nullable=False)
	location: Mapped[str] = mapped_column(String(120), default="", nullable=False)
	website: Mapped[str] = mapped_column(String(255), default="", nullable=False)
	email: Mapped[str] = mapped_column(String(255), default="", nullable=False)
	phone: Mapped[str] = mapped_column(String(60), default="", nullable=False)
	score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
	status: Mapped[str] = mapped_column(
		String(20), default="new", server_default="new", nullable=False
	)

	why: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
	missing: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
	recommended: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
	evidence: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
	sources_scanned: Mapped[list[dict[str, Any]]] = mapped_column(
		JSON, default=list, nullable=False
	)

	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), nullable=False
	)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
	)

	mission: Mapped["Mission"] = relationship(back_populates="leads")
