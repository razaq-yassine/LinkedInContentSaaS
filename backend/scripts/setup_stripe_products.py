"""
Script to create Stripe products and prices, then update subscription plan configs with Stripe IDs

Run this script once during deployment after setting up Stripe credentials.

Usage:
    python -m scripts.setup_stripe_products
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import stripe
from app.config import get_settings
from app.database import SessionLocal
from app.models import SubscriptionPlanConfig

settings = get_settings()
stripe.api_key = settings.stripe_secret_key


def create_stripe_product_and_prices(plan_config):
    """
    Create Stripe product and prices for a subscription plan
    
    Args:
        plan_config: SubscriptionPlanConfig object
    
    Returns:
        Dict with product_id, price_id_monthly, price_id_yearly
    """
    print(f"\nCreating Stripe product for: {plan_config.display_name}")
    
    # Skip free plan
    if plan_config.price_monthly == 0 and plan_config.price_yearly == 0:
        print("  -> Skipping free plan")
        return None
    
    try:
        # Create product
        product = stripe.Product.create(
            name=plan_config.display_name,
            description=plan_config.description or f"{plan_config.credits_limit} credits per month",
            metadata={
                "plan_name": plan_config.plan_name,
                "credits_limit": plan_config.credits_limit
            }
        )
        print(f"  ✓ Created product: {product.id}")
        
        # Create monthly price
        price_monthly = None
        if plan_config.price_monthly > 0:
            price_monthly = stripe.Price.create(
                product=product.id,
                unit_amount=plan_config.price_monthly,  # Amount in cents
                currency="usd",
                recurring={"interval": "month"},
                metadata={
                    "plan_name": plan_config.plan_name,
                    "billing_cycle": "monthly"
                }
            )
            print(f"  ✓ Created monthly price: {price_monthly.id} (${plan_config.price_monthly/100}/month)")
        
        # Create yearly price
        price_yearly = None
        if plan_config.price_yearly > 0:
            price_yearly = stripe.Price.create(
                product=product.id,
                unit_amount=plan_config.price_yearly,  # Amount in cents
                currency="usd",
                recurring={"interval": "year"},
                metadata={
                    "plan_name": plan_config.plan_name,
                    "billing_cycle": "yearly"
                }
            )
            print(f"  ✓ Created yearly price: {price_yearly.id} (${plan_config.price_yearly/100}/year)")
        
        return {
            "product_id": product.id,
            "price_id_monthly": price_monthly.id if price_monthly else None,
            "price_id_yearly": price_yearly.id if price_yearly else None
        }
    
    except stripe.error.StripeError as e:
        print(f"  ✗ Error creating Stripe resources: {str(e)}")
        return None


def update_plan_config_with_stripe_ids(db, plan_config, stripe_ids):
    """
    Update subscription plan config with Stripe IDs
    
    Args:
        db: Database session
        plan_config: SubscriptionPlanConfig object
        stripe_ids: Dict with product_id, price_id_monthly, price_id_yearly
    """
    if not stripe_ids:
        return
    
    plan_config.stripe_product_id = stripe_ids["product_id"]
    plan_config.stripe_price_id_monthly = stripe_ids["price_id_monthly"]
    plan_config.stripe_price_id_yearly = stripe_ids["price_id_yearly"]
    
    db.commit()
    print(f"  ✓ Updated plan config with Stripe IDs")


def main():
    """Main function to setup Stripe products"""
    print("=" * 60)
    print("Stripe Products Setup")
    print("=" * 60)
    
    # Check if Stripe is configured
    if not settings.stripe_secret_key or settings.stripe_secret_key == "":
        print("\n❌ Error: Stripe secret key not configured")
        print("Please set STRIPE_SECRET_KEY in your .env file")
        return
    
    print(f"\n✓ Using Stripe API key: {settings.stripe_secret_key[:7]}...")
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Get all active plans
        plans = db.query(SubscriptionPlanConfig).filter(
            SubscriptionPlanConfig.is_active == True
        ).order_by(SubscriptionPlanConfig.sort_order).all()
        
        print(f"\nFound {len(plans)} active subscription plans")
        
        for plan in plans:
            # Check if already has Stripe IDs
            if plan.stripe_product_id:
                print(f"\n{plan.display_name}")
                print(f"  ⚠ Already has Stripe product ID: {plan.stripe_product_id}")
                print(f"  Skipping...")
                continue
            
            # Create Stripe product and prices
            stripe_ids = create_stripe_product_and_prices(plan)
            
            # Update plan config
            if stripe_ids:
                update_plan_config_with_stripe_ids(db, plan, stripe_ids)
        
        print("\n" + "=" * 60)
        print("✓ Stripe setup completed successfully!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Set up webhook endpoint in Stripe Dashboard:")
        print(f"   URL: {settings.frontend_url}/api/subscription/webhook")
        print("2. Add webhook secret to .env file:")
        print("   STRIPE_WEBHOOK_SECRET=whsec_...")
        print("3. Test checkout flow in your application")
        print("\n")
    
    except Exception as e:
        print(f"\n❌ Error during setup: {str(e)}")
        db.rollback()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()

