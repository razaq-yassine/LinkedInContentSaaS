"""merge_all_heads

Revision ID: 756965604e7d
Revises: b7fd5c7b10ce, c08b7905ea92
Create Date: 2026-01-15 16:40:37.826610

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '756965604e7d'
down_revision: Union[str, None] = ('b7fd5c7b10ce', 'c08b7905ea92')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
