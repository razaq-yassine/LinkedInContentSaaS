# Manual Testing Documentation

This folder contains comprehensive manual testing documentation for the Credit System & Plan Switching features.

## Files Overview

### 📋 [credit-system-testing-plan.md](./credit-system-testing-plan.md)
**Main testing plan document** with detailed test cases covering all scenarios:
- 15 comprehensive test cases
- Status tracker for test execution
- Detailed steps and expected results
- Edge cases and error handling
- Performance and security testing sections

### 📝 [test-execution-template.md](./test-execution-template.md)
**Template for executing individual test cases** - use this for each test:
- Preconditions checklist
- Step-by-step execution tracking
- Results documentation
- Issue logging
- Sign-off section

### ✅ [quick-reference-checklist.md](./quick-reference-checklist.md)
**Quick reference checklist** for rapid verification:
- Critical path tests
- Pre-testing setup
- Edge cases
- Regression checks
- Browser compatibility

## How to Use

### For Testers

1. **Before Testing:**
   - Review `credit-system-testing-plan.md` to understand all test scenarios
   - Complete the "Pre-Testing Setup" checklist in `quick-reference-checklist.md`
   - Prepare test accounts and Stripe test cards

2. **During Testing:**
   - Use `test-execution-template.md` for each test case
   - Update the status tracker in `credit-system-testing-plan.md`
   - Check off items in `quick-reference-checklist.md` as you go

3. **After Testing:**
   - Document all results in the test plan
   - Log any bugs or issues found
   - Complete sign-off sections

### For QA Leads

1. **Test Planning:**
   - Assign test cases to team members
   - Set priorities based on business impact
   - Schedule test execution

2. **Test Monitoring:**
   - Track progress using the status tracker
   - Review test results regularly
   - Escalate blockers immediately

3. **Test Completion:**
   - Verify all critical tests passed
   - Review bug reports
   - Approve sign-off

## Test Case Priority

- **High Priority:** Must pass before production deployment
  - TC-001 through TC-009
  - TC-015 (Stripe Integration)

- **Medium Priority:** Should pass, but not blocking
  - TC-010 through TC-014

## Test Environment

### Required Setup
- Backend API running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- Stripe test mode enabled
- Database with latest migrations
- Test accounts created

### Test Accounts
Create these accounts for testing:
- `free@test.com` - Free plan user
- `starter@test.com` - Starter plan user
- `pro@test.com` - Pro plan user
- `admin@test.com` - Admin user

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## Reporting Issues

When you find a bug:

1. Document it in the "Known Issues & Bugs" section of the test plan
2. Include:
   - Bug ID (auto-increment)
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Severity level

## Test Sign-Off Process

Before marking testing as complete:

1. ✅ All high-priority tests executed
2. ✅ All critical bugs fixed or documented
3. ✅ Test results reviewed by QA lead
4. ✅ Product owner approval obtained
5. ✅ Tech lead approval obtained

## Updates

**Version 1.0** - Initial testing plan created (2025-01-20)

---

**Questions?** Contact the QA team or refer to the main test plan document.
