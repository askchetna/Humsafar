"""Baseline schema for Humsafar platform

Revision ID: 001_baseline
Revises:
Create Date: 2026-06-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tables are created via Base.metadata.create_all in dev.
    # For PostgreSQL production, run: alembic upgrade head
    # after setting DATABASE_URL=postgresql+psycopg2://...
    pass


def downgrade() -> None:
    pass
