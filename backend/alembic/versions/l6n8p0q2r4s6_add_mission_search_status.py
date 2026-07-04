"""add mission search_status column

Revision ID: l6n8p0q2r4s6
Revises: k5m7n9p1q3r5
Create Date: 2026-07-05 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "l6n8p0q2r4s6"
down_revision: Union[str, Sequence[str], None] = "k5m7n9p1q3r5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column(
				"search_status",
				sa.String(length=20),
				nullable=False,
				server_default="ready",
			)
		)


def downgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.drop_column("search_status")
