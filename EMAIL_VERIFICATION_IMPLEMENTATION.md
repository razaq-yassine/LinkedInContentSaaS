# Email Verification Implementation Summary

## ✅ Issue Resolved

Users registering with email/password now **must verify their email** before logging in. Verification includes:

- **6-digit code** sent via email (expires in 15 minutes)
- **Verification link** for one-click verification
- OAuth users (LinkedIn, Google) are **automatically verified**

---

## 🔧 Changes Made

### **Backend Changes**

#### 1. **Database Model** (`backend/app/models.py`)

- Added `verification_code` field to `UserToken` table to store 6-digit codes
- Index added for efficient code lookups

#### 2. **Email Service** (`backend/app/services/email_service.py`)

- Added `generate_verification_code()` - generates secure 6-digit codes
- Updated `send_verification_email()` - sends both code and link in one email
- Email template now prominently displays the 6-digit code
- Shows 15-minute expiration warning

#### 3. **Auth Routes** (`backend/app/routers/auth.py`)

- **Registration**: Always requires email verification (removed dev_mode bypass)
  - Token expires in **15 minutes** (changed from 24 hours)
  - Generates both token and 6-digit code
- **Login**: Blocks unverified users with clear error message
- **New endpoint**: `POST /api/auth/verify-email-code`
  - Accepts `email` and `code` (6 digits)
  - Verifies user and marks email as verified
- **Updated**: `POST /api/auth/resend-verification`
  - Now generates new code with 15-minute expiration
- **OAuth providers**: Already auto-verify emails (LinkedIn, Google)

#### 4. **Auth Schemas** (`backend/app/schemas/auth.py`)

- Added `VerifyEmailCodeRequest` schema for code verification

### **Frontend Changes**

#### 1. **API Client** (`frontend/lib/api-client.ts`)

- Added `verifyEmailCode(email, code)` method

#### 2. **Verification Page** (`frontend/app/(auth)/verify-email/page.tsx`)

Complete redesign with:

- **Dual mode**: Auto-verify with link OR manual code entry
- **6-digit code input**: Individual boxes with auto-focus
- **Copy-paste support**: Paste 6-digit code directly
- **Countdown timer**: Shows 15-minute expiration
- **Pre-filled email**: When redirected from registration
- **Resend functionality**: Request new code
- **Professional UI**: Matches app design system

#### 3. **Registration Page** (`frontend/app/(auth)/register/page.tsx`)

- Redirects to verification page after successful registration
- Passes email as URL parameter

### **Migration Script**

- Created `backend/add_verification_code_migration.py`
- Run this to update existing databases

---

## 🚀 How to Deploy

### **Step 1: Run Database Migration**

```bash
cd backend
python add_verification_code_migration.py
```

### **Step 2: Configure SMTP (if not done)**

