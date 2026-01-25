"""add credit purchase system

Revision ID: e7f8g9h0i1j2
Revises: a1b2c3d4e5f6
Create Date: 2025-01-20

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e7f8g9h0i1j2'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename columns in subscriptions table
    # MySQL requires explicit type when renaming
    conn = op.get_bind()
    is_mysql = 'mysql' in str(conn.dialect).lower()
    
    if is_mysql:
        op.execute('ALTER TABLE subscriptions CHANGE credits_used_this_month subscription_credits_used FLOAT DEFAULT 0.0')
        op.execute('ALTER TABLE subscriptions CHANGE credits_limit subscription_credits_limit FLOAT DEFAULT 5.0')
    else:
        with op.batch_alter_table('subscriptions') as batch_op:
            batch_op.alter_column('credits_used_this_month', type_=sa.Float(), new_column_name='subscription_credits_used')
            batch_op.alter_column('credits_limit', type_=sa.Float(), new_column_name='subscription_credits_limit')
    
    # Add scheduled downgrade fields
    op.add_column('subscriptions', sa.Column('scheduled_downgrade_plan', sa.String(100), nullable=True))
    op.add_column('subscriptions', sa.Column('scheduled_downgrade_date', sa.DateTime(), nullable=True))
    
    # Create credit_purchases table
    op.create_table(
        'credit_purchases',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('credits_purchased', sa.Float(), nullable=False),
        sa.Column('amount_paid_cents', sa.Integer(), nullable=False),
        sa.Column('stripe_payment_intent_id', sa.String(255), nullable=True),
        sa.Column('stripe_checkout_session_id', sa.String(255), nullable=True),
        sa.Column('purchase_date', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Create purchased_credits_balance table
    op.create_table(
        'purchased_credits_balance',
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('balance', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('last_updated', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Create indices
    op.create_index('ix_credit_purchases_user_id', 'credit_purchases', ['user_id'])
    op.create_index('ix_credit_purchases_purchase_date', 'credit_purchases', ['purchase_date'])
    op.create_index('ix_credit_purchases_status', 'credit_purchases', ['status'])
    op.create_index('ix_credit_purchases_stripe_payment_intent_id', 'credit_purchases', ['stripe_payment_intent_id'])
    op.create_index('ix_credit_purchases_stripe_checkout_session_id', 'credit_purchases', ['stripe_checkout_session_id'])
    
    # Initialize purchased_credits_balance for all existing users
    # Note: This will be handled by the application layer on first access
    # Using a safer approach that works with both SQLite and PostgreSQL
    try:
        op.execute("""
            INSERT INTO purchased_credits_balance (user_id, balance, last_updated)
            SELECT id, 0.0, CURRENT_TIMESTAMP
            FROM users
            WHERE id NOT IN (SELECT user_id FROM purchased_credits_balance)
        """)
    except Exception:
        # If the query fails (e.g., table doesn't exist yet), skip it
        # The application will create balances on first access
        pass


def downgrade() -> None:
    # Drop indices
    op.drop_index('ix_credit_purchases_stripe_checkout_session_id', table_name='credit_purchases')
    op.drop_index('ix_credit_purchases_stripe_payment_intent_id', table_name='credit_purchases')
    op.drop_index('ix_credit_purchases_status', table_name='credit_purchases')
    op.drop_index('ix_credit_purchases_purchase_date', table_name='credit_purchases')
    op.drop_index('ix_credit_purchases_user_id', table_name='credit_purchases')
    
    # Drop tables
    op.drop_table('purchased_credits_balance')
    op.drop_table('credit_purchases')
    
    # Revert column renames in subscriptions table
    op.drop_column('subscriptions', 'scheduled_downgrade_date')
    op.drop_column('subscriptions', 'scheduled_downgrade_plan')
    
    conn = op.get_bind()
    is_mysql = 'mysql' in str(conn.dialect).lower()
    
    if is_mysql:
        op.execute('ALTER TABLE subscriptions CHANGE subscription_credits_limit credits_limit FLOAT DEFAULT 5.0')
        op.execute('ALTER TABLE subscriptions CHANGE subscription_credits_used credits_used_this_month FLOAT DEFAULT 0.0')
    else:
        op.alter_column('subscriptions', 'subscription_credits_limit', new_column_name='credits_limit')
        op.alter_column('subscriptions', 'subscription_credits_used', new_column_name='credits_used_this_month')
