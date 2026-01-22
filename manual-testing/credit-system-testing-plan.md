# Credit System & Plan Switching - Manual Testing Plan

**Project:** LinkedIn Content SaaS  
**Feature:** Dual Credit System & Plan Switching  
**Date Created:** 2025-01-20  
**Status:** Ready for Testing

---

## Test Execution Status Tracker

| Test ID | Test Case                         | Priority | Status     | Tester | Date | Notes |
| ------- | --------------------------------- | -------- | ---------- | ------ | ---- | ----- |
| TC-001  | Free to Paid Plan Upgrade         | High     | ⏳ Pending |        |      |       |
| TC-002  | Paid to Higher Paid Plan Upgrade  | High     | ⏳ Pending |        |      |       |
| TC-003  | Paid to Free Plan Downgrade       | High     | ⏳ Pending |        |      |       |
| TC-004  | Credit Purchase - Single Purchase | High     | ⏳ Pending |        |      |       |
| TC-005  | Credit Purchase - Bulk Discount   | High     | ⏳ Pending |        |      |       |
| TC-006  | Credit Usage Priority             | High     | ⏳ Pending |        |      |       |
| TC-007  | Monthly Credit Reset              | High     | ⏳ Pending |        |      |       |
| TC-008  | Upgrade Credit Preservation       | High     | ⏳ Pending |        |      |       |
| TC-009  | Downgrade Period End Behavior     | High     | ⏳ Pending |        |      |       |
| TC-010  | Admin Credit Pricing Settings     | Medium   | ⏳ Pending |        |      |       |
| TC-011  | Notification System               | Medium   | ⏳ Pending |        |      |       |
| TC-012  | Edge Cases & Error Handling       | Medium   | ⏳ Pending |        |      |       |
| TC-013  | UI/UX Consent Modals              | Medium   | ⏳ Pending |        |      |       |
| TC-014  | Billing Page Display              | Medium   | ⏳ Pending |        |      |       |
| TC-015  | Stripe Integration                | High     | ⏳ Pending |        |      |       |
| TC-016  | Yearly to Monthly Restriction - Early Period | High | ⏳ Pending |        |      |       |
| TC-017  | Yearly to Monthly Restriction - Last 30 Days | High | ⏳ Pending |        |      |       |
| TC-018  | Yearly to Monthly Restriction - Credit Purchase Alternative | High | ⏳ Pending |        |      |       |

**Legend:**

- ⏳ Pending
- ✅ Passed
- ❌ Failed
- 🔄 In Progress
- ⚠️ Blocked

---

## Test Environment Setup

### Prerequisites

- [ ] Backend server running
- [ ] Frontend application running
- [ ] Stripe test mode enabled
- [ ] Database migrated to latest version
- [ ] Admin user account created
- [ ] Test user accounts created (Free, Starter, Pro, Unlimited)
- [ ] Stripe test cards available

### Test Accounts

- **Admin User:** admin@test.com
- **Free User:** free@test.com
- **Starter User:** starter@test.com
- **Pro User:** pro@test.com
- **Unlimited User:** unlimited@test.com

### Stripe Test Cards

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

---

## Test Cases

### TC-001: Free to Paid Plan Upgrade

**Objective:** Verify that a free user can upgrade to a paid plan successfully.

**Preconditions:**

- User has a free plan subscription
- User has some credits used (e.g., 2 out of 5)

**Test Steps:**

1. Log in as free user
2. Navigate to Billing page
3. Click on "Starter" plan (or any paid plan)
4. Review upgrade consent modal
5. Click "Confirm Upgrade"
6. Complete Stripe checkout
7. Return to application
8. Verify subscription status

**Expected Results:**

- ✅ Upgrade consent modal displays correct information
- ✅ User is redirected to Stripe checkout
- ✅ After payment, subscription is active
- ✅ Credits reset to new plan's limit (e.g., 40 for Starter)
- ✅ User receives "subscription_activated" notification
- ✅ Billing page shows new plan as "Current Plan"

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-002: Paid to Higher Paid Plan Upgrade

**Objective:** Verify upgrade from one paid plan to a higher paid plan preserves credits and applies immediately.

**Preconditions:**

- User has Starter plan (40 credits/month)
- User has used 15 credits (25 remaining)
- Current billing period ends in 20 days

