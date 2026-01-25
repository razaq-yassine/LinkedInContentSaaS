"""merge migrations

Revision ID: 7d2ba2e1eaa9
Revises: 561e55f9e5be, f3a4b5c6d7e8
Create Date: 2026-01-22 15:03:22.228190

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d2ba2e1eaa9'
down_revision: Union[str, None] = ('561e55f9e5be', 'f3a4b5c6d7e8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
