"""merge_passwordless_and_notifications

Revision ID: c08b7905ea92
Revises: a1b2c3d4e5f6, c7d8e9f0a1b2
Create Date: 2026-01-15 16:40:12.142100

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c08b7905ea92'
down_revision: Union[str, None] = ('a1b2c3d4e5f6', 'c7d8e9f0a1b2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