**Test Steps:**

1. Log in as Starter user
2. Navigate to Billing page
3. Note current credits: 25 remaining
4. Click on "Pro" plan
5. Review upgrade consent modal
   - Verify it shows current plan cancellation
   - Verify it shows immediate application
   - Verify it shows credit preservation
   - Verify it shows full price (no proration)
6. Click "Confirm Upgrade"
7. Complete Stripe checkout
8. Return to application
9. Check subscription details
10. Check credit balance

**Expected Results:**

- ✅ Upgrade consent modal shows correct information
- ✅ Old subscription is cancelled immediately
- ✅ New plan is active immediately
- ✅ Previous credits (25) are preserved
- ✅ New plan credits (100) are added
- ✅ Total credits = 125 (25 + 100)
- ✅ User receives "subscription_upgraded" notification
- ✅ Next billing cycle will reset to 100 credits
- ✅ User is charged full price for new plan
- ✅ **Note:** If switching from yearly to monthly billing cycle, restriction applies (see TC-016, TC-017)

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-003: Paid to Free Plan Downgrade

**Objective:** Verify downgrade to free plan keeps premium features until period end.

**Preconditions:**

- User has Pro plan (100 credits/month)
- User has used 30 credits (70 remaining)
- Current billing period ends in 15 days
- User has 50 purchased credits

**Test Steps:**

1. Log in as Pro user
2. Navigate to Billing page
3. Note current credits: 70 subscription + 50 purchased = 120 total
4. Click "Downgrade to Free" button
5. Review downgrade consent modal
   - Verify it shows period end date
   - Verify it shows premium features remain until period end
   - Verify it shows credits preserved until period end
6. Click "Confirm Downgrade"
7. Check subscription status
8. Wait until period end (or manually trigger webhook)
9. Verify plan change

**Expected Results:**

- ✅ Downgrade consent modal shows correct period end date
- ✅ Subscription status changes to "cancel_at_period_end"
- ✅ User keeps premium features until period end
- ✅ Credits remain available until period end
- ✅ User receives "subscription_downgrade_scheduled" notification
- ✅ At period end, plan switches to Free
- ✅ Subscription credits reset to 5 (free plan limit)
- ✅ Purchased credits (50) remain unchanged
- ✅ User receives "subscription_downgraded" notification

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-004: Credit Purchase - Single Purchase

**Objective:** Verify user can purchase additional credits successfully.

**Preconditions:**

- User has a paid plan (Starter or higher)
- Credit purchases are enabled in admin settings
- Price per credit is set (e.g., $0.10 = 10 cents)

**Test Steps:**

1. Log in as paid plan user
2. Navigate to Billing page
3. Click "Buy Credits" button
4. Verify purchase modal displays
5. Select a credit amount (e.g., 25 credits)
6. Verify price calculation
7. Click "Continue to Payment"
8. Complete Stripe checkout
9. Return to application
10. Check credit balance

**Expected Results:**

- ✅ Purchase modal displays available credit amounts
- ✅ Price is calculated correctly (e.g., 25 credits × $0.10 = $2.50)
- ✅ User is redirected to Stripe checkout
- ✅ After payment, credits are added to purchased balance
- ✅ Credit breakdown shows purchased credits separately
- ✅ User receives "purchased_credits_added" notification
- ✅ Purchased credits never expire

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-005: Credit Purchase - Bulk Discount

**Objective:** Verify bulk discounts are applied correctly for large purchases.

**Preconditions:**

- User has a paid plan
- Admin has configured bulk discounts:
  - 50+ credits: 10% discount
  - 100+ credits: 20% discount
- Price per credit: 10 cents

**Test Steps:**

1. Log in as paid plan user
2. Navigate to Billing page
3. Click "Buy Credits" button
4. Select 50 credits
5. Verify discount badge shows "10% off"
6. Verify price calculation:
   - Subtotal: 50 × $0.10 = $5.00
   - Discount: $5.00 × 10% = $0.50
   - Final: $4.50
7. Select 100 credits
8. Verify discount badge shows "20% off"
9. Verify price calculation:
   - Subtotal: 100 × $0.10 = $10.00
   - Discount: $10.00 × 20% = $2.00
   - Final: $8.00
10. Complete purchase

