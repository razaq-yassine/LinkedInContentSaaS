"""fix_cv_data_column_size

Revision ID: ee2d3fa1d977
Revises: 9889227b2bee
Create Date: 2026-01-25 17:36:52.980050

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee2d3fa1d977'
down_revision: Union[str, None] = '9889227b2bee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Change cv_data column from BLOB to MEDIUMBLOB to support larger CV files
    op.execute('ALTER TABLE user_profiles MODIFY cv_data MEDIUMBLOB')


def downgrade() -> None:
    # Revert back to BLOB
    op.execute('ALTER TABLE user_profiles MODIFY cv_data BLOB')
