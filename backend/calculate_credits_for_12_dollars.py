"""
Calculate optimal credit amount for $12/month subscription
Using user-specified credit pricing and Cloudflare costs
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.services.cost_calculator import PRICING_TABLE


def calculate_credits_for_subscription():
    """Calculate how many credits to give for $12/month while staying profitable"""
    
    print("="*80)
    print("CREDIT CALCULATION FOR $12/MONTH SUBSCRIPTION")
    print("="*80)
    print()
    
    # USER-DEFINED CREDIT PRICING
    print("💳 YOUR CREDIT PRICING:")
    print("-" * 80)
    print("POST GENERATION:")
    print("  • Text-Only Post:          0.5 credits")
    print("  • Image + Text Post:       1.0 credits")
    print("  • Carousel Post:           2.5 credits")
    print("  • Video Script:            0.5 credits")
    print()
    print("REGENERATION:")
    print("  • Image Regeneration:      0.2 credits")
    print("  • Carousel Regeneration:   0.2 × number of images")
    print("  • Text Regeneration:       0.5 credits")
    print("  • Prompt Regeneration:     0.5 credits")
    print()
    print("AI FEATURES:")
    print("  • Search/Research:         FREE (covered)")
    print()
    
    # ACTUAL CLOUDFLARE COSTS
    print("="*80)
    print("💰 ACTUAL CLOUDFLARE COSTS")
    print("="*80)
    
    # Text generation costs (using cheap model as baseline)
    text_model = "gemini-1.5-flash"
    text_pricing = PRICING_TABLE[text_model]
    
    # Average tokens from our actual data analysis
    avg_text_input = 1203
    avg_text_output = 289
    avg_image_input = 1930
    avg_image_output = 531
    
    # Calculate text costs
    text_only_cost = (avg_text_input / 1_000_000) * text_pricing["input"] + (avg_text_output / 1_000_000) * text_pricing["output"]
    image_text_cost = (avg_image_input / 1_000_000) * text_pricing["input"] + (avg_image_output / 1_000_000) * text_pricing["output"]
    
    # Image generation costs (Cloudflare)
    single_image_cost = 0.026  # $0.026 per 1120x1120 image with 25 steps
    
    # Video script (similar to text)
    video_script_cost = text_only_cost
    
    # Search cost (you're covering it, so $0 to user but has cost to you)
    search_cost_paid = 0.005  # $0.005 per search on paid tier
    search_cost_free = 0.000  # Free tier
    
    print(f"Text-Only Post:              ${text_only_cost:.6f}")
    print(f"Image + Text Post:           ${image_text_cost + single_image_cost:.6f}")
    print(f"Carousel Post (4 images):    ${image_text_cost + (single_image_cost * 4):.6f}")
    print(f"Video Script:                ${video_script_cost:.6f}")
    print(f"Image Regeneration:          ${single_image_cost:.6f}")
    print(f"Carousel Regen (4 images):   ${single_image_cost * 4:.6f}")
    print(f"Text Regeneration:           ${text_only_cost:.6f}")
    print(f"Prompt Regeneration:         ${(500 / 1_000_000) * text_pricing['input'] + (200 / 1_000_000) * text_pricing['output']:.6f}")
    print(f"Search (you cover):          ${search_cost_free:.6f} (free tier) / ${search_cost_paid:.6f} (paid)")
    print()
    
    # COST PER CREDIT CALCULATION
    print("="*80)
    print("📊 COST PER CREDIT ANALYSIS")
    print("="*80)
    print()
    
    # Define your credit costs
    credits = {
        "text_post": 0.5,
        "image_post": 1.0,
        "carousel_post": 2.5,
        "video_script": 0.5,
        "image_regen": 0.2,
        "carousel_regen_per_image": 0.2,  # multiply by number of images
        "text_regen": 0.5,
        "prompt_regen": 0.5,
        "search": 0.0  # Free to user
    }
    
    # Define actual costs
    costs = {
        "text_post": text_only_cost,
        "image_post": image_text_cost + single_image_cost,
        "carousel_post": image_text_cost + (single_image_cost * 4),  # Assuming 4 images
        "video_script": video_script_cost,
        "image_regen": single_image_cost,
        "carousel_regen": single_image_cost * 4,  # 4 images
        "text_regen": text_only_cost,
        "prompt_regen": (500 / 1_000_000) * text_pricing["input"] + (200 / 1_000_000) * text_pricing["output"],
        "search": search_cost_free  # Using free tier
    }
    
    print(f"{'Feature':<30} {'Credits':<10} {'Actual Cost':<15} {'Cost per Credit':<20}")
    print("-" * 80)
    
    cost_per_credit_values = []
    
    for key in ["text_post", "image_post", "carousel_post", "video_script", 
                "image_regen", "carousel_regen", "text_regen", "prompt_regen"]:
        credit_amount = credits[key] if key != "carousel_regen" else credits["carousel_regen_per_image"] * 4
        actual_cost = costs[key]
        cost_per_credit = actual_cost / credit_amount if credit_amount > 0 else 0
        cost_per_credit_values.append(cost_per_credit)
        
        feature_name = key.replace("_", " ").title()
        if key == "carousel_regen":
            feature_name = "Carousel Regen (4 img)"
        
        print(f"{feature_name:<30} {credit_amount:<10.1f} ${actual_cost:<14.6f} ${cost_per_credit:<19.6f}")
    
    # Calculate average cost per credit
    avg_cost_per_credit = sum(cost_per_credit_values) / len(cost_per_credit_values)
    print()
    print(f"Average Cost per Credit: ${avg_cost_per_credit:.6f}")
    print()
    
    # USAGE SCENARIOS
    print("="*80)
    print("💡 USAGE SCENARIOS - CALCULATE OPTIMAL CREDIT AMOUNT")
    print("="*80)
    print()
    
    subscription_price = 12.00
    
    # Scenario 1: Text-focused user
    print("📝 SCENARIO 1: Text-Focused Creator")
    print("   Usage: 25 text posts + 3 image posts + 5 text regenerations")
    scenario1_credits = (25 * 0.5) + (3 * 1.0) + (5 * 0.5)
    scenario1_cost = (25 * text_only_cost) + (3 * (image_text_cost + single_image_cost)) + (5 * text_only_cost)
    print(f"   Credits Used: {scenario1_credits:.1f}")
    print(f"   Actual Cost: ${scenario1_cost:.4f}")
    print(f"   Revenue: ${subscription_price:.2f}")
    print(f"   Profit: ${subscription_price - scenario1_cost:.4f} ({((subscription_price - scenario1_cost) / subscription_price * 100):.1f}% margin)")
    print()
    
    # Scenario 2: Visual creator
    print("🖼️  SCENARIO 2: Visual Creator")
    print("   Usage: 5 text posts + 15 image posts + 10 image regenerations")
    scenario2_credits = (5 * 0.5) + (15 * 1.0) + (10 * 0.2)
    scenario2_cost = (5 * text_only_cost) + (15 * (image_text_cost + single_image_cost)) + (10 * single_image_cost)
    print(f"   Credits Used: {scenario2_credits:.1f}")
    print(f"   Actual Cost: ${scenario2_cost:.4f}")
    print(f"   Revenue: ${subscription_price:.2f}")
    print(f"   Profit: ${subscription_price - scenario2_cost:.4f} ({((subscription_price - scenario2_cost) / subscription_price * 100):.1f}% margin)")
    print()
    
    # Scenario 3: Premium creator
    print("📚 SCENARIO 3: Premium Creator (Carousels)")
    print("   Usage: 3 text + 2 image posts + 8 carousels + 2 carousel regenerations")
    scenario3_credits = (3 * 0.5) + (2 * 1.0) + (8 * 2.5) + (2 * 0.2 * 4)
    scenario3_cost = (3 * text_only_cost) + (2 * (image_text_cost + single_image_cost)) + \
                     (8 * (image_text_cost + single_image_cost * 4)) + (2 * single_image_cost * 4)
    print(f"   Credits Used: {scenario3_credits:.1f}")
    print(f"   Actual Cost: ${scenario3_cost:.4f}")
    print(f"   Revenue: ${subscription_price:.2f}")
    print(f"   Profit: ${subscription_price - scenario3_cost:.4f} ({((subscription_price - scenario3_cost) / subscription_price * 100):.1f}% margin)")
    print()
    
    # Scenario 4: Balanced creator
    print("⚖️  SCENARIO 4: Balanced Creator")
    print("   Usage: 10 text + 10 image + 3 carousels + 2 video scripts + 5 image regens")
    scenario4_credits = (10 * 0.5) + (10 * 1.0) + (3 * 2.5) + (2 * 0.5) + (5 * 0.2)
    scenario4_cost = (10 * text_only_cost) + (10 * (image_text_cost + single_image_cost)) + \
                     (3 * (image_text_cost + single_image_cost * 4)) + (2 * video_script_cost) + \
                     (5 * single_image_cost)
    print(f"   Credits Used: {scenario4_credits:.1f}")
    print(f"   Actual Cost: ${scenario4_cost:.4f}")
    print(f"   Revenue: ${subscription_price:.2f}")
    print(f"   Profit: ${subscription_price - scenario4_cost:.4f} ({((subscription_price - scenario4_cost) / subscription_price * 100):.1f}% margin)")
    print()
    
    # CALCULATE OPTIMAL CREDIT AMOUNT
    print("="*80)
    print("🎯 OPTIMAL CREDIT AMOUNT CALCULATION")
    print("="*80)
    print()
    
    # Calculate based on different margin targets
    target_margins = [80, 85, 90, 95]
    
    print(f"For ${subscription_price}/month subscription:")
    print()
    
    # Use mixed usage scenario (scenario 4) as baseline
    typical_credits_used = scenario4_credits
    typical_cost = scenario4_cost
    cost_per_credit_ratio = typical_cost / typical_credits_used
    
    print(f"Based on BALANCED CREATOR usage pattern:")
    print(f"  Credit usage: {typical_credits_used:.1f} credits")
    print(f"  Actual cost: ${typical_cost:.4f}")
    print(f"  Cost per credit: ${cost_per_credit_ratio:.6f}")
    print()
    
    print("-" * 80)
    print(f"{'Target Margin':<20} {'Max Credits':<15} {'Actual Cost':<15} {'Profit':<15}")
    print("-" * 80)
    
    recommendations = []
    
    for margin in target_margins:
        max_cost = subscription_price * (1 - margin / 100)
        max_credits = max_cost / cost_per_credit_ratio
        actual_profit = subscription_price - (max_credits * cost_per_credit_ratio)
        
        print(f"{margin}%{'':<17} {max_credits:<15.1f} ${max_credits * cost_per_credit_ratio:<14.4f} ${actual_profit:<14.4f}")
        recommendations.append({
            "margin": margin,
            "credits": max_credits,
            "cost": max_credits * cost_per_credit_ratio,
            "profit": actual_profit
        })
    
    print()
    
    # FINAL RECOMMENDATION
    print("="*80)
    print("✅ FINAL RECOMMENDATION")
    print("="*80)
    print()
    
    # Recommend 90% margin as sweet spot
    recommended = [r for r in recommendations if r["margin"] == 90][0]
    
    # Round to nice number
    credits_rounded_down = int(recommended["credits"] / 5) * 5  # Round to nearest 5
    credits_rounded_up = ((int(recommended["credits"]) // 5) + 1) * 5
    
    # Recalculate with rounded values
    cost_at_rounded_down = credits_rounded_down * cost_per_credit_ratio
    profit_at_rounded_down = subscription_price - cost_at_rounded_down
    margin_at_rounded_down = (profit_at_rounded_down / subscription_price) * 100
    
    cost_at_rounded_up = credits_rounded_up * cost_per_credit_ratio
    profit_at_rounded_up = subscription_price - cost_at_rounded_up
    margin_at_rounded_up = (profit_at_rounded_up / subscription_price) * 100
    
    print(f"💰 For ${subscription_price}/month subscription:")
    print()
    print(f"OPTION 1 (Conservative): {credits_rounded_down} CREDITS")
    print(f"  • Expected cost to you: ${cost_at_rounded_down:.4f}")
    print(f"  • Your profit: ${profit_at_rounded_down:.4f}")
    print(f"  • Profit margin: {margin_at_rounded_down:.1f}%")
    print(f"  • User gets: ~{int(credits_rounded_down / 0.5)} text posts OR ~{int(credits_rounded_down / 1.0)} image posts OR ~{int(credits_rounded_down / 2.5)} carousels")
    print()
    
    print(f"OPTION 2 (Generous): {credits_rounded_up} CREDITS")
    print(f"  • Expected cost to you: ${cost_at_rounded_up:.4f}")
    print(f"  • Your profit: ${profit_at_rounded_up:.4f}")
    print(f"  • Profit margin: {margin_at_rounded_up:.1f}%")
    print(f"  • User gets: ~{int(credits_rounded_up / 0.5)} text posts OR ~{int(credits_rounded_up / 1.0)} image posts OR ~{int(credits_rounded_up / 2.5)} carousels")
    print()
    
    # Show what users can create with recommended credits
    print("-" * 80)
    print(f"WITH {credits_rounded_down} CREDITS, USERS CAN CREATE:")
    print("-" * 80)
    
    examples = [
        {
            "name": "All Text Posts",
            "breakdown": f"{int(credits_rounded_down / 0.5)} text posts",
            "credits": int(credits_rounded_down / 0.5) * 0.5
        },
        {
            "name": "All Image Posts",
            "breakdown": f"{int(credits_rounded_down / 1.0)} image posts",
            "credits": int(credits_rounded_down / 1.0) * 1.0
        },
        {
            "name": "All Carousels",
            "breakdown": f"{int(credits_rounded_down / 2.5)} carousel posts",
            "credits": int(credits_rounded_down / 2.5) * 2.5
        },
        {
            "name": "Mixed Content",
            "breakdown": "8 text + 8 image + 2 carousels + 5 image regens",
            "credits": (8 * 0.5) + (8 * 1.0) + (2 * 2.5) + (5 * 0.2)
        }
    ]
    
    for example in examples:
        print(f"\n  {example['name']}:")
        print(f"    {example['breakdown']}")
        print(f"    Uses: {example['credits']:.1f} credits")
    
    print()
    print("="*80)
    print("🎯 RECOMMENDED: Give users **{0} CREDITS** for $12/month".format(credits_rounded_down))
    print("="*80)
    print()
    print("This provides:")
    print(f"  ✓ {margin_at_rounded_down:.0f}%+ profit margin")
    print(f"  ✓ 15-30+ posts per month (depending on type)")
    print(f"  ✓ Room for experimentation with regenerations")
    print(f"  ✓ Sustainable and scalable pricing")
    print()
    print("Your credit pricing structure encourages:")
    print("  ✓ More usage with cheap regenerations (0.2 credits)")
    print("  ✓ Experimentation with text/prompts (0.5 credits)")
    print("  ✓ Premium content creation (carousels at 2.5 credits)")
    print("  ✓ Video script generation (0.5 credits)")
    print()


if __name__ == "__main__":
    print("\n")
    calculate_credits_for_subscription()
    print("\n")


