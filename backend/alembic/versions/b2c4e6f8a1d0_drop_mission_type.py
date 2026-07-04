"""drop mission_type from missions

Revision ID: b2c4e6f8a1d0
Revises: 1a53df53b8db
Create Date: 2026-07-04 19:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c4e6f8a1d0"
down_revision: Union[str, Sequence[str], None] = "1a53df53b8db"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.drop_column("mission_type")


def downgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column("mission_type", sa.String(length=60), nullable=False, server_default="Clients")
		)
