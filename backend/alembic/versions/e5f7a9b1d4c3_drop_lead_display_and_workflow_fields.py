"""drop lead display, scoring metadata, and workflow columns

Revision ID: e5f7a9b1d4c3
Revises: d4e6f8a0c3b2
Create Date: 2026-07-04 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f7a9b1d4c3"
down_revision: Union[str, Sequence[str], None] = "d4e6f8a0c3b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.drop_column("category")
		batch_op.drop_column("status")
		batch_op.drop_column("confidence")
		batch_op.drop_column("contactability")
		batch_op.drop_column("score_tone")
		batch_op.drop_column("score_label")
		batch_op.drop_column("contact_badge")
		batch_op.drop_column("logo_color")
		batch_op.drop_column("initials")


def downgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column("initials", sa.String(length=4), nullable=False, server_default="")
		)
		batch_op.add_column(
			sa.Column("logo_color", sa.String(length=20), nullable=False, server_default="#475569")
		)
		batch_op.add_column(
			sa.Column("contact_badge", sa.String(length=120), nullable=False, server_default="")
		)
		batch_op.add_column(
			sa.Column("score_label", sa.String(length=40), nullable=False, server_default="")
		)
		batch_op.add_column(
			sa.Column("score_tone", sa.String(length=20), nullable=False, server_default="orange")
		)
		batch_op.add_column(
			sa.Column("contactability", sa.Integer(), nullable=False, server_default="0")
		)
		batch_op.add_column(
			sa.Column("confidence", sa.String(length=20), nullable=False, server_default="Medium")
		)
		batch_op.add_column(
			sa.Column("status", sa.String(length=40), nullable=False, server_default="High fit")
		)
		batch_op.add_column(
			sa.Column("category", sa.String(length=40), nullable=False, server_default="high_fit")
		)
