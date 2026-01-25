"""merge_all_migration_heads

Revision ID: 4eed9b4a1774
Revises: 7d2ba2e1eaa9, ee2d3fa1d977
Create Date: 2026-01-25 17:42:37.067804

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4eed9b4a1774'
down_revision: Union[str, None] = ('7d2ba2e1eaa9', 'ee2d3fa1d977')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