Update `.env` with your SMTP settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=PostInAI
SMTP_USE_TLS=true
```

For Gmail, create an App Password:

1. Go to Google Account Settings → Security
2. Enable 2-Step Verification
3. Generate App Password for "Mail"
4. Use that password in SMTP_PASSWORD

### **Step 3: Restart Backend**

```bash
cd backend
# Stop existing server (Ctrl+C)
python -m uvicorn app.main:app --reload
```

### **Step 4: Restart Frontend**

```bash
cd frontend
# Stop existing server (Ctrl+C)
npm run dev
```

---

## 🧪 Testing the Flow

### **Test 1: Email/Password Registration**

1. Go to `/register`
2. Fill in name, email, password
3. Click "Create Account"
4. **Expected**: Redirected to verification page
5. Check email for 6-digit code
6. Enter code OR click verification link
7. **Expected**: Email verified, redirected to login
8. Try logging in
9. **Expected**: Login successful

### **Test 2: Login Without Verification**

1. Register a new account
2. Don't verify email
3. Try logging in with email/password
4. **Expected**: Error - "Please verify your email before logging in"

### **Test 3: Expired Code**

1. Register and wait 15 minutes
2. Try using the code
3. **Expected**: Error - "Verification code has expired"
4. Click "Resend Code"
5. **Expected**: New code sent with fresh 15-minute timer

### **Test 4: OAuth Verification**

1. Register/Login with LinkedIn or Google
2. **Expected**: Account created with `email_verified=true`
3. **Expected**: Can login immediately without verification

### **Test 5: Link Verification**

1. Register with email
2. Click verification link in email
3. **Expected**: Auto-verified, redirected to login

---

## 📧 Email Template Preview

The verification email now includes:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PostInAI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verify Your Email Address

Hi [Name],

Thank you for signing up for PostInAI! Use the
verification code below to activate your account:

┌─────────────────────┐
│ VERIFICATION CODE   │
│                     │
│     1 2 3 4 5 6     │
└─────────────────────┘

Or click the button below to verify automatically:
[Verify Email Address Button]

⏱️ This code will expire in 15 minutes

If you didn't create an account with PostInAI,
you can safely ignore this email.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔒 Security Features

✅ **15-minute expiration** - Codes expire quickly
✅ **Secure random generation** - Uses secrets module
✅ **One-time use** - Codes marked as used after verification
✅ **Email matching** - Code must match user's email
✅ **Token invalidation** - Old tokens invalidated on resend
✅ **SQL injection protection** - Parameterized queries
✅ **OAuth auto-verify** - Social logins bypass manual verification

---

## 📋 API Endpoints Summary

### New/Updated Endpoints:

**POST** `/api/auth/register`

- Now always sends verification email (unless OAuth)
- Returns success with instruction to check email

**POST** `/api/auth/verify-email`

- Verifies using token from email link
- Marks email as verified

**POST** `/api/auth/verify-email-code` ⭐ NEW

- Verifies using 6-digit code
- Requires: `email` and `code`
- Response: Success message

**POST** `/api/auth/resend-verification`

- Sends new code with 15-minute expiration
- Invalidates old codes

**POST** `/api/auth/login`

- Now checks `email_verified` field
- Blocks unverified users

---

## 🎨 UI Features

### Verification Page Components:

- ✅ 6 individual digit input boxes
- ✅ Auto-focus next box on input
- ✅ Auto-focus previous box on backspace
- ✅ Paste support for 6-digit codes
- ✅ Real-time countdown timer (15:00 → 0:00)
- ✅ Resend code button
- ✅ Pre-filled email from registration
- ✅ Error/success state indicators
- ✅ Mobile-responsive design
- ✅ Matches app color scheme (cyan/teal gradients)

---

## 🐛 Troubleshooting

### Issue: "Email not sending"

**Solution**: Check SMTP configuration in `.env`. For Gmail, ensure:

- 2FA is enabled
- Using App Password (not account password)
- "Less secure app access" is NOT needed (deprecated)

### Issue: "Code expired immediately"

**Solution**: Check server timezone. Code expires 15 minutes from `datetime.utcnow()`

### Issue: "Migration failed"

**Solution**: Database already up to date or file not found. Check:

```bash
cd backend
python add_verification_code_migration.py
```

### Issue: "Can't login with OAuth"

**Solution**: OAuth users should be auto-verified. Check:

- `User.email_verified` should be `True` for OAuth users
- Backend logs for OAuth callback errors

---

## 📝 Notes

- **Backward Compatibility**: Existing verified users are unaffected
- **Development Mode**: `dev_mode` no longer bypasses verification
- **Admin Settings**: Verification requirement can be toggled via `require_email_verification` setting (defaults to enabled)
- **Code Reuse**: Codes are single-use - attempting to use twice will fail
- **Link vs Code**: Both methods work - user can choose their preference

---

## ✨ User Experience Flow

```
User Registers
      ↓
Redirected to Verification Page
      ↓
┌─────────────────────────────┐
│  Option 1: Enter 6-digit    │
│  code from email            │
│         OR                  │
│  Option 2: Click link in    │
│  email                      │
└─────────────────────────────┘
      ↓
Email Verified ✅
      ↓
Can Login Successfully
```

---

**Implementation Complete!** 🎉

All requirements have been met:

- ✅ 6-digit verification code
- ✅ Code sent via email
- ✅ Verification link in email
- ✅ 15-minute expiration
- ✅ Users cannot login without verification
- ✅ OAuth providers auto-verify
- ✅ Professional UI for code entry
- ✅ Countdown timer displayed
