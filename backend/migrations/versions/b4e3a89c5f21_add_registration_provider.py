"""add_registration_provider

Revision ID: b4e3a89c5f21
Revises: 029b09f167cd
Create Date: 2025-01-06 00:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4e3a89c5f21'
down_revision: Union[str, None] = '029b09f167cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add registration_provider column to users table
    op.add_column('users', sa.Column('registration_provider', sa.String(50), nullable=True))
    
    # Set registration_provider for existing users based on their current login methods
    # Priority: email (if password exists) > google > linkedin
    op.execute("""
        UPDATE users 
        SET registration_provider = CASE
            WHEN password_hash IS NOT NULL THEN 'email'
            WHEN google_id IS NOT NULL THEN 'google'
            WHEN linkedin_id IS NOT NULL THEN 'linkedin'
            ELSE 'email'
        END
        WHERE registration_provider IS NULL
    """)


def downgrade() -> None:
    # Remove registration_provider column
    op.drop_column('users', 'registration_provider')
