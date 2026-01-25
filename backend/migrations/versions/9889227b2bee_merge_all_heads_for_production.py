"""merge_all_heads_for_production

Revision ID: 9889227b2bee
Revises: 561e55f9e5be, f3a4b5c6d7e8
Create Date: 2026-01-23 22:21:22.022808

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9889227b2bee'
down_revision: Union[str, None] = ('561e55f9e5be', 'f3a4b5c6d7e8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
