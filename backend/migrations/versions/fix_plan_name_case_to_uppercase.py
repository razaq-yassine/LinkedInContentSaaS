"""fix_plan_name_case_to_uppercase

Revision ID: fix_plan_name_case
Revises: dbd86c0e5662
Create Date: 2026-01-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_plan_name_case'
down_revision: Union[str, None] = 'dbd86c0e5662'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Update SubscriptionPlanConfig.plan_name values to uppercase to match enum values.
    
    This ensures consistency:
    - SubscriptionPlan enum: FREE, STARTER, PRO, UNLIMITED, AGENCY (uppercase)
    - SubscriptionPlanConfig.plan_name: FREE, STARTER, PRO, UNLIMITED, AGENCY (uppercase)
    """
    # Update existing plan_name values to uppercase
    op.execute("UPDATE subscription_plan_configs SET plan_name = 'FREE' WHERE plan_name = 'free'")
    op.execute("UPDATE subscription_plan_configs SET plan_name = 'STARTER' WHERE plan_name = 'starter'")
    op.execute("UPDATE subscription_plan_configs SET plan_name = 'PRO' WHERE plan_name = 'pro'")
    op.execute("UPDATE subscription_plan_configs SET plan_name = 'UNLIMITED' WHERE plan_name = 'unlimited'")
    op.execute("UPDATE subscription_plan_configs SET plan_name = 'AGENCY' WHERE plan_name = 'agency'")
    
    # Update scheduled_downgrade_plan in subscriptions table to uppercase
    op.execute("UPDATE subscriptions SET scheduled_downgrade_plan = 'FREE' WHERE scheduled_downgrade_plan = 'free'")
    op.execute("UPDATE subscriptions SET scheduled_downgrade_plan = 'STARTER' WHERE scheduled_downgrade_plan = 'starter'")
    op.execute("UPDATE subscriptions SET scheduled_downgrade_plan = 'PRO' WHERE scheduled_downgrade_plan = 'pro'")
    op.execute("UPDATE subscriptions SET scheduled_downgrade_plan = 'UNLIMITED' WHERE scheduled_downgrade_plan = 'unlimited'")
    op.execute("UPDATE subscriptions SET scheduled_downgrade_plan = 'AGENCY' WHERE scheduled_downgrade_plan = 'agency'")


def downgrade() -> None:
    """Revert plan_name values back to lowercase"""
    op.execute("UPDATE subscription_plan_configs SET plan_name = 'free' WHERE plan_name = 'FREE'")
    op.execute("UPDATE subscription_plan_configs SET plan_name = 'starter' WHERE plan_name = 'STARTER'")
    op.execute("UPDATE subscription_plan_configs SET plan_name = 'pro' WHERE plan_name = 'PRO'")
    op.execute("UPDATE subscription_plan_configs SET plan_name = 'unlimited' WHERE plan_name = 'UNLIMITED'")
    op.execute("UPDATE subscription_plan_configs SET plan_name = 'agency' WHERE plan_name = 'AGENCY'")
    
    op.execute("UPDATE subscriptions SET scheduled_downgrade_plan = 'free' WHERE scheduled_downgrade_plan = 'FREE'")
    op.execute("UPDATE subscriptions SET scheduled_downgrade_plan = 'starter' WHERE scheduled_downgrade_plan = 'STARTER'")
    op.execute("UPDATE subscriptions SET scheduled_downgrade_plan = 'pro' WHERE scheduled_downgrade_plan = 'PRO'")
    op.execute("UPDATE subscriptions SET scheduled_downgrade_plan = 'unlimited' WHERE scheduled_downgrade_plan = 'UNLIMITED'")
    op.execute("UPDATE subscriptions SET scheduled_downgrade_plan = 'agency' WHERE scheduled_downgrade_plan = 'AGENCY'")
