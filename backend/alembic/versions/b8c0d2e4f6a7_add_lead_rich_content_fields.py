"""add lead rich JSON content columns

Revision ID: b8c0d2e4f6a7
Revises: a7b9c1d3e6f5
Create Date: 2026-07-04 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8c0d2e4f6a7"
down_revision: Union[str, Sequence[str], None] = "a7b9c1d3e6f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.add_column(sa.Column("why", sa.JSON(), nullable=False, server_default="[]"))
		batch_op.add_column(sa.Column("missing", sa.JSON(), nullable=False, server_default="[]"))
		batch_op.add_column(sa.Column("recommended", sa.JSON(), nullable=False, server_default="[]"))
		batch_op.add_column(sa.Column("evidence", sa.JSON(), nullable=False, server_default="[]"))
		batch_op.add_column(
			sa.Column("sources_scanned", sa.JSON(), nullable=False, server_default="[]")
		)
		batch_op.add_column(
			sa.Column("ai_summary", sa.String(length=600), nullable=False, server_default="")
		)


def downgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.drop_column("ai_summary")
		batch_op.drop_column("sources_scanned")
		batch_op.drop_column("evidence")
		batch_op.drop_column("recommended")
		batch_op.drop_column("missing")
		batch_op.drop_column("why")
