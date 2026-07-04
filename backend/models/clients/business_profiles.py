from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from database.base import Base

if TYPE_CHECKING:
	from models.clients.users import User


class BusinessProfile(Base):
	__tablename__ = "business_profiles"

	id: Mapped[int] = mapped_column(primary_key=True)
	user_id: Mapped[int] = mapped_column(
		ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
	)

	business_name: Mapped[str] = mapped_column(String(160), nullable=False)
	business_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
	description: Mapped[str | None] = mapped_column(String(500), nullable=True)
	what_we_sell: Mapped[str] = mapped_column(String(500), nullable=False)
	value_proposition: Mapped[str | None] = mapped_column(String(500), nullable=True)
	target_geographies: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
	ideal_customers: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
	bad_fit_customers: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
	preferred_tone: Mapped[str | None] = mapped_column(String(120), nullable=True)
	languages: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), nullable=False
	)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
	)

	user: Mapped["User"] = relationship(back_populates="business_profile")
