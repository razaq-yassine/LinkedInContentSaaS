"""add_cloudflare_tier_settings

Revision ID: 5f892683cd7c
Revises: c5d7e9f123ab
Create Date: 2026-01-07 00:23:53.370575

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5f892683cd7c'
down_revision: Union[str, None] = 'c5d7e9f123ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Cloudflare Workers AI tier configuration settings"""
    import uuid
    
    conn = op.get_bind()
    
    # Cloudflare Workers AI tier (free or paid)
    conn.execute(
        sa.text("""
            INSERT OR IGNORE INTO admin_settings (id, key, value, description, updated_at)
            VALUES (:id1, 'cloudflare_workers_ai_tier', 'free', 'Cloudflare Workers AI tier (free or paid)', datetime('now'))
        """),
        {"id1": str(uuid.uuid4())}
    )
    
    # Daily neuron limit (10,000 free neurons per day on both tiers)
    conn.execute(
        sa.text("""
            INSERT OR IGNORE INTO admin_settings (id, key, value, description, updated_at)
            VALUES (:id2, 'cloudflare_daily_neuron_limit', '10000', 'Free daily neuron limit for Cloudflare Workers AI', datetime('now'))
        """),
        {"id2": str(uuid.uuid4())}
    )
    
    # Cost per 1000 neurons after free tier (only applies to paid tier)
    conn.execute(
        sa.text("""
            INSERT OR IGNORE INTO admin_settings (id, key, value, description, updated_at)
            VALUES (:id3, 'cloudflare_cost_per_1000_neurons', '0.011', 'Cost per 1000 neurons after free tier (USD, paid tier only)', datetime('now'))
        """),
        {"id3": str(uuid.uuid4())}
    )


def downgrade() -> None:
    """Remove Cloudflare tier settings"""
    conn = op.get_bind()
    conn.execute(
        sa.text("""
            DELETE FROM admin_settings 
            WHERE key IN (
                'cloudflare_workers_ai_tier', 
                'cloudflare_daily_neuron_limit', 
                'cloudflare_cost_per_1000_neurons'
            )
        """)
    )
