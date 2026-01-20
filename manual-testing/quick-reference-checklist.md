# Quick Reference Testing Checklist

Use this checklist for quick verification during testing.

## Pre-Testing Setup
- [ ] Backend server running
- [ ] Frontend application running
- [ ] Database migrated
- [ ] Stripe test mode enabled
- [ ] Test accounts created
- [ ] Admin settings configured

## Critical Path Tests (Must Pass)

### Upgrade Flow
- [ ] Free → Paid: Credits reset to new plan limit
- [ ] Paid → Higher Paid: Credits preserved, new credits added
- [ ] Upgrade consent modal displays correctly
- [ ] Stripe checkout completes successfully
- [ ] Subscription status updates correctly
- [ ] Notification sent

### Downgrade Flow
- [ ] Paid → Free: Scheduled correctly
- [ ] Premium features remain until period end
- [ ] Credits preserved until period end
- [ ] At period end: Plan changes to Free
- [ ] Subscription credits reset to free limit
- [ ] Purchased credits remain unchanged
- [ ] Notifications sent (scheduled + completed)

### Credit Purchase Flow
- [ ] Purchase modal displays for paid users
- [ ] Purchase modal hidden for free users
- [ ] Price calculations correct
- [ ] Bulk discounts apply correctly
- [ ] Max purchase limit enforced
- [ ] Stripe checkout completes
- [ ] Credits added to purchased balance
- [ ] Notification sent

### Credit Usage
- [ ] Subscription credits used first
- [ ] Purchased credits used after subscription exhausted
- [ ] Credit breakdown displays correctly
- [ ] Monthly reset works (subscription only)
- [ ] Purchased credits never reset

### Admin Settings
- [ ] Credit pricing settings save correctly
- [ ] Purchase steps configurable
- [ ] Bulk discounts configurable
- [ ] Max purchase configurable
- [ ] Enable/disable toggle works

### UI/UX
- [ ] Consent modals display correctly
- [ ] Billing page shows credit breakdown
- [ ] Mobile responsive
- [ ] Error messages clear
- [ ] Loading states work

## Edge Cases
- [ ] Purchase without paid plan (blocked)
- [ ] Purchase when disabled (error shown)
- [ ] Exceed max purchase (error shown)
- [ ] Stripe payment failure (error handled)
- [ ] Upgrade during downgrade period (works)
- [ ] Multiple rapid upgrades (works)

## Regression Checks
- [ ] Existing subscriptions work
- [ ] Post generation deducts credits
- [ ] Credit tracking accurate
- [ ] Admin panel functional
- [ ] API endpoints return correct data

## Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari
- [ ] Chrome Mobile

---

**Quick Status:**
- ✅ All Critical Tests Passed
- ⚠️ Some Issues Found
- ❌ Critical Tests Failed
