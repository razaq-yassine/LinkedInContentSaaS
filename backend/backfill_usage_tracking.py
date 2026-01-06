"""
Backfill usage tracking data from existing generated_posts
Parses generation_options.token_usage and creates UsageTracking records
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import GeneratedPost, UsageTracking, ServiceType
from app.services.cost_calculator import cost_to_cents
import uuid
from datetime import datetime


def backfill_usage_tracking():
    """Backfill usage tracking from existing posts"""
    db = SessionLocal()
    
    try:
        # Get all posts with generation_options
        posts = db.query(GeneratedPost).all()
        
        total_posts = len(posts)
        processed = 0
        skipped = 0
        created_text = 0
        created_image = 0
        created_search = 0
        
        print(f"Processing {total_posts} posts...")
        
        for post in posts:
            processed += 1
            
            if not post.generation_options or not isinstance(post.generation_options, dict):
                skipped += 1
                continue
            
            token_usage = post.generation_options.get("token_usage")
            if not token_usage or not isinstance(token_usage, dict):
                skipped += 1
                continue
            
            # Check if already tracked to avoid duplicates
            existing = db.query(UsageTracking).filter(
                UsageTracking.post_id == post.id
            ).first()
            
            if existing:
                skipped += 1
                continue
            
            # Extract text generation data
            input_tokens = token_usage.get("input_tokens", 0)
            output_tokens = token_usage.get("output_tokens", 0)
            total_tokens = token_usage.get("total_tokens", 0)
            model = token_usage.get("model", "unknown")
            provider = token_usage.get("provider", "unknown")
            cost_data = token_usage.get("cost", 0.0)
            
            # Handle cost being a dict or float
            if isinstance(cost_data, dict):
                # Skip if cost is a dict (malformed data)
                cost = 0.0
            elif isinstance(cost_data, (int, float)):
                cost = float(cost_data)
            else:
                cost = 0.0
            
            # Create text generation record
            if total_tokens > 0 or cost > 0:
                text_usage = UsageTracking(
                    id=str(uuid.uuid4()),
                    user_id=post.user_id,
                    post_id=post.id,
                    service_type=ServiceType.TEXT_GENERATION,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    total_tokens=total_tokens,
                    estimated_cost=cost_to_cents(cost),
                    model=model,
                    provider=provider,
                    created_at=post.created_at
                )
                db.add(text_usage)
                created_text += 1
            
            # Extract image generation data
            cloudflare_cost = token_usage.get("cloudflare_cost")
            if cloudflare_cost and isinstance(cloudflare_cost, dict):
                image_count = cloudflare_cost.get("image_count", 1)
                total_cost = cloudflare_cost.get("total_cost", 0.0)
                tiles = cloudflare_cost.get("tiles_per_image", 9)
                steps = cloudflare_cost.get("steps_per_image", 25)
                cf_model = token_usage.get("cloudflare_model", "unknown")
                
                if total_cost > 0:
                    image_usage = UsageTracking(
                        id=str(uuid.uuid4()),
                        user_id=post.user_id,
                        post_id=post.id,
                        service_type=ServiceType.IMAGE_GENERATION,
                        input_tokens=0,
                        output_tokens=0,
                        total_tokens=0,
                        estimated_cost=cost_to_cents(total_cost),
                        model=cf_model,
                        provider="cloudflare",
                        image_count=image_count,
                        tiles=tiles,
                        steps=steps,
                        created_at=post.created_at
                    )
                    db.add(image_usage)
                    created_image += 1
            
            # Note: We don't have historical search data, so we can't backfill that
            
            # Commit every 100 posts
            if processed % 100 == 0:
                db.commit()
                print(f"Processed {processed}/{total_posts} posts...")
        
        # Final commit
        db.commit()
        
        print("\n" + "="*60)
        print("Backfill Complete!")
        print("="*60)
        print(f"Total posts processed: {processed}")
        print(f"Posts skipped (no data): {skipped}")
        print(f"Text generation records created: {created_text}")
        print(f"Image generation records created: {created_image}")
        print(f"Search records created: {created_search}")
        print(f"Total usage records created: {created_text + created_image + created_search}")
        print("="*60)
        
    except Exception as e:
        print(f"Error during backfill: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Starting usage tracking backfill...")
    print("This will create UsageTracking records from existing GeneratedPost data.")
    print()
    
    response = input("Continue? (y/n): ")
    if response.lower() == "y":
        backfill_usage_tracking()
    else:
        print("Backfill cancelled.")

