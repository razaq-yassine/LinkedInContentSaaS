"""
Analyze token usage data to design credit-based subscription system
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import UsageTracking, ServiceType, GeneratedPost
from app.services.cost_calculator import cents_to_cost, PRICING_TABLE
from sqlalchemy import func
from collections import defaultdict


def analyze_usage_data():
    """Analyze usage tracking data to determine credit requirements"""
    db = SessionLocal()
    
    try:
        print("="*80)
        print("LINKEDIN CONTENT SAAS - TOKEN USAGE & CREDIT ANALYSIS")
        print("="*80)
        print()
        
        # Get all usage records
        all_usage = db.query(UsageTracking).all()
        print(f"📊 Total usage records found: {len(all_usage)}")
        print()
        
        # Analyze by service type
        print("="*80)
        print("USAGE BY SERVICE TYPE")
        print("="*80)
        
        text_gen_records = db.query(UsageTracking).filter(
            UsageTracking.service_type == ServiceType.TEXT_GENERATION
        ).all()
        
        image_gen_records = db.query(UsageTracking).filter(
            UsageTracking.service_type == ServiceType.IMAGE_GENERATION
        ).all()
        
        search_records = db.query(UsageTracking).filter(
            UsageTracking.service_type == ServiceType.SEARCH
        ).all()
        
        print(f"\n📝 Text Generation Records: {len(text_gen_records)}")
        print(f"🖼️  Image Generation Records: {len(image_gen_records)}")
        print(f"🔍 Search Records: {len(search_records)}")
        print()
        
        # Analyze text generation in detail
        print("="*80)
        print("TEXT GENERATION ANALYSIS (Posts)")
        print("="*80)
        
        if text_gen_records:
            # Group by post_id to analyze per-post usage
            post_usage = defaultdict(lambda: {
                'input_tokens': 0,
                'output_tokens': 0,
                'total_tokens': 0,
                'cost': 0,
                'model': None,
                'provider': None,
                'has_image': False
            })
            
            # Aggregate usage by post
            for record in text_gen_records:
                if record.post_id:
                    post_usage[record.post_id]['input_tokens'] += record.input_tokens
                    post_usage[record.post_id]['output_tokens'] += record.output_tokens
                    post_usage[record.post_id]['total_tokens'] += record.total_tokens
                    post_usage[record.post_id]['cost'] += record.estimated_cost
                    post_usage[record.post_id]['model'] = record.model
                    post_usage[record.post_id]['provider'] = record.provider
            
            # Check which posts have images
            for post_id in post_usage.keys():
                has_image = db.query(UsageTracking).filter(
                    UsageTracking.post_id == post_id,
                    UsageTracking.service_type == ServiceType.IMAGE_GENERATION
                ).first() is not None
                post_usage[post_id]['has_image'] = has_image
            
            # Calculate statistics
            text_only_posts = [p for p in post_usage.values() if not p['has_image']]
            image_posts = [p for p in post_usage.values() if p['has_image']]
            
            print(f"\n📊 Posts with tracking data: {len(post_usage)}")
            print(f"   - Text-only posts: {len(text_only_posts)}")
            print(f"   - Posts with images: {len(image_posts)}")
            
            avg_input = 0
            avg_output = 0
            avg_total = 0
            avg_cost = 0
            
            if text_only_posts:
                avg_input = sum(p['input_tokens'] for p in text_only_posts) / len(text_only_posts)
                avg_output = sum(p['output_tokens'] for p in text_only_posts) / len(text_only_posts)
                avg_total = sum(p['total_tokens'] for p in text_only_posts) / len(text_only_posts)
                avg_cost = sum(p['cost'] for p in text_only_posts) / len(text_only_posts)
                
                print(f"\n📝 TEXT-ONLY POST STATISTICS:")
                print(f"   Average Input Tokens:  {avg_input:,.0f}")
                print(f"   Average Output Tokens: {avg_output:,.0f}")
                print(f"   Average Total Tokens:  {avg_total:,.0f}")
                print(f"   Average Cost per Post: ${cents_to_cost(int(avg_cost)):.6f}")
                
                # Get most common model
                models = [p['model'] for p in text_only_posts if p['model']]
                if models:
                    most_common = max(set(models), key=models.count)
                    print(f"   Most Common Model:     {most_common}")
            
            if image_posts:
                img_avg_input = sum(p['input_tokens'] for p in image_posts) / len(image_posts)
                img_avg_output = sum(p['output_tokens'] for p in image_posts) / len(image_posts)
                img_avg_total = sum(p['total_tokens'] for p in image_posts) / len(image_posts)
                img_avg_cost = sum(p['cost'] for p in image_posts) / len(image_posts)
                
                print(f"\n🖼️  IMAGE + TEXT POST STATISTICS:")
                print(f"   Average Input Tokens:  {img_avg_input:,.0f}")
                print(f"   Average Output Tokens: {img_avg_output:,.0f}")
                print(f"   Average Total Tokens:  {img_avg_total:,.0f}")
                print(f"   Average Cost per Post: ${cents_to_cost(int(img_avg_cost)):.6f} (text only)")
        
        # Analyze image generation
        print("\n" + "="*80)
        print("IMAGE GENERATION ANALYSIS")
        print("="*80)
        
        if image_gen_records:
            total_images = sum(r.image_count for r in image_gen_records)
            total_cost = sum(r.estimated_cost for r in image_gen_records)
            avg_cost_per_image = total_cost / total_images if total_images > 0 else 0
            
            print(f"\n🖼️  Total Images Generated: {total_images}")
            print(f"   Total Cost: ${cents_to_cost(total_cost):.6f}")
            print(f"   Average Cost per Image: ${cents_to_cost(int(avg_cost_per_image)):.6f}")
            
            # Analyze by dimensions
            if image_gen_records:
                sample = image_gen_records[0]
                print(f"\n   Typical Image Settings:")
                print(f"   - Tiles: {sample.tiles}")
                print(f"   - Steps: {sample.steps}")
        
        # Calculate credit recommendations
        print("\n" + "="*80)
        print("CREDIT SYSTEM RECOMMENDATIONS")
        print("="*80)
        
        print("\n💡 PROPOSED CREDIT SYSTEM:")
        print("   Based on your current data and Cloudflare pricing...")
        print()
        
        # Estimate costs using Cloudflare (cheap) vs current models
        # Cloudflare image cost (from cost_calculator.py: ~$0.026 per 1120x1120 image with 25 steps)
        cloudflare_image_cost = 0.026  # USD per image
        
        # We need to estimate text generation cost with Cloudflare's text models
        # Cloudflare Workers AI text models are very cheap (free tier or ~$0.011 per 1000 neurons)
        # For comparison, let's use a cheap model like Gemini Flash
        cheap_text_model = "gemini-1.5-flash"
        if cheap_text_model in PRICING_TABLE and text_only_posts:
            pricing = PRICING_TABLE[cheap_text_model]
            
            # Calculate cost with cheap model
            avg_input_ratio = avg_input / avg_total if avg_total > 0 else 0.5
            avg_output_ratio = avg_output / avg_total if avg_total > 0 else 0.5
            
            est_input_tokens = int(avg_total * avg_input_ratio)
            est_output_tokens = int(avg_total * avg_output_ratio)
            
            text_cost_per_post = (
                (est_input_tokens / 1_000_000) * pricing["input"] +
                (est_output_tokens / 1_000_000) * pricing["output"]
            )
            
            print(f"📝 TEXT-ONLY POST (using {cheap_text_model}):")
            print(f"   Cost per post: ${text_cost_per_post:.6f}")
            print(f"   Credit multiplier: 1.0 (baseline)")
            print()
            
            print(f"🖼️  IMAGE + TEXT POST:")
            print(f"   Text cost: ${text_cost_per_post:.6f}")
            print(f"   Image cost: ${cloudflare_image_cost:.6f}")
            print(f"   Total cost: ${text_cost_per_post + cloudflare_image_cost:.6f}")
            print(f"   Credit multiplier: 1.2 (image adds ~20% cost overhead)")
            print()
            
            # Carousel estimate (text + 3-5 images)
            carousel_cost = text_cost_per_post + (cloudflare_image_cost * 3)
            print(f"📚 CAROUSEL POST (text + 3 images):")
            print(f"   Text cost: ${text_cost_per_post:.6f}")
            print(f"   Images cost: ${cloudflare_image_cost * 3:.6f}")
            print(f"   Total cost: ${carousel_cost:.6f}")
            print(f"   Credit multiplier: 1.5 (multiple images)")
            print()
            
            # Calculate subscription pricing
            print("="*80)
            print("SUBSCRIPTION PRICING ANALYSIS ($12/month plan)")
            print("="*80)
            print()
            
            target_price = 12.00  # USD per month
            target_min_posts = 15
            target_max_posts = 30
            
            # Calculate cost for different scenarios
            cost_per_text_post = text_cost_per_post
            cost_per_image_post = text_cost_per_post + cloudflare_image_cost
            cost_per_carousel = carousel_cost
            
            print(f"💰 TARGET: ${target_price}/month for {target_min_posts}-{target_max_posts} posts")
            print()
            
            # Scenario 1: All text posts
            max_text_posts = int(target_price / cost_per_text_post)
            print(f"📊 SCENARIO 1: All Text Posts")
            print(f"   Cost per post: ${cost_per_text_post:.6f}")
            print(f"   Maximum posts possible: {max_text_posts}")
            print(f"   Credits to give: {target_max_posts} credits (1 credit = 1 text post)")
            print(f"   Actual cost to you: ${cost_per_text_post * target_max_posts:.2f}")
            print(f"   Profit margin: {((target_price - (cost_per_text_post * target_max_posts)) / target_price * 100):.1f}%")
            print()
            
            # Scenario 2: Mixed usage (70% text, 20% image, 10% carousel)
            mixed_avg_cost = (0.7 * cost_per_text_post + 
                             0.2 * cost_per_image_post * 1.2 + 
                             0.1 * cost_per_carousel * 1.5)
            max_mixed_posts = int(target_price / mixed_avg_cost)
            
            print(f"📊 SCENARIO 2: Mixed Usage (70% text, 20% image, 10% carousel)")
            print(f"   Average cost per post: ${mixed_avg_cost:.6f}")
            print(f"   Maximum posts possible: {max_mixed_posts}")
            print(f"   Credits to give: {target_max_posts} credits")
            print(f"   Credit costs:")
            print(f"      - Text post: 1.0 credit")
            print(f"      - Image post: 1.2 credits")
            print(f"      - Carousel: 1.5 credits")
            print(f"   With mixed usage, {target_max_posts} credits = ~{int(target_max_posts * 0.7 / 1.0 + target_max_posts * 0.2 / 1.2 + target_max_posts * 0.1 / 1.5)} actual posts")
            print()
            
            # Regeneration costs
            print(f"🔄 REGENERATION COSTS:")
            print(f"   Image regeneration: 0.5 credits (${cloudflare_image_cost:.6f})")
            print(f"   Carousel regeneration: 1.0 credits (3 images = ${cloudflare_image_cost * 3:.6f})")
            print()
            
            print("="*80)
            print("FINAL RECOMMENDATIONS")
            print("="*80)
            print()
            print(f"✅ For $12/month plan, give users: 25-30 CREDITS")
            print()
            print("   Credit System:")
            print("   • 1.0 credit  = 1 text-only post")
            print("   • 1.2 credits = 1 image + text post")
            print("   • 1.5 credits = 1 carousel post (with 3-5 images)")
            print("   • 0.5 credits = 1 image regeneration")
            print("   • 1.0 credits = 1 carousel regeneration (regenerate all images)")
            print()
            print("   With 25-30 credits:")
            print(f"   • ~25-30 text posts")
            print(f"   • ~20-25 image posts")
            print(f"   • ~17-20 carousel posts")
            print(f"   • Or any mix of the above")
            print()
            print("   Expected costs with Cloudflare:")
            print(f"   • If all text: ${cost_per_text_post * 30:.2f}")
            print(f"   • If all image: ${cost_per_image_post * 1.2 * 25:.2f}")
            print(f"   • If mixed (typical): ${mixed_avg_cost * 27:.2f}")
            print(f"   • Profit margin: ~{((target_price - (mixed_avg_cost * 27)) / target_price * 100):.0f}%")
            print()
        
        print("="*80)
        print("ADDITIONAL NOTES")
        print("="*80)
        print()
        print("⚠️  Current data is mostly text-only posts (limited image data)")
        print("   Monitor actual usage after launch to adjust credit system")
        print()
        print("💡 Cloudflare Workers AI Benefits:")
        print("   • Text generation: Very cheap (~$0.011 per 1000 neurons)")
        print("   • Image generation: Phoenix model ~$0.026 per 1120x1120 image")
        print("   • Free tier: 10,000 neurons/day (~300k requests/month)")
        print()
        print("🎯 Recommendation:")
        print("   Start with 25 credits for $12/month")
        print("   Monitor usage and adjust if needed")
        print("   Consider higher tiers (50 credits for $20, 100 credits for $35)")
        print()
        
    finally:
        db.close()


if __name__ == "__main__":
    print("\n")
    analyze_usage_data()
    print("\n")