**Expected Results:**

- ✅ Discount badges display correctly
- ✅ Price calculations are accurate
- ✅ Discounts are applied correctly
- ✅ Final price reflects discount
- ✅ Purchase completes successfully

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-006: Credit Usage Priority

**Objective:** Verify subscription credits are used before purchased credits.

**Preconditions:**

- User has Pro plan (100 credits/month)
- User has 30 subscription credits remaining
- User has 50 purchased credits
- Total available: 80 credits

**Test Steps:**

1. Log in as Pro user
2. Navigate to Billing page
3. Verify credit breakdown shows:
   - Subscription: 30 / 100
   - Purchased: 50
   - Total: 80
4. Generate a post (uses 1 credit)
5. Check credit balance
6. Generate 30 more posts (uses 30 credits)
7. Check credit balance
8. Generate 1 more post (uses 1 credit)
9. Check credit balance

**Expected Results:**

- ✅ Initial breakdown shows correct amounts
- ✅ After 1 post: Subscription 29, Purchased 50, Total 79
- ✅ After 30 posts: Subscription 0, Purchased 50, Total 50
- ✅ After 31st post: Subscription 0, Purchased 49, Total 49
- ✅ Subscription credits are always used first
- ✅ Purchased credits only used after subscription credits exhausted

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-007: Monthly Credit Reset

**Objective:** Verify subscription credits reset at billing period end, but purchased credits remain.

**Preconditions:**

- User has Starter plan (40 credits/month)
- User has used all 40 subscription credits
- User has 25 purchased credits
- Billing period ends today

**Test Steps:**

1. Log in as Starter user
2. Navigate to Billing page
3. Verify credits: Subscription 0/40, Purchased 25, Total 25
4. Trigger invoice.payment_succeeded webhook (or wait for period end)
5. Refresh billing page
6. Check credit balance

**Expected Results:**

- ✅ Before reset: Subscription 0/40, Purchased 25, Total 25
- ✅ After reset: Subscription 40/40, Purchased 25, Total 65
- ✅ Subscription credits reset to plan limit
- ✅ Purchased credits remain unchanged
- ✅ User receives notification about credit reset

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-008: Upgrade Credit Preservation

**Objective:** Verify credits are preserved correctly during upgrade.

**Preconditions:**

- User has Starter plan (40 credits/month)
- User has used 20 credits (20 remaining)
- User has 15 purchased credits
- Total: 35 credits

**Test Steps:**

1. Log in as Starter user
2. Note current credits: Subscription 20/40, Purchased 15, Total 35
3. Upgrade to Pro plan (100 credits/month)
4. Complete upgrade process
5. Check credit balance immediately after upgrade
6. Verify credit breakdown

**Expected Results:**

- ✅ Before upgrade: Subscription 20/40, Purchased 15, Total 35
- ✅ After upgrade: Subscription 20/100, Purchased 15, Total 35
- ✅ Subscription credits preserved (20 remains)
- ✅ Purchased credits preserved (15 remains)
- ✅ Subscription limit updated to 100
- ✅ Total credits remain 35 (no loss)

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-009: Downgrade Period End Behavior

**Objective:** Verify downgrade executes correctly at billing period end.

**Preconditions:**

- User has Pro plan scheduled to downgrade
- Scheduled downgrade date is today
- User has 10 subscription credits remaining
- User has 20 purchased credits

**Test Steps:**

1. Log in as Pro user
2. Verify subscription shows "cancel_at_period_end" status
3. Verify premium features still work
4. Trigger customer.subscription.deleted webhook (period end)
5. Refresh application
6. Check subscription status
7. Check credit balance
8. Verify premium features are disabled

**Expected Results:**

- ✅ Before period end: Premium features active, credits available
- ✅ After period end: Plan changes to Free
- ✅ Subscription credits reset to 5 (free limit)
- ✅ Purchased credits remain (20)
- ✅ Premium features disabled
- ✅ User receives "subscription_downgraded" notification

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-010: Admin Credit Pricing Settings

**Objective:** Verify admin can configure credit pricing settings.

**Preconditions:**

- Admin user logged in
- Access to admin settings page

**Test Steps:**

