"""add passwordless admin login

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-01-08

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # SQLite-compatible migration using batch_alter_table
    with op.batch_alter_table('admins', schema=None) as batch_op:
        # Make password_hash nullable for passwordless login
        batch_op.alter_column('password_hash',
                             existing_type=sa.String(255),
                             nullable=True)
        
        # Add email_code column for temporary login codes
        batch_op.add_column(sa.Column('email_code', sa.String(10), nullable=True))
        
        # Add email_code_expires_at column for code expiration
        batch_op.add_column(sa.Column('email_code_expires_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # SQLite-compatible downgrade using batch_alter_table
    # First, set empty string for null password_hash values
    op.execute("UPDATE admins SET password_hash = '' WHERE password_hash IS NULL")
    
    with op.batch_alter_table('admins', schema=None) as batch_op:
        # Remove email code columns
        batch_op.drop_column('email_code_expires_at')
        batch_op.drop_column('email_code')
        
        # Make password_hash non-nullable again
        batch_op.alter_column('password_hash',
                             existing_type=sa.String(255),
                             nullable=False)
