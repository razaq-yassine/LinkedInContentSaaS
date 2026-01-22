# Test Case to Shared Function Mapping

This document maps each test case from `credit-system-testing-plan.md` to the shared functions that implement the functionality.

## ✅ Fully Covered by Shared Functions

### TC-001: Free to Paid Plan Upgrade
**Shared Function:** `credit_service.apply_plan_upgrade_credits()`
- **Location:** `backend/app/services/credit_service.py`
- **Used by:** 
  - `stripe_service.handle_checkout_completed()` (production)
  - `test_subscription.simulate_subscription_completion()` (test)
- **Status:** ✅ Fully shared

### TC-002: Paid to Higher Paid Plan Upgrade  
**Shared Function:** `credit_service.apply_plan_upgrade_credits()`
- **Location:** `backend/app/services/credit_service.py`
- **Used by:**
  - `stripe_service.handle_checkout_completed()` (production)
  - `stripe_service.handle_upgrade()` (production)
  - `test_subscription.simulate_subscription_completion()` (test)
- **Status:** ✅ Fully shared

### TC-003: Paid to Free Plan Downgrade
**Shared Function:** `stripe_service.handle_downgrade_to_free()`
- **Location:** `backend/app/services/stripe_service.py`
- **Used by:**
  - `subscription.downgrade_subscription()` (API endpoint)
- **Status:** ✅ Shared (single implementation)

### TC-004: Credit Purchase - Single Purchase
**Shared Functions:**
- `credit_purchase_service.create_credit_purchase_checkout()` - Creates checkout
- `credit_purchase_service.handle_credit_purchase_completed()` - Processes completion
- `credit_service.add_purchased_credits()` - Adds credits to balance
- **Location:** `backend/app/services/credit_purchase_service.py`, `credit_service.py`
- **Used by:**
  - `credit_purchase.create_credit_purchase()` (API endpoint)
  - `credit_purchase.handle_credit_purchase_webhook()` (webhook handler)
- **Status:** ✅ Fully shared

### TC-005: Credit Purchase - Bulk Discount
**Shared Function:** `credit_purchase_service.calculate_bulk_discount()`
- **Location:** `backend/app/services/credit_purchase_service.py`
- **Used by:**
  - `credit_purchase_service.create_credit_purchase_checkout()` (internal)
  - Frontend pricing display
- **Status:** ✅ Fully shared

### TC-006: Credit Usage Priority
**Shared Function:** `credit_service.deduct_credits_v2()`
- **Location:** `backend/app/services/credit_service.py`
- **Logic:** Uses subscription credits first, then purchased credits
- **Used by:**
  - All credit deduction operations (post creation, image generation, etc.)
- **Status:** ✅ Fully shared

### TC-007: Monthly Credit Reset
**Shared Function:** `credit_service.reset_subscription_credits()`
- **Location:** `backend/app/services/credit_service.py`
- **Used by:**
  - `stripe_service.handle_invoice_paid()` (production webhook)
  - Can be called manually for testing
- **Status:** ✅ Fully shared

### TC-008: Upgrade Credit Preservation
**Shared Function:** `credit_service.apply_plan_upgrade_credits()`
- **Location:** `backend/app/services/credit_service.py`
- **Same as:** TC-002 (uses same function)
- **Status:** ✅ Fully shared

### TC-009: Downgrade Period End Behavior
**Shared Function:** `stripe_service.handle_subscription_deleted()`
- **Location:** `backend/app/services/stripe_service.py`
- **Used by:**
  - Stripe webhook handler for `customer.subscription.deleted`
- **Status:** ✅ Shared (single implementation)

## ⚠️ Partially Covered / Not Shared Functions

### TC-010: Admin Credit Pricing Settings
**Functions:** Admin endpoints in `routers/admin.py`
- **Status:** ⚠️ Not shared (admin-only, single implementation is appropriate)
- **Note:** Uses shared functions internally (`get_credit_pricing()`)

### TC-011: Notification System
**Function:** `notification_service.send_notification()`
- **Location:** `backend/app/services/notification_service.py`
- **Status:** ✅ Fully shared (used by all services)

### TC-012: Edge Cases & Error Handling
**Functions:** Various shared functions with error handling
- **Status:** ✅ Covered by shared functions (error handling is built-in)

### TC-013: UI/UX Consent Modals
**Components:** Frontend React components
- **Location:** `frontend/components/modals/`
- **Status:** ⚠️ Frontend only (not backend functions)

### TC-014: Billing Page Display
**Components:** Frontend React components
- **Location:** `frontend/app/(dashboard)/billing/page.tsx`
- **Status:** ⚠️ Frontend only (not backend functions)

### TC-015: Stripe Integration
**Functions:** Multiple shared functions in `stripe_service.py`
- **Status:** ✅ Fully shared

## Summary

### ✅ Fully Shared Backend Functions (9/15 test cases)
1. `apply_plan_upgrade_credits()` - TC-001, TC-002, TC-008
2. `handle_downgrade_to_free()` - TC-003
3. `create_credit_purchase_checkout()` - TC-004
4. `handle_credit_purchase_completed()` - TC-004
5. `add_purchased_credits()` - TC-004
6. `calculate_bulk_discount()` - TC-005
7. `deduct_credits_v2()` - TC-006
8. `reset_subscription_credits()` - TC-007
9. `handle_subscription_deleted()` - TC-009

### ⚠️ Single Implementation (Appropriate)
- Admin endpoints (TC-010) - Admin-only, doesn't need sharing
- Notification service (TC-011) - Already shared
- Stripe integration (TC-015) - Already shared

### ⚠️ Frontend Only (Not Applicable)
- Consent modals (TC-013) - UI components
- Billing page (TC-014) - UI components

## Conclusion

**✅ YES - All critical backend test cases are covered by shared functions!**

- **9 core test cases** (TC-001 through TC-009) are fully implemented using shared functions
- **Test and production code** use the same shared functions
- **Credit preservation logic** is centralized in `apply_plan_upgrade_credits()`
- **Credit usage priority** is centralized in `deduct_credits_v2()`
- **Credit purchases** use shared functions throughout

The refactoring successfully ensures that:
1. Test endpoints use the same logic as production
2. All upgrade/downgrade logic is centralized
3. Credit operations are consistent across the codebase
4. Changes to credit logic only need to be made in one place
