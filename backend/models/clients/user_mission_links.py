from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
	from models.clients.missions import Mission
	from models.clients.users import User


class UserMissionLink(Base):
	__tablename__ = "user_mission_links"

	user_id: Mapped[int] = mapped_column(
		ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
	)
	mission_id: Mapped[int] = mapped_column(
		ForeignKey("missions.id", ondelete="CASCADE"), primary_key=True
	)

	user: Mapped["User"] = relationship(back_populates="mission_links")
	mission: Mapped["Mission"] = relationship(back_populates="user_links")