1. Log in as admin
2. Navigate to Admin Dashboard > Settings
3. Select "Credit Pricing" category
4. Enable "Credit Purchase Enabled"
5. Set "Price Per Credit" to 10 (cents)
6. Set "Purchase Steps" to [10, 25, 50, 100]
7. Set "Bulk Discounts" to [{"min": 50, "discount": 0.1}, {"min": 100, "discount": 0.2}]
8. Set "Max Purchase" to 500
9. Save settings
10. Log in as regular user
11. Verify purchase modal shows correct options

**Expected Results:**

- ✅ Settings save successfully
- ✅ Purchase modal shows steps: 10, 25, 50, 100
- ✅ Price calculations are correct ($0.10 per credit)
- ✅ Discounts apply correctly (10% at 50+, 20% at 100+)
- ✅ Max purchase limit enforced (cannot buy more than 500)

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-011: Notification System

**Objective:** Verify notifications are sent for all subscription and credit events.

**Preconditions:**

- User has email notifications enabled
- Notification actions are seeded in database

**Test Steps:**

1. Perform upgrade (TC-002)
2. Check for "subscription_upgraded" notification
3. Perform downgrade (TC-003)
4. Check for "subscription_downgrade_scheduled" notification
5. Purchase credits (TC-004)
6. Check for "purchased_credits_added" notification
7. Wait for period end (TC-009)
8. Check for "subscription_downgraded" notification

**Expected Results:**

- ✅ All notifications are created in database
- ✅ Email notifications sent (if enabled)
- ✅ In-app notifications displayed
- ✅ Notification content is accurate
- ✅ Notification timestamps are correct

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-012: Edge Cases & Error Handling

**Objective:** Verify system handles edge cases and errors gracefully.

**Test Cases:**

#### TC-012a: Purchase Credits Without Paid Plan

**Steps:**

1. Log in as free user
2. Navigate to Billing page
3. Verify "Buy Credits" button is not visible

**Expected:** ✅ Purchase option only available for paid plans

#### TC-012b: Purchase Credits Disabled

**Steps:**

1. Admin disables credit purchases
2. Paid user tries to purchase credits
3. Verify error message

**Expected:** ✅ Clear error message displayed

#### TC-012c: Exceed Max Purchase Limit

**Steps:**

1. Set max purchase to 100 credits
2. Try to purchase 150 credits
3. Verify error

**Expected:** ✅ Error message, purchase blocked

#### TC-012d: Stripe Payment Failure

**Steps:**

1. Start credit purchase
2. Use declined card (4000 0000 0000 0002)
3. Verify error handling

**Expected:** ✅ Error message displayed, credits not added

#### TC-012e: Upgrade During Downgrade Period

**Steps:**

1. Schedule downgrade
2. Before period end, upgrade to higher plan
3. Verify upgrade succeeds

**Expected:** ✅ Upgrade cancels scheduled downgrade, applies immediately

#### TC-012f: Multiple Rapid Upgrades

**Steps:**

1. Upgrade Starter → Pro
2. Immediately upgrade Pro → Unlimited
3. Verify final state

**Expected:** ✅ Final plan is Unlimited, credits preserved correctly

#### TC-012g: Yearly to Monthly Restriction Edge Cases

**Steps:**

1. User on yearly subscription, 31 days remaining → attempt monthly switch
2. User on yearly subscription, 30 days remaining → attempt monthly switch
3. User on yearly subscription, 29 days remaining → attempt monthly switch
4. User on monthly subscription → attempt monthly switch (should work)
5. User on yearly subscription → attempt yearly switch (should work)

**Expected:** 
- ✅ 31 days: Blocked with suggestion
- ✅ 30 days: Allowed (boundary case)
- ✅ 29 days: Allowed
- ✅ Monthly → Monthly: Always allowed
- ✅ Yearly → Yearly: Always allowed

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-013: UI/UX Consent Modals

**Objective:** Verify consent modals display correct information and function properly.

**Test Steps:**

1. Test Upgrade Consent Modal (TC-002)

   - Verify current plan displayed
   - Verify new plan displayed
   - Verify price information
   - Verify credit preservation message
   - Verify "Cancel" button works
   - Verify "Confirm Upgrade" button works

2. Test Downgrade Consent Modal (TC-003)

   - Verify period end date displayed
   - Verify premium features message
   - Verify credit preservation message
   - Verify "Keep Current Plan" button works
   - Verify "Confirm Downgrade" button works

