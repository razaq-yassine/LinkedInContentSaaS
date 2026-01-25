"""fix_image_pdf_data_column_size

Revision ID: deb87198d706
Revises: dbd86c0e5662
Create Date: 2026-01-25 18:40:40.933188

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'deb87198d706'
down_revision: Union[str, None] = 'dbd86c0e5662'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Change image_data and pdf_data columns from TEXT to LONGTEXT to support larger files
    # TEXT max: 65,535 bytes (~64KB), LONGTEXT max: 4,294,967,295 bytes (~4GB)
    op.execute('ALTER TABLE generated_images MODIFY image_data LONGTEXT')
    op.execute('ALTER TABLE generated_pdfs MODIFY pdf_data LONGTEXT')


def downgrade() -> None:
    # Revert back to TEXT (note: this may cause data loss if files are larger than 64KB)
    op.execute('ALTER TABLE generated_images MODIFY image_data TEXT')
    op.execute('ALTER TABLE generated_pdfs MODIFY pdf_data TEXT')
