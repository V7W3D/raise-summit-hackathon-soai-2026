"""drop mission goal_type column

Revision ID: i3j5k7m9n1o3
Revises: h2i4j6k8l0m2
Create Date: 2026-07-04 22:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "i3j5k7m9n1o3"
down_revision: Union[str, Sequence[str], None] = "h2i4j6k8l0m2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.drop_column("goal_type")


def downgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column(
				"goal_type",
				sa.String(length=30),
				nullable=False,
				server_default="find_clients",
			)
		)
