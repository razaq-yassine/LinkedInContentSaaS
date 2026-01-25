"""fix_all_enum_case_for_mysql

Revision ID: dbd86c0e5662
Revises: 4eed9b4a1774
Create Date: 2026-01-25 17:54:50.374444

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dbd86c0e5662'
down_revision: Union[str, None] = '4eed9b4a1774'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix all enum columns to use UPPERCASE values for MySQL case-sensitivity
    
    # First, update existing data to uppercase before changing enum definition
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Update users.account_type data
    if 'users' in tables:
        op.execute("UPDATE users SET account_type = 'PERSON' WHERE account_type = 'person'")
        op.execute("UPDATE users SET account_type = 'BUSINESS' WHERE account_type = 'business'")
    
    # Update subscriptions.plan data
    if 'subscriptions' in tables:
        op.execute("UPDATE subscriptions SET plan = 'FREE' WHERE plan = 'free'")
        op.execute("UPDATE subscriptions SET plan = 'STARTER' WHERE plan = 'starter'")
        op.execute("UPDATE subscriptions SET plan = 'PRO' WHERE plan = 'pro'")
        op.execute("UPDATE subscriptions SET plan = 'UNLIMITED' WHERE plan = 'unlimited'")
        op.execute("UPDATE subscriptions SET plan = 'AGENCY' WHERE plan = 'agency'")
    
    # subscriptions.plan - add missing values and convert to uppercase
    op.execute("ALTER TABLE subscriptions MODIFY plan ENUM('FREE', 'STARTER', 'PRO', 'UNLIMITED', 'AGENCY') DEFAULT 'FREE'")
    
    # users.account_type - convert to uppercase enum
    op.execute("ALTER TABLE users MODIFY account_type ENUM('PERSON', 'BUSINESS') DEFAULT 'PERSON'")
    
    # generated_posts.format
    op.execute("ALTER TABLE generated_posts MODIFY format ENUM('TEXT', 'CAROUSEL', 'IMAGE', 'VIDEO', 'VIDEO_SCRIPT') DEFAULT 'TEXT'")
    
    # conversation_messages.role
    op.execute("ALTER TABLE conversation_messages MODIFY role ENUM('USER', 'ASSISTANT') NOT NULL")
    
    # user_tokens.token_type
    op.execute("ALTER TABLE user_tokens MODIFY token_type ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET') NOT NULL")
    
    # admins.role
    op.execute("ALTER TABLE admins MODIFY role ENUM('SUPER_ADMIN', 'ADMIN') DEFAULT 'ADMIN'")
    
    # subscriptions.billing_cycle and subscription_status - convert from varchar to enum
    op.execute("ALTER TABLE subscriptions MODIFY billing_cycle ENUM('MONTHLY', 'YEARLY') DEFAULT 'MONTHLY'")
    op.execute("ALTER TABLE subscriptions MODIFY subscription_status ENUM('ACTIVE', 'CANCELED', 'PAST_DUE') DEFAULT 'ACTIVE' NOT NULL")
    
    # credit_purchases.status (if table exists)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'credit_purchases' in tables:
        op.execute("ALTER TABLE credit_purchases MODIFY status ENUM('PENDING', 'COMPLETED', 'REFUNDED') DEFAULT 'PENDING'")
    
    # system_logs.level (if table exists)
    if 'system_logs' in tables:
        op.execute("ALTER TABLE system_logs MODIFY level ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL")
    
    # error_logs.resolution_status (if table exists)
    if 'error_logs' in tables:
        op.execute("ALTER TABLE error_logs MODIFY resolution_status ENUM('NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX') DEFAULT 'NEW'")


def downgrade() -> None:
    # Revert to lowercase enum values
    op.execute("ALTER TABLE subscriptions MODIFY plan ENUM('free', 'pro', 'agency')")
    op.execute("ALTER TABLE generated_posts MODIFY format ENUM('text', 'carousel', 'image', 'video', 'video_script')")
    op.execute("ALTER TABLE conversation_messages MODIFY role ENUM('user', 'assistant') NOT NULL")
    op.execute("ALTER TABLE user_tokens MODIFY token_type ENUM('email_verification', 'password_reset') NOT NULL")
    op.execute("ALTER TABLE admins MODIFY role ENUM('super_admin', 'admin')")
