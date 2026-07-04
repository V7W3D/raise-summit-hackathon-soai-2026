from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.clients.users import User

# The demo user used across the app until real auth is added.
DEFAULT_USER_EMAIL = "azzedine@prospectpath.com"


def get_default_user(db: Session) -> User | None:
	return db.scalar(select(User).order_by(User.id).limit(1))


def get_or_create_default_user(db: Session) -> User:
	user = get_default_user(db)
	if user is not None:
		return user
	user = User(
		name="Azzedine",
		email=DEFAULT_USER_EMAIL,
		plan="Enterprise Plan",
		initials="AZ",
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return user
