"""init prompt registry

Revision ID: 20260201_0205
Revises: 
Create Date: 2026-02-01 02:05:00

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260201_0205"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "prompts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_prompts_name", "prompts", ["name"], unique=True)

    op.create_table(
        "prompt_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("prompt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("parameters", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["prompt_id"], ["prompts.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_prompt_versions_prompt_id", "prompt_versions", ["prompt_id"], unique=False)
    op.create_unique_constraint(
        "uq_prompt_versions_prompt_id_version",
        "prompt_versions",
        ["prompt_id", "version"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_prompt_versions_prompt_id_version", "prompt_versions", type_="unique")
    op.drop_index("ix_prompt_versions_prompt_id", table_name="prompt_versions")
    op.drop_table("prompt_versions")

    op.drop_index("ix_prompts_name", table_name="prompts")
    op.drop_table("prompts")
