"""Add attachments to conversation_messages

Revision ID: 940f8fd2c35e
Revises: aea8434b5651
Create Date: 2025-12-30 21:46:27.194706

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '940f8fd2c35e'
down_revision: Union[str, None] = 'aea8434b5651'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add attachments column to conversation_messages
    op.add_column('conversation_messages', sa.Column('attachments', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove attachments column from conversation_messages
    op.drop_column('conversation_messages', 'attachments')
