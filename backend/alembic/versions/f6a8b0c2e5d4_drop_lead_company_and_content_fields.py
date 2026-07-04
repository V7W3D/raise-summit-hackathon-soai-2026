"""drop lead company facts and rich content columns

Revision ID: f6a8b0c2e5d4
Revises: e5f7a9b1d4c3
Create Date: 2026-07-04 20:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f6a8b0c2e5d4"
down_revision: Union[str, Sequence[str], None] = "e5f7a9b1d4c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.drop_column("ai_summary")
		batch_op.drop_column("sources_scanned")
		batch_op.drop_column("evidence")
		batch_op.drop_column("recommended")
		batch_op.drop_column("missing")
		batch_op.drop_column("why")
		batch_op.drop_column("business_type")
		batch_op.drop_column("service_area")
		batch_op.drop_column("employees")
		batch_op.drop_column("industry")


def downgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column("industry", sa.String(length=120), nullable=False, server_default="")
		)
		batch_op.add_column(
			sa.Column("employees", sa.String(length=60), nullable=False, server_default="")
		)
		batch_op.add_column(
			sa.Column("service_area", sa.String(length=120), nullable=False, server_default="")
		)
		batch_op.add_column(
			sa.Column("business_type", sa.String(length=120), nullable=False, server_default="")
		)
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
