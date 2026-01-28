"""merge plan name case fix with image pdf fix

Revision ID: a79a20d7a40f
Revises: deb87198d706, fix_plan_name_case
Create Date: 2026-01-28 16:02:35.843377

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a79a20d7a40f'
down_revision: Union[str, None] = ('deb87198d706', 'fix_plan_name_case')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
