"""add_usage_tracking_and_pricing_settings

Revision ID: c5d7e9f123ab
Revises: 029b09f167cd
Create Date: 2025-01-06 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite
import uuid


# revision identifiers, used by Alembic.
revision: str = 'c5d7e9f123ab'
down_revision: Union[str, None] = 'b4e3a89c5f21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create usage_tracking table
    op.create_table(
        'usage_tracking',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('post_id', sa.String(36), sa.ForeignKey('generated_posts.id', ondelete='CASCADE'), nullable=True),
        sa.Column('service_type', sa.Enum('TEXT_GENERATION', 'IMAGE_GENERATION', 'SEARCH', name='servicetype'), nullable=False),
        sa.Column('input_tokens', sa.Integer(), default=0),
        sa.Column('output_tokens', sa.Integer(), default=0),
        sa.Column('total_tokens', sa.Integer(), default=0),
        sa.Column('estimated_cost', sa.Integer(), default=0),
        sa.Column('model', sa.String(255)),
        sa.Column('provider', sa.String(100)),
        sa.Column('image_count', sa.Integer(), default=0),
        sa.Column('tiles', sa.Integer(), default=0),
        sa.Column('steps', sa.Integer(), default=0),
        sa.Column('search_count', sa.Integer(), default=0),
        sa.Column('search_query', sa.Text(), nullable=True),
        sa.Column('usage_metadata', sa.JSON()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    
    # Create indexes for efficient queries
    op.create_index('ix_usage_tracking_user_id', 'usage_tracking', ['user_id'])
    op.create_index('ix_usage_tracking_post_id', 'usage_tracking', ['post_id'])
    op.create_index('ix_usage_tracking_service_type', 'usage_tracking', ['service_type'])
    op.create_index('ix_usage_tracking_created_at', 'usage_tracking', ['created_at'])
    
    # Add pricing settings to admin_settings
    # Check if settings already exist to avoid duplicate key errors
    conn = op.get_bind()
    
    # Brave Search pricing tier
    conn.execute(
        sa.text("""
            INSERT OR IGNORE INTO admin_settings (id, key, value, description, updated_at)
            VALUES (:id1, 'brave_search_pricing_tier', 'free', 'Brave Search API pricing tier (free or paid)', datetime('now'))
        """),
        {"id1": str(uuid.uuid4())}
    )
    
    # Brave Search cost per 1000 searches
    conn.execute(
        sa.text("""
            INSERT OR IGNORE INTO admin_settings (id, key, value, description, updated_at)
            VALUES (:id2, 'brave_search_cost_per_1000', '5.00', 'Cost per 1000 Brave Search API calls in USD', datetime('now'))
        """),
        {"id2": str(uuid.uuid4())}
    )
    
    # Brave Search free monthly limit
    conn.execute(
        sa.text("""
            INSERT OR IGNORE INTO admin_settings (id, key, value, description, updated_at)
            VALUES (:id3, 'brave_free_monthly_limit', '2000', 'Free tier monthly search limit for Brave Search API', datetime('now'))
        """),
        {"id3": str(uuid.uuid4())}
    )


def downgrade() -> None:
    # Remove pricing settings
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM admin_settings WHERE key IN ('brave_search_pricing_tier', 'brave_search_cost_per_1000', 'brave_free_monthly_limit')"))
    
    # Drop indexes
    op.drop_index('ix_usage_tracking_created_at', table_name='usage_tracking')
    op.drop_index('ix_usage_tracking_service_type', table_name='usage_tracking')
    op.drop_index('ix_usage_tracking_post_id', table_name='usage_tracking')
    op.drop_index('ix_usage_tracking_user_id', table_name='usage_tracking')
    
    # Drop table
    op.drop_table('usage_tracking')
    
    # Drop enum type (for PostgreSQL, no-op for SQLite)
    sa.Enum(name='servicetype').drop(op.get_bind(), checkfirst=True)

