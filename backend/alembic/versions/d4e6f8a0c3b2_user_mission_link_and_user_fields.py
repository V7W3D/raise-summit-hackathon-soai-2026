"""add user_mission_links, drop user plan/initials and mission user_id

Revision ID: d4e6f8a0c3b2
Revises: c3d5e7f9b2a1
Create Date: 2026-07-04 20:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e6f8a0c3b2"
down_revision: Union[str, Sequence[str], None] = "c3d5e7f9b2a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	op.create_table(
		"user_mission_links",
		sa.Column("user_id", sa.Integer(), nullable=False),
		sa.Column("mission_id", sa.Integer(), nullable=False),
		sa.ForeignKeyConstraint(["mission_id"], ["missions.id"], ondelete="CASCADE"),
		sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
		sa.PrimaryKeyConstraint("user_id", "mission_id"),
	)

	op.execute(
		"INSERT INTO user_mission_links (user_id, mission_id) "
		"SELECT user_id, id FROM missions"
	)

	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.drop_index(batch_op.f("ix_missions_user_id"))
		batch_op.drop_column("user_id")

	with op.batch_alter_table("users", schema=None) as batch_op:
		batch_op.drop_column("initials")
		batch_op.drop_column("plan")


def downgrade() -> None:
	with op.batch_alter_table("users", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column("plan", sa.String(length=60), nullable=False, server_default="Enterprise Plan")
		)
		batch_op.add_column(
			sa.Column("initials", sa.String(length=4), nullable=False, server_default="")
		)

	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
		batch_op.create_index(batch_op.f("ix_missions_user_id"), ["user_id"], unique=False)

	op.execute(
		"UPDATE missions SET user_id = ("
		"SELECT user_id FROM user_mission_links "
		"WHERE user_mission_links.mission_id = missions.id LIMIT 1"
		")"
	)

	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.alter_column("user_id", nullable=False)
		batch_op.create_foreign_key(
			"fk_missions_user_id_users", "users", ["user_id"], ["id"], ondelete="CASCADE"
		)

	op.drop_table("user_mission_links")
