"""add_onboarding_service_type

Revision ID: f3a4b5c6d7e8
Revises: c08b7905ea92
Create Date: 2026-01-22 12:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a4b5c6d7e8'
down_revision: Union[str, None] = 'c08b7905ea92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add ONBOARDING to ServiceType enum
    # For PostgreSQL, we need to alter the enum type
    # For SQLite, enum is stored as string, so no change needed
    conn = op.get_bind()
    
    # Check if we're using PostgreSQL
    if conn.dialect.name == 'postgresql':
        # Add new enum value
        op.execute("ALTER TYPE servicetype ADD VALUE IF NOT EXISTS 'ONBOARDING'")
    # For SQLite, no action needed as enums are stored as strings


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values easily
    # This would require recreating the enum type, which is complex
    # For safety, we'll leave this as a no-op
    # If needed, manual intervention would be required
    pass
