from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.clients.users import User


def get_default_user(db: Session) -> User | None:
	return db.scalar(select(User).order_by(User.id).limit(1))
