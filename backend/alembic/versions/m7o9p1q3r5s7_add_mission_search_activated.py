"""add mission search_activated column

Revision ID: m7o9p1q3r5s7
Revises: l6n8p0q2r4s6
Create Date: 2026-07-05 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m7o9p1q3r5s7"
down_revision: Union[str, Sequence[str], None] = "l6n8p0q2r4s6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column(
				"search_activated",
				sa.Boolean(),
				nullable=False,
				server_default="1",
			)
		)


def downgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.drop_column("search_activated")
