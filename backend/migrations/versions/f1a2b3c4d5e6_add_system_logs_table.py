"""add system_logs table

Revision ID: f1a2b3c4d5e6
Revises: (current head)
Create Date: 2026-01-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = 'd8a9b0e1f2c3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create system_logs table
    op.create_table(
        'system_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('level', sa.Enum('debug', 'info', 'warning', 'error', 'critical', name='loglevel'), nullable=False),
        sa.Column('logger_name', sa.String(255)),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('admin_id', sa.String(36), sa.ForeignKey('admins.id', ondelete='SET NULL'), nullable=True),
        sa.Column('endpoint', sa.String(500)),
        sa.Column('method', sa.String(10)),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.Text()),
        sa.Column('extra_data', sa.JSON()),
        sa.Column('stack_trace', sa.Text()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Create indices for better query performance
    op.create_index('ix_system_logs_level', 'system_logs', ['level'])
    op.create_index('ix_system_logs_logger_name', 'system_logs', ['logger_name'])
    op.create_index('ix_system_logs_user_id', 'system_logs', ['user_id'])
    op.create_index('ix_system_logs_admin_id', 'system_logs', ['admin_id'])
    op.create_index('ix_system_logs_endpoint', 'system_logs', ['endpoint'])
    op.create_index('ix_system_logs_created_at', 'system_logs', ['created_at'])


def downgrade() -> None:
    # Drop indices
    op.drop_index('ix_system_logs_created_at', 'system_logs')
    op.drop_index('ix_system_logs_endpoint', 'system_logs')
    op.drop_index('ix_system_logs_admin_id', 'system_logs')
    op.drop_index('ix_system_logs_user_id', 'system_logs')
    op.drop_index('ix_system_logs_logger_name', 'system_logs')
    op.drop_index('ix_system_logs_level', 'system_logs')
    
    # Drop table
    op.drop_table('system_logs')
    
    # Drop enum type
    op.execute('DROP TYPE IF EXISTS loglevel')

