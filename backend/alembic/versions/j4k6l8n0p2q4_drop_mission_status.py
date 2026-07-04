"""drop mission status column

Revision ID: j4k6l8n0p2q4
Revises: i3j5k7m9n1o3
Create Date: 2026-07-04 23:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "j4k6l8n0p2q4"
down_revision: Union[str, Sequence[str], None] = "i3j5k7m9n1o3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.drop_column("status")


def downgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column(
				"status",
				sa.String(length=30),
				nullable=False,
				server_default="Draft",
			)
		)
