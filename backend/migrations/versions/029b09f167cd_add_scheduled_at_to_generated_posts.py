"""add_scheduled_at_to_generated_posts

Revision ID: 029b09f167cd
Revises: 940f8fd2c35e
Create Date: 2025-12-31 19:28:44.277828

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '029b09f167cd'
down_revision: Union[str, None] = '940f8fd2c35e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add scheduled_at column to generated_posts table
    op.add_column('generated_posts', sa.Column('scheduled_at', sa.DateTime(), nullable=True))
    # Create index for efficient queries
    op.create_index(op.f('ix_generated_posts_scheduled_at'), 'generated_posts', ['scheduled_at'], unique=False)


def downgrade() -> None:
    # Remove index and column
    op.drop_index(op.f('ix_generated_posts_scheduled_at'), table_name='generated_posts')
    op.drop_column('generated_posts', 'scheduled_at')
