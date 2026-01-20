"""merge credit purchase system

Revision ID: 561e55f9e5be
Revises: 756965604e7d, e7f8g9h0i1j2
Create Date: 2026-01-20 23:23:12.050210

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '561e55f9e5be'
down_revision: Union[str, None] = ('756965604e7d', 'e7f8g9h0i1j2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
