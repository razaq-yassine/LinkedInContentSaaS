"""
Configure Stripe with branding (logo) and tax settings
Run this script to set up your Stripe account with proper branding
"""
import os
import sys
import stripe
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings

settings = get_settings()

def configure_stripe_branding():
    """Configure Stripe account with branding and settings"""
    
    if not settings.stripe_secret_key:
        print("❌ Error: STRIPE_SECRET_KEY not set in .env file")
        return False
    
    stripe.api_key = settings.stripe_secret_key
    
    print("🎨 Configuring Stripe Branding...")
    print("=" * 60)
    
    try:
        # Get current account
        account = stripe.Account.retrieve()
        print(f"✅ Connected to Stripe account: {account.id}")
        print(f"   Business name: {account.business_profile.name if account.business_profile else 'Not set'}")
        
        # Update account branding settings
        print("\n📝 Updating account settings...")
        
        update_params = {
            "business_profile": {
                "name": settings.company_name,
                "support_email": settings.support_email,
                "url": settings.company_website,
            },
            "settings": {
                "branding": {
                    "primary_color": "#0ea5e9",  # Cyan-500 color
                },
                "payments": {
                    "statement_descriptor": settings.company_name[:22],  # Max 22 chars
                }
            }
        }
        
        updated_account = stripe.Account.modify(account.id, **update_params)
        print(f"✅ Updated business profile")
        print(f"   Name: {settings.company_name}")
        print(f"   Support Email: {settings.support_email}")
        print(f"   Website: {settings.company_website}")
        
        # Enable automatic tax
        print("\n💰 Configuring tax settings...")
        try:
            # Check if tax settings are already configured
            tax_settings = stripe.tax.Settings.retrieve()
            print(f"✅ Tax settings already configured")
            print(f"   Status: {tax_settings.status}")
        except stripe.error.InvalidRequestError:
            print("⚠️  Automatic tax not enabled. You need to enable it in Stripe Dashboard:")
            print("   https://dashboard.stripe.com/settings/tax/activate")
            print("   This requires manual setup in the Stripe Dashboard.")
        
        print("\n" + "=" * 60)
        print("✅ Stripe configuration completed!")
        print("\n📋 Next steps:")
        print("1. Upload your logo in Stripe Dashboard:")
        print("   https://dashboard.stripe.com/settings/branding")
        print("\n2. Enable automatic tax (if not already enabled):")
        print("   https://dashboard.stripe.com/settings/tax/activate")
        print("\n3. Configure tax registration for your regions:")
        print("   https://dashboard.stripe.com/settings/tax/registrations")
        print("\n4. Test the checkout with: stripe listen --forward-to localhost:8000/api/subscription/webhook")
        
        return True
        
    except stripe.error.StripeError as e:
        print(f"\n❌ Stripe error: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False


def show_current_settings():
    """Display current Stripe settings"""
    
    if not settings.stripe_secret_key:
        print("❌ Error: STRIPE_SECRET_KEY not set in .env file")
        return
    
    stripe.api_key = settings.stripe_secret_key
    
    try:
        account = stripe.Account.retrieve()
        
        print("\n📊 Current Stripe Settings:")
        print("=" * 60)
        print(f"Account ID: {account.id}")
        print(f"Business Name: {account.business_profile.name if account.business_profile else 'Not set'}")
        print(f"Support Email: {account.business_profile.support_email if account.business_profile else 'Not set'}")
        print(f"Website: {account.business_profile.url if account.business_profile else 'Not set'}")
        
        if account.settings and account.settings.branding:
            print(f"Primary Color: {account.settings.branding.primary_color or 'Not set'}")
            print(f"Logo: {'Set' if account.settings.branding.logo else 'Not set'}")
            print(f"Icon: {'Set' if account.settings.branding.icon else 'Not set'}")
        
        # Check tax settings
        try:
            tax_settings = stripe.tax.Settings.retrieve()
            print(f"\nTax Settings:")
            print(f"  Status: {tax_settings.status}")
            print(f"  Default Behavior: {tax_settings.defaults.tax_behavior if tax_settings.defaults else 'Not set'}")
        except stripe.error.InvalidRequestError:
            print(f"\nTax Settings: Not configured")
        
        print("=" * 60)
        
    except stripe.error.StripeError as e:
        print(f"❌ Stripe error: {str(e)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Configure Stripe branding and settings")
    parser.add_argument("--show", action="store_true", help="Show current settings")
    parser.add_argument("--configure", action="store_true", help="Configure Stripe settings")
    
    args = parser.parse_args()
    
    if args.show:
        show_current_settings()
    elif args.configure:
        configure_stripe_branding()
    else:
        # Default: show and configure
        show_current_settings()
        print("\n")
        configure_stripe_branding()