3. Test Purchase Credits Modal (TC-004)
   - Verify credit amounts displayed
   - Verify price calculations
   - Verify discount badges
   - Verify "Cancel" button works
   - Verify "Continue to Payment" button works

**Expected Results:**

- ✅ All modals display accurate information
- ✅ All buttons function correctly
- ✅ Modals are responsive (mobile/desktop)
- ✅ Modals are accessible (keyboard navigation)
- ✅ Error states handled gracefully

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-014: Billing Page Display

**Objective:** Verify billing page displays credit breakdown correctly.

**Preconditions:**

- User has subscription credits and purchased credits

**Test Steps:**

1. Log in as user with mixed credits
2. Navigate to Billing page
3. Verify "Usage & Spending" tab displays:
   - Total available credits
   - Subscription credits breakdown
   - Purchased credits breakdown
   - Progress bars
   - Reset date information
4. Verify "Plans" tab displays:
   - Current plan highlighted
   - Upgrade/downgrade options
   - Purchase credits button (if paid plan)

**Expected Results:**

- ✅ Credit breakdown is accurate
- ✅ Visual indicators (progress bars) are correct
- ✅ Reset dates are displayed
- ✅ Purchase credits section visible for paid plans
- ✅ Current plan clearly marked
- ✅ Responsive design works on mobile

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

### TC-015: Stripe Integration

**Objective:** Verify Stripe webhooks and checkout sessions work correctly.

**Test Steps:**

1. **Checkout Session Creation**

   - Create upgrade checkout session
   - Verify session URL is returned
   - Verify session contains correct plan info

2. **Webhook: checkout.session.completed**

   - Complete checkout
   - Verify webhook received
   - Verify subscription updated
   - Verify credits updated

3. **Webhook: customer.subscription.updated**

   - Trigger subscription update
   - Verify webhook received
   - Verify upgrade logic executed

4. **Webhook: invoice.payment_succeeded**

   - Trigger invoice payment
   - Verify webhook received
   - Verify credits reset

5. **Webhook: customer.subscription.deleted**
   - Trigger subscription deletion
   - Verify webhook received
   - Verify downgrade logic executed

**Expected Results:**

- ✅ All webhooks are received
- ✅ Webhook handlers execute correctly
- ✅ Database updates are accurate
- ✅ Error handling works for failed webhooks
- ✅ Idempotency handled (duplicate webhooks)

**Actual Results:**

- Status: ⏳ Pending
- Notes:

---

## Regression Testing

### Areas to Verify After Changes

- [ ] Existing subscriptions still work
- [ ] Credit usage tracking still accurate
- [ ] Post generation still deducts credits correctly
- [ ] Admin panel still functional
- [ ] User dashboard still displays credits correctly
- [ ] API endpoints still return correct data

---

## Performance Testing

### Load Scenarios

- [ ] Multiple simultaneous upgrades
- [ ] Multiple simultaneous credit purchases
- [ ] Credit balance calculation under load
- [ ] Webhook processing under load

---

## Security Testing

### Security Checks

- [ ] Users cannot modify credit balances directly
- [ ] Users cannot bypass purchase limits
- [ ] Admin endpoints require authentication
- [ ] Stripe webhooks are verified
- [ ] Credit purchase requires paid plan
- [ ] SQL injection prevention
- [ ] XSS prevention in modals

---

## Browser Compatibility

### Browsers to Test

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Test Completion Checklist

- [ ] All high-priority test cases executed
- [ ] All medium-priority test cases executed
- [ ] All edge cases tested
- [ ] All bugs logged and tracked
- [ ] Test results documented
- [ ] Sign-off obtained from QA lead
- [ ] Ready for production deployment

---

## Known Issues & Bugs

| Bug ID | Description | Severity | Status | Assigned To | Notes |
| ------ | ----------- | -------- | ------ | ----------- | ----- |
|        |             |          |        |             |       |

---

## Test Sign-Off

**QA Lead:** ********\_******** **Date:** ****\_****

**Product Owner:** ********\_******** **Date:** ****\_****

**Tech Lead:** ********\_******** **Date:** ****\_****

---

## Notes & Observations

_Use this section to document any observations, questions, or recommendations during testing._

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-20
