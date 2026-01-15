"""add notification tables

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-01-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create notification_actions table
    op.create_table(
        'notification_actions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('action_code', sa.String(100), nullable=False, unique=True),
        sa.Column('action_name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Create notification_preferences table
    op.create_table(
        'notification_preferences',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('action_id', sa.String(36), sa.ForeignKey('notification_actions.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('email_enabled', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('push_enabled', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_by_admin_id', sa.String(36), sa.ForeignKey('admins.id', ondelete='SET NULL'), nullable=True)
    )
    
    # Create push_subscriptions table
    op.create_table(
        'push_subscriptions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('endpoint', sa.Text(), nullable=False),
        sa.Column('p256dh_key', sa.Text(), nullable=False),
        sa.Column('auth_key', sa.Text(), nullable=False),
        sa.Column('user_agent', sa.Text()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Create notification_logs table
    op.create_table(
        'notification_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('action_id', sa.String(36), sa.ForeignKey('notification_actions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('channel', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Create indices
    op.create_index('ix_notification_actions_action_code', 'notification_actions', ['action_code'])
    op.create_index('ix_notification_actions_category', 'notification_actions', ['category'])
    op.create_index('ix_notification_preferences_action_id', 'notification_preferences', ['action_id'])
    op.create_index('ix_push_subscriptions_user_id', 'push_subscriptions', ['user_id'])
    op.create_index('ix_notification_logs_action_id', 'notification_logs', ['action_id'])
    op.create_index('ix_notification_logs_user_id', 'notification_logs', ['user_id'])
    op.create_index('ix_notification_logs_channel', 'notification_logs', ['channel'])
    op.create_index('ix_notification_logs_status', 'notification_logs', ['status'])
    op.create_index('ix_notification_logs_created_at', 'notification_logs', ['created_at'])


def downgrade() -> None:
    # Drop indices
    op.drop_index('ix_notification_logs_created_at', 'notification_logs')
    op.drop_index('ix_notification_logs_status', 'notification_logs')
    op.drop_index('ix_notification_logs_channel', 'notification_logs')
    op.drop_index('ix_notification_logs_user_id', 'notification_logs')
    op.drop_index('ix_notification_logs_action_id', 'notification_logs')
    op.drop_index('ix_push_subscriptions_user_id', 'push_subscriptions')
    op.drop_index('ix_notification_preferences_action_id', 'notification_preferences')
    op.drop_index('ix_notification_actions_category', 'notification_actions')
    op.drop_index('ix_notification_actions_action_code', 'notification_actions')
    
    # Drop tables
    op.drop_table('notification_logs')
    op.drop_table('push_subscriptions')
    op.drop_table('notification_preferences')
    op.drop_table('notification_actions')
