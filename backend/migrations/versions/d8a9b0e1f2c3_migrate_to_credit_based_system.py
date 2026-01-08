"""migrate_to_credit_based_system

Revision ID: d8a9b0e1f2c3
Revises: 940f8fd2c35e
Create Date: 2025-01-07 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite


# revision identifiers, used by Alembic.
revision: str = 'd8a9b0e1f2c3'
down_revision: Union[str, None] = '5f892683cd7c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new enums for billing cycle and subscription status
    with op.batch_alter_table('subscriptions') as batch_op:
        # Rename old columns
        batch_op.alter_column('posts_this_month', new_column_name='credits_used_this_month')
        batch_op.alter_column('posts_limit', new_column_name='credits_limit')
        
        # Add new columns
        batch_op.add_column(sa.Column('billing_cycle', sa.String(50), nullable=True))
        batch_op.add_column(sa.Column('subscription_status', sa.String(50), nullable=False, server_default='active'))
        batch_op.add_column(sa.Column('current_period_start', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('current_period_end', sa.DateTime(), nullable=True))
        
        # Rename period_end to avoid confusion (will be handled by drop)
        # Note: SQLite doesn't support column drop directly, so we'll leave it
        
        # Create index on stripe_subscription_id
        batch_op.create_index('ix_subscriptions_stripe_subscription_id', ['stripe_subscription_id'])
    
    # Update SubscriptionPlanConfig table
    with op.batch_alter_table('subscription_plan_configs') as batch_op:
        batch_op.alter_column('posts_limit', new_column_name='credits_limit')
        batch_op.add_column(sa.Column('stripe_product_id', sa.String(255), nullable=True))
        batch_op.add_column(sa.Column('stripe_price_id_monthly', sa.String(255), nullable=True))
        batch_op.add_column(sa.Column('stripe_price_id_yearly', sa.String(255), nullable=True))
    
    # Create credit_transactions table
    op.create_table(
        'credit_transactions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('post_id', sa.String(36), nullable=True),
        sa.Column('admin_id', sa.String(36), nullable=True),
        sa.Column('action_type', sa.String(100), nullable=False),
        sa.Column('credits_used', sa.Float(), nullable=False),
        sa.Column('credits_before', sa.Integer(), nullable=False),
        sa.Column('credits_after', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['post_id'], ['generated_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['admin_id'], ['admins.id'], ondelete='SET NULL'),
    )
    
    # Create indexes for credit_transactions
    op.create_index('ix_credit_transactions_user_id', 'credit_transactions', ['user_id'])
    op.create_index('ix_credit_transactions_created_at', 'credit_transactions', ['created_at'])


def downgrade() -> None:
    # Drop credit_transactions table
    op.drop_index('ix_credit_transactions_created_at', table_name='credit_transactions')
    op.drop_index('ix_credit_transactions_user_id', table_name='credit_transactions')
    op.drop_table('credit_transactions')
    
    # Revert SubscriptionPlanConfig changes
    with op.batch_alter_table('subscription_plan_configs') as batch_op:
        batch_op.drop_column('stripe_price_id_yearly')
        batch_op.drop_column('stripe_price_id_monthly')
        batch_op.drop_column('stripe_product_id')
        batch_op.alter_column('credits_limit', new_column_name='posts_limit')
    
    # Revert Subscription changes
    with op.batch_alter_table('subscriptions') as batch_op:
        batch_op.drop_index('ix_subscriptions_stripe_subscription_id')
        batch_op.drop_column('current_period_end')
        batch_op.drop_column('current_period_start')
        batch_op.drop_column('subscription_status')
        batch_op.drop_column('billing_cycle')
        batch_op.alter_column('credits_limit', new_column_name='posts_limit')
        batch_op.alter_column('credits_used_this_month', new_column_name='posts_this_month')

