from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import GeneratedPost
from ..services.post_publishing_service import publish_post_to_linkedin
import logging
import traceback

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def publish_scheduled_posts():
    """
    Background task that runs every 5 minutes to check for scheduled posts
    that need to be published.
    """
    # Get database session using the generator pattern
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        # Query posts where scheduled_at <= now() and not yet published
        now = datetime.utcnow()
        scheduled_posts = db.query(GeneratedPost).filter(
            GeneratedPost.scheduled_at.isnot(None),
            GeneratedPost.scheduled_at <= now,
            GeneratedPost.published_to_linkedin == False
        ).all()
        
        logger.info(f"Found {len(scheduled_posts)} scheduled posts to publish")
        
        for post in scheduled_posts:
            try:
                logger.info(f"Publishing scheduled post {post.id} (scheduled for {post.scheduled_at})")
                await publish_post_to_linkedin(post.id, db)
                logger.info(f"Successfully published post {post.id}")
            except Exception as e:
                # Log error but continue with other posts
                logger.error(f"Failed to publish scheduled post {post.id}: {str(e)}")
                logger.error(traceback.format_exc())
                # Don't raise - continue processing other posts
    except Exception as e:
        logger.error(f"Error in publish_scheduled_posts: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        db.close()

def start_scheduler():
    """
    Start the APScheduler with a cron job that runs every 5 minutes.
    """
    if scheduler.running:
        logger.warning("Scheduler is already running")
        return
    
    # Add cron job that runs every 5 minutes
    scheduler.add_job(
        publish_scheduled_posts,
        trigger=CronTrigger(minute='*/5'),  # Every 5 minutes
        id='publish_scheduled_posts',
        name='Publish Scheduled Posts',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started - will check for scheduled posts every 5 minutes")

def stop_scheduler():
    """
    Stop the scheduler gracefully.
    """
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")

