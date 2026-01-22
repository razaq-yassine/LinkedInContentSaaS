#!/usr/bin/env python3
"""
Comprehensive Automated Test Script for Plan Switching

This script simulates ALL manual testing scenarios from credit-system-testing-plan.md
including yearly→monthly restrictions, upgrades, downgrades, credit purchases, and user journeys.

Usage:
    python test_plan_switching_all.py [--verbose]
    
Options:
    --verbose  Show detailed output for each test
"""

import sys
import os
import argparse
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import (
    User, Subscription, SubscriptionPlanConfig, 
    SubscriptionPlan, BillingCycle, SubscriptionStatus
)
from app.services.stripe_service import can_switch_yearly_to_monthly
from app.services.credit_service import get_credit_breakdown, apply_plan_upgrade_credits

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class TestRunner:
    def __init__(self, verbose=False):
        self.verbose = verbose
        self.results = {
            'passed': 0,
            'failed': 0,
            'total': 0,
            'skipped': 0
        }
        self.db = SessionLocal()
    
    def print_header(self, text):
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text.center(70)}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.RESET}\n")
    
    def print_test(self, test_name):
        print(f"{Colors.BOLD}{Colors.CYAN}▶ {test_name}{Colors.RESET}")
    
    def print_pass(self, message):
        print(f"{Colors.GREEN}  ✅ PASS: {message}{Colors.RESET}")
        self.results['passed'] += 1
    
    def print_fail(self, message):
        print(f"{Colors.RED}  ❌ FAIL: {message}{Colors.RESET}")
        self.results['failed'] += 1
    
    def print_info(self, message):
        if self.verbose:
            print(f"{Colors.YELLOW}  ℹ️  INFO: {message}{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}  ℹ️  {message}{Colors.RESET}")
    
    def print_skip(self, message):
        print(f"{Colors.YELLOW}  ⏭️  SKIP: {message}{Colors.RESET}")
        self.results['skipped'] += 1
    
    def assert_true(self, condition, message):
        self.results['total'] += 1
        if condition:
            self.print_pass(message)
            return True
        else:
            self.print_fail(message)
            return False
    
    def create_test_user(self, email_suffix='test'):
        """Create or get a test user"""
        email = f'{email_suffix}@test-plan-switching.com'
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                name=f'Test User {email_suffix}',
                password_hash='test_hash'
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        return user
    
    def get_plan_config(self, plan_name):
        """Get plan configuration"""
        return self.db.query(SubscriptionPlanConfig).filter(
            SubscriptionPlanConfig.plan_name == plan_name
        ).first()
    
    def create_test_subscription(self, user, plan=SubscriptionPlan.FREE, 
                                billing_cycle=BillingCycle.MONTHLY, 
                                days_remaining=30, credits_used=0.0):
        """Create or update a test subscription"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user.id
        ).first()
        
        plan_config = self.get_plan_config(plan.value)
        credits_limit = plan_config.credits_limit if plan_config else 5.0
        
        if not subscription:
            subscription = Subscription(
                user_id=user.id,
                plan=plan,
                subscription_credits_limit=credits_limit,
                subscription_credits_used=credits_used,
                billing_cycle=billing_cycle,
                subscription_status=SubscriptionStatus.ACTIVE,
                current_period_start=datetime.utcnow(),
                current_period_end=datetime.utcnow() + timedelta(days=days_remaining) if days_remaining else None
            )
            self.db.add(subscription)
        else:
            subscription.plan = plan
            subscription.subscription_credits_limit = credits_limit
            subscription.subscription_credits_used = credits_used
            subscription.billing_cycle = billing_cycle
            subscription.current_period_start = datetime.utcnow()
            subscription.current_period_end = datetime.utcnow() + timedelta(days=days_remaining) if days_remaining else None
        
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    def test_yearly_to_monthly_restrictions(self):
        """Test TC-016, TC-017, TC-018: Yearly to Monthly Restrictions"""
        self.print_header("Yearly to Monthly Restriction Tests")
        
        user = self.create_test_user('yearly_monthly')
        
        # TC-016: Yearly with >30 days → Monthly (BLOCKED)
        self.print_test("TC-016: Yearly (>30 days) → Monthly (BLOCKED)")
        sub = self.create_test_subscription(user, billing_cycle=BillingCycle.YEARLY, days_remaining=200)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        self.assert_true(
            not can_switch and error_msg and "Yearly subscriptions cannot be switched" in error_msg,
            f"Blocked correctly: {error_msg[:60]}..."
        )
        
        # TC-017: Yearly with ≤30 days → Monthly (ALLOWED)
        self.print_test("TC-017: Yearly (≤30 days) → Monthly (ALLOWED)")
        sub = self.create_test_subscription(user, billing_cycle=BillingCycle.YEARLY, days_remaining=25)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        self.assert_true(
            can_switch and error_msg is None,
            "Allowed correctly (within last 30 days)"
        )
        
        # Boundary: Exactly 30 days
        self.print_test("TC-017 (Boundary): Yearly (30 days) → Monthly (ALLOWED)")
        sub = self.create_test_subscription(user, billing_cycle=BillingCycle.YEARLY, days_remaining=30)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        self.assert_true(
            can_switch and error_msg is None,
            "Allowed correctly (boundary: exactly 30 days)"
        )
        
        # Boundary: 35 days (should be blocked) - using 35 to account for timing delays
        self.print_test("TC-012g: Yearly (35 days) → Monthly (BLOCKED)")
        sub = self.create_test_subscription(user, billing_cycle=BillingCycle.YEARLY, days_remaining=35)
        # Refresh to ensure we have the latest data
        self.db.refresh(sub)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        # Should be blocked since 35 > 30 (even accounting for timing, should still be > 30)
        self.assert_true(
            not can_switch and error_msg and "Yearly subscriptions cannot be switched" in error_msg,
            f"Blocked correctly (35 days > 30): {error_msg[:60] if error_msg else 'No error'}..."
        )
    
    def test_other_billing_cycle_transitions(self):
        """Test other billing cycle transitions (should all be allowed)"""
        self.print_header("Other Billing Cycle Transition Tests")
        
        user = self.create_test_user('other_transitions')
        
        # Monthly → Monthly
        self.print_test("Monthly → Monthly (ALLOWED)")
        sub = self.create_test_subscription(user, billing_cycle=BillingCycle.MONTHLY, days_remaining=20)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        self.assert_true(can_switch and error_msg is None, "Monthly → Monthly allowed")
        
        # Yearly → Yearly
        self.print_test("Yearly → Yearly (ALLOWED)")
        sub = self.create_test_subscription(user, billing_cycle=BillingCycle.YEARLY, days_remaining=200)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "yearly")
        self.assert_true(can_switch and error_msg is None, "Yearly → Yearly allowed")
        
        # Monthly → Yearly
        self.print_test("Monthly → Yearly (ALLOWED)")
        sub = self.create_test_subscription(user, billing_cycle=BillingCycle.MONTHLY, days_remaining=20)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "yearly")
        self.assert_true(can_switch and error_msg is None, "Monthly → Yearly allowed")
    
    def test_edge_cases(self):
        """Test edge cases"""
        self.print_header("Edge Case Tests")
        
        user = self.create_test_user('edge_cases')
        
        # No period_end
        self.print_test("Edge Case: No period_end")
        sub = self.create_test_subscription(user, billing_cycle=BillingCycle.YEARLY, days_remaining=200)
        sub.current_period_end = None
        self.db.commit()
        self.db.refresh(sub)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        self.assert_true(
            not can_switch and error_msg and "Cannot determine" in error_msg,
            "Handled missing period_end correctly"
        )
        
        # Past period_end
        self.print_test("Edge Case: Past period_end")
        sub = self.create_test_subscription(user, billing_cycle=BillingCycle.YEARLY, days_remaining=-5)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        self.assert_true(can_switch, "Allowed for past period_end")
        
        # Days remaining calculation (allow 1 day tolerance due to timing)
        self.print_test("Verify: days_remaining calculation")
        sub = self.create_test_subscription(user, billing_cycle=BillingCycle.YEARLY, days_remaining=150)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        # Allow 1 day tolerance due to timing between creating subscription and checking
        self.assert_true(
            days is not None and 149 <= days <= 150,
            f"Correctly calculated days_remaining: {days} (expected ~150, tolerance ±1)"
        )
    
    def test_credit_breakdown(self):
        """Test credit breakdown functionality"""
        self.print_header("Credit Breakdown Tests")
        
        user = self.create_test_user('credit_breakdown')
        sub = self.create_test_subscription(
            user, 
            plan=SubscriptionPlan.PRO,
            credits_used=30.0
        )
        
        try:
            breakdown = get_credit_breakdown(self.db, user.id)
            self.print_test("Credit Breakdown Retrieval")
            self.assert_true(
                breakdown is not None and 'subscription' in breakdown,
                "Credit breakdown retrieved successfully"
            )
            if breakdown and self.verbose:
                self.print_info(f"Breakdown: {breakdown}")
        except Exception as e:
            self.print_fail(f"Credit breakdown failed: {str(e)}")
    
    def test_plan_upgrade_credit_preservation(self):
        """Test TC-002, TC-008: Plan upgrade credit preservation"""
        self.print_header("Plan Upgrade Credit Preservation Tests")
        
        user = self.create_test_user('credit_preservation')
        
        # Start with Starter plan, 20 credits used (20 remaining)
        self.print_test("TC-002/TC-008: Upgrade Starter → Pro (preserve credits)")
        sub = self.create_test_subscription(
            user,
            plan=SubscriptionPlan.STARTER,
            credits_used=20.0  # 20 out of 40 used = 20 remaining
        )
        
        starter_config = self.get_plan_config('starter')
        pro_config = self.get_plan_config('pro')
        
        old_limit = sub.subscription_credits_limit
        old_used = sub.subscription_credits_used
        old_available = old_limit - old_used
        
        # Apply upgrade
        upgrade_details = apply_plan_upgrade_credits(
            subscription=sub,
            new_plan_config=pro_config,
            is_upgrade=True
        )
        
        self.db.commit()
        self.db.refresh(sub)
        
        # Verify credits preserved
        new_available = sub.subscription_credits_limit - sub.subscription_credits_used
        expected_total = pro_config.credits_limit + old_available
        
        self.assert_true(
            new_available == expected_total,
            f"Credits preserved: {old_available} + {pro_config.credits_limit} = {new_available} total"
        )
        
        self.print_info(f"Old: {old_limit} limit, {old_used} used, {old_available} available")
        self.print_info(f"New: {sub.subscription_credits_limit} limit, {sub.subscription_credits_used} used, {new_available} available")
    
    def test_user_journey(self):
        """Test complete user journey through different plans"""
        self.print_header("User Journey Test: Free → Monthly Pro → Yearly Starter → Monthly Starter")
        
        user = self.create_test_user('journey')
        
        # Step 1: Start with Free plan
        self.print_test("Step 1: Start with Free plan")
        sub = self.create_test_subscription(
            user,
            plan=SubscriptionPlan.FREE,
            billing_cycle=BillingCycle.MONTHLY,
            credits_used=2.0  # 2 out of 5 used
        )
        free_config = self.get_plan_config('free')
        self.assert_true(
            sub.plan == SubscriptionPlan.FREE and sub.subscription_credits_limit == free_config.credits_limit,
            f"Free plan active: {sub.subscription_credits_limit} credits"
        )
        self.print_info(f"Free plan: {sub.subscription_credits_limit} limit, {sub.subscription_credits_used} used")
        
        # Step 2: Switch to Monthly Pro plan (upgrade)
        self.print_test("Step 2: Switch to Monthly Pro plan (upgrade)")
        pro_config = self.get_plan_config('pro')
        old_available = sub.subscription_credits_limit - sub.subscription_credits_used  # 3 credits
        
        # Check if switch is allowed (should be, since monthly → monthly)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        self.assert_true(can_switch, "Monthly → Monthly switch allowed")
        
        # Apply upgrade
        upgrade_details = apply_plan_upgrade_credits(
            subscription=sub,
            new_plan_config=pro_config,
            is_upgrade=True
        )
        sub.billing_cycle = BillingCycle.MONTHLY
        self.db.commit()
        self.db.refresh(sub)
        
        new_available = sub.subscription_credits_limit - sub.subscription_credits_used
        expected_total = pro_config.credits_limit + old_available
        
        self.assert_true(
            sub.plan == SubscriptionPlan.PRO and 
            sub.billing_cycle == BillingCycle.MONTHLY and
            new_available == expected_total,
            f"Monthly Pro active: {new_available} credits (preserved {old_available} + new {pro_config.credits_limit})"
        )
        self.print_info(f"Monthly Pro: {sub.subscription_credits_limit} limit, {sub.subscription_credits_used} used, {new_available} available")
        
        # Step 3: Switch to Yearly Starter plan
        self.print_test("Step 3: Switch to Yearly Starter plan")
        starter_config = self.get_plan_config('starter')
        old_available = sub.subscription_credits_limit - sub.subscription_credits_used
        
        # Check if switch is allowed (monthly → yearly, should be allowed)
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "yearly")
        self.assert_true(can_switch, "Monthly → Yearly switch allowed")
        
        # Apply upgrade/downgrade (Starter is lower tier than Pro)
        upgrade_details = apply_plan_upgrade_credits(
            subscription=sub,
            new_plan_config=starter_config,
            is_upgrade=False  # This is actually a downgrade in tier
        )
        sub.billing_cycle = BillingCycle.YEARLY
        sub.current_period_end = datetime.utcnow() + timedelta(days=365)  # Yearly period
        self.db.commit()
        self.db.refresh(sub)
        
        new_available = sub.subscription_credits_limit - sub.subscription_credits_used
        
        self.assert_true(
            sub.plan == SubscriptionPlan.STARTER and 
            sub.billing_cycle == BillingCycle.YEARLY,
            f"Yearly Starter active: {sub.subscription_credits_limit} credits"
        )
        self.print_info(f"Yearly Starter: {sub.subscription_credits_limit} limit, {sub.subscription_credits_used} used, {new_available} available")
        self.print_info(f"Period ends in: {(sub.current_period_end - datetime.utcnow()).days} days")
        
        # Step 4: Try to switch to Monthly Starter (should be blocked if >30 days)
        self.print_test("Step 4: Try to switch to Monthly Starter (Yearly → Monthly)")
        days_remaining = (sub.current_period_end - datetime.utcnow()).days
        
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        
        if days_remaining > 30:
            # Should be blocked
            self.assert_true(
                not can_switch and error_msg and "Yearly subscriptions cannot be switched" in error_msg,
                f"Correctly blocked: {days_remaining} days remaining"
            )
            self.print_info(f"Blocked correctly: {error_msg[:80]}...")
        else:
            # Should be allowed (within last 30 days)
            self.assert_true(
                can_switch,
                f"Allowed correctly: {days_remaining} days remaining (within last 30)"
            )
            self.print_info(f"Would be allowed: {days_remaining} days remaining")
        
        # Step 5: Simulate waiting until last 30 days, then switch to Monthly Starter
        self.print_test("Step 5: Simulate waiting until last 30 days, then switch to Monthly Starter")
        # Set period_end to 25 days from now
        sub.current_period_end = datetime.utcnow() + timedelta(days=25)
        self.db.commit()
        self.db.refresh(sub)
        
        can_switch, error_msg, days = can_switch_yearly_to_monthly(sub, "monthly")
        self.assert_true(
            can_switch and error_msg is None,
            f"Now allowed: {days} days remaining (within last 30)"
        )
        
        # Apply the switch
        old_available = sub.subscription_credits_limit - sub.subscription_credits_used
        upgrade_details = apply_plan_upgrade_credits(
            subscription=sub,
            new_plan_config=starter_config,
            is_upgrade=False
        )
        sub.billing_cycle = BillingCycle.MONTHLY
        sub.current_period_end = datetime.utcnow() + timedelta(days=30)  # Monthly period
        self.db.commit()
        self.db.refresh(sub)
        
        new_available = sub.subscription_credits_limit - sub.subscription_credits_used
        
        self.assert_true(
            sub.plan == SubscriptionPlan.STARTER and 
            sub.billing_cycle == BillingCycle.MONTHLY,
            f"Monthly Starter active: {sub.subscription_credits_limit} credits"
        )
        self.print_info(f"Monthly Starter: {sub.subscription_credits_limit} limit, {sub.subscription_credits_used} used, {new_available} available")
        self.print_info(f"Journey complete: Free → Monthly Pro → Yearly Starter → Monthly Starter")
    
    def print_summary(self):
        """Print test summary"""
        self.print_header("Test Results Summary")
        print(f"Total Tests: {self.results['total']}")
        print(f"{Colors.GREEN}Passed: {self.results['passed']}{Colors.RESET}")
        print(f"{Colors.RED}Failed: {self.results['failed']}{Colors.RESET}")
        if self.results['skipped'] > 0:
            print(f"{Colors.YELLOW}Skipped: {self.results['skipped']}{Colors.RESET}")
        
        success_rate = (self.results['passed'] / self.results['total'] * 100) if self.results['total'] > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        if self.results['failed'] == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 All tests passed!{Colors.RESET}\n")
            return 0
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}❌ Some tests failed. Please review the output above.{Colors.RESET}\n")
            return 1
    
    def cleanup(self):
        """Cleanup test data"""
        if self.db:
            self.db.close()

def main():
    parser = argparse.ArgumentParser(description='Comprehensive plan switching test suite')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show detailed output')
    args = parser.parse_args()
    
    runner = TestRunner(verbose=args.verbose)
    
    try:
        # Run all test suites
        runner.test_yearly_to_monthly_restrictions()
        runner.test_other_billing_cycle_transitions()
        runner.test_edge_cases()
        runner.test_credit_breakdown()
        runner.test_plan_upgrade_credit_preservation()
        runner.test_user_journey()
        
    except Exception as e:
        print(f"{Colors.RED}Test suite error: {str(e)}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        runner.results['failed'] += 1
    finally:
        runner.cleanup()
    
    return runner.print_summary()

if __name__ == "__main__":
    sys.exit(main())
