"""initial_schema

Revision ID: aea8434b5651
Revises: 
Create Date: 2025-12-24 11:39:00.231887

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'aea8434b5651'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('email_verified', sa.Boolean(), nullable=True),
        sa.Column('google_id', sa.String(length=255), nullable=True),
        sa.Column('linkedin_id', sa.String(length=255), nullable=True),
        sa.Column('account_type', sa.Enum('person', 'business', name='accounttype'), nullable=True),
        sa.Column('linkedin_access_token', sa.Text(), nullable=True),
        sa.Column('linkedin_refresh_token', sa.Text(), nullable=True),
        sa.Column('linkedin_token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('linkedin_profile_data', sa.JSON(), nullable=True),
        sa.Column('linkedin_connected', sa.Boolean(), nullable=True),
        sa.Column('linkedin_last_sync', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('google_id'),
        sa.UniqueConstraint('linkedin_id')
    )
    op.create_index('idx_email', 'users', ['email'])
    op.create_index('idx_linkedin', 'users', ['linkedin_id'])
    op.create_index('idx_linkedin_connected', 'users', ['linkedin_connected'])

    # User profiles table
    op.create_table(
        'user_profiles',
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('cv_filename', sa.String(length=255), nullable=True),
        sa.Column('cv_data', sa.LargeBinary(), nullable=True),
        sa.Column('cv_text', sa.Text(), nullable=True),
        sa.Column('profile_md', sa.Text(), nullable=True),
        sa.Column('context_json', sa.JSON(), nullable=True),
        sa.Column('writing_samples', sa.JSON(), nullable=True),
        sa.Column('writing_style_md', sa.Text(), nullable=True),
        sa.Column('custom_instructions', sa.Text(), nullable=True),
        sa.Column('preferences', sa.JSON(), nullable=True),
        sa.Column('onboarding_step', sa.Integer(), nullable=True),
        sa.Column('onboarding_completed', sa.Boolean(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )

    # Conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_created', 'conversations', ['user_id', 'created_at'])

    # Generated posts table
    op.create_table(
        'generated_posts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('conversation_id', sa.String(length=36), nullable=True),
        sa.Column('topic', sa.String(length=500), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('format', sa.Enum('text', 'carousel', 'image', 'video', 'video_script', name='postformat'), nullable=True),
        sa.Column('generation_options', sa.JSON(), nullable=True),
        sa.Column('attachments', sa.JSON(), nullable=True),
        sa.Column('user_edited_content', sa.Text(), nullable=True),
        sa.Column('user_rating', sa.Integer(), nullable=True),
        sa.Column('published_to_linkedin', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_created', 'generated_posts', ['user_id', 'created_at'])
    op.create_index('idx_conversation', 'generated_posts', ['conversation_id'])

    # Conversation messages table
    op.create_table(
        'conversation_messages',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('conversation_id', sa.String(length=36), nullable=False),
        sa.Column('role', sa.Enum('user', 'assistant', name='messagerole'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('post_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['post_id'], ['generated_posts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_conversation_created', 'conversation_messages', ['conversation_id', 'created_at'])

    # Generated images table
    op.create_table(
        'generated_images',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('post_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('image_data', sa.Text(), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('model', sa.String(length=255), nullable=True),
        sa.Column('image_metadata', sa.JSON(), nullable=True),
        sa.Column('is_current', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['post_id'], ['generated_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_post', 'generated_images', ['post_id'])
    op.create_index('idx_user', 'generated_images', ['user_id'])
    op.create_index('idx_post_current', 'generated_images', ['post_id', 'is_current'])

    # Generated PDFs table
    op.create_table(
        'generated_pdfs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('post_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('pdf_data', sa.Text(), nullable=False),
        sa.Column('slide_images', sa.JSON(), nullable=True),
        sa.Column('slide_count', sa.Integer(), nullable=False),
        sa.Column('prompts', sa.JSON(), nullable=False),
        sa.Column('model', sa.String(length=255), nullable=True),
        sa.Column('pdf_metadata', sa.JSON(), nullable=True),
        sa.Column('is_current', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['post_id'], ['generated_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_post', 'generated_pdfs', ['post_id'])
    op.create_index('idx_user', 'generated_pdfs', ['user_id'])
    op.create_index('idx_post_current', 'generated_pdfs', ['post_id', 'is_current'])

    # Generated comments table
    op.create_table(
        'generated_comments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('original_post_screenshot', sa.String(length=500), nullable=True),
        sa.Column('original_post_text', sa.Text(), nullable=True),
        sa.Column('worthiness_score', sa.Integer(), nullable=True),
        sa.Column('worthiness_reasoning', sa.Text(), nullable=True),
        sa.Column('recommendation', sa.String(length=20), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('user_edited_content', sa.Text(), nullable=True),
        sa.Column('user_rating', sa.Integer(), nullable=True),
        sa.Column('published_to_linkedin', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user', 'generated_comments', ['user_id'])

    # Subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('plan', sa.Enum('free', 'pro', 'agency', name='subscriptionplan'), nullable=True),
        sa.Column('posts_this_month', sa.Integer(), nullable=True),
        sa.Column('posts_limit', sa.Integer(), nullable=True),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('period_end', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )

    # Admin settings table
    op.create_table(
        'admin_settings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )
    op.create_index('idx_key', 'admin_settings', ['key'])

    # User tokens table
    op.create_table(
        'user_tokens',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('token_type', sa.Enum('email_verification', 'password_reset', name='tokentype'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    op.create_index('idx_user_id', 'user_tokens', ['user_id'])
    op.create_index('idx_token', 'user_tokens', ['token'])

    # Admins table
    op.create_table(
        'admins',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('super_admin', 'admin', name='adminrole'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_email', 'admins', ['email'])
    op.create_index('idx_active', 'admins', ['is_active'])

    # Subscription plan configs table
    op.create_table(
        'subscription_plan_configs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('plan_name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_monthly', sa.Integer(), nullable=True),
        sa.Column('price_yearly', sa.Integer(), nullable=True),
        sa.Column('posts_limit', sa.Integer(), nullable=True),
        sa.Column('features', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('plan_name')
    )
    op.create_index('idx_plan_name', 'subscription_plan_configs', ['plan_name'])
    op.create_index('idx_active', 'subscription_plan_configs', ['is_active'])


def downgrade() -> None:
    op.drop_index('idx_active', table_name='subscription_plan_configs')
    op.drop_index('idx_plan_name', table_name='subscription_plan_configs')
    op.drop_table('subscription_plan_configs')
    op.drop_index('idx_active', table_name='admins')
    op.drop_index('idx_email', table_name='admins')
    op.drop_table('admins')
    op.drop_index('idx_token', table_name='user_tokens')
    op.drop_index('idx_user_id', table_name='user_tokens')
    op.drop_table('user_tokens')
    op.drop_index('idx_key', table_name='admin_settings')
    op.drop_table('admin_settings')
    op.drop_table('subscriptions')
    op.drop_index('idx_user', table_name='generated_comments')
    op.drop_table('generated_comments')
    op.drop_index('idx_post_current', table_name='generated_pdfs')
    op.drop_index('idx_user', table_name='generated_pdfs')
    op.drop_index('idx_post', table_name='generated_pdfs')
    op.drop_table('generated_pdfs')
    op.drop_index('idx_post_current', table_name='generated_images')
    op.drop_index('idx_user', table_name='generated_images')
    op.drop_index('idx_post', table_name='generated_images')
    op.drop_table('generated_images')
    op.drop_index('idx_conversation_created', table_name='conversation_messages')
    op.drop_table('conversation_messages')
    op.drop_index('idx_conversation', table_name='generated_posts')
    op.drop_index('idx_user_created', table_name='generated_posts')
    op.drop_table('generated_posts')
    op.drop_index('idx_user_created', table_name='conversations')
    op.drop_table('conversations')
    op.drop_table('user_profiles')
    op.drop_index('idx_linkedin_connected', table_name='users')
    op.drop_index('idx_linkedin', table_name='users')
    op.drop_index('idx_email', table_name='users')
    op.drop_table('users')
