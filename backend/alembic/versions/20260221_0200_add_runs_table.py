"""add_runs_table

Revision ID: 20260221_0200
Revises: 1e7ce805d7ea
Create Date: 2026-02-21 02:00:00

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260221_0200"
down_revision = "1e7ce805d7ea"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("prompt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("prompt_version", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="queued", nullable=False),
        sa.Column("input", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("output", sa.Text(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status in ('queued','running','succeeded','failed')",
            name="ck_runs_status",
        ),
        sa.ForeignKeyConstraint(
            ["prompt_id"],
            ["prompts.id"],
            name="fk_runs_prompt_id_prompts",
            ondelete="RESTRICT",
        ),
    )

    op.create_index("ix_runs_prompt_id", "runs", ["prompt_id"])


def downgrade() -> None:
    op.drop_index("ix_runs_prompt_id", table_name="runs")
    op.drop_table("runs")
