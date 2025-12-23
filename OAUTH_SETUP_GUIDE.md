# OAuth Setup Guide

## ⚠️ Current Issue
The error "You need to pass the 'client_id' parameter" occurs because LinkedIn OAuth credentials are not configured.

## 🔧 Required Setup

### 1. LinkedIn OAuth (REQUIRED for LinkedIn Login)

#### Step 1: Create LinkedIn App
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **"Create app"**
3. Fill in the required information:
   - **App name**: Your app name (e.g., "LinkedIn Content SaaS")
   - **LinkedIn Page**: Select or create a LinkedIn Page
   - **App logo**: Upload a logo (optional)
   - **Legal agreement**: Check the box

#### Step 2: Configure OAuth Settings
1. Go to the **Auth** tab
2. Copy your **Client ID** and **Client Secret**
3. Under **Redirect URLs**, add:
   ```
   http://localhost:8000/api/auth/linkedin/callback
   ```
4. For production, also add:
   ```
   https://your-domain.com/api/auth/linkedin/callback
   ```

#### Step 3: Request Products
1. Go to the **Products** tab
2. Request access to:
   - ✅ **Sign In with LinkedIn using OpenID Connect** (Required)
   - ✅ **Share on LinkedIn** (Optional, for posting)

#### Step 4: Update .env File
Open `backend/.env` and replace the placeholder values:

```bash
LINKEDIN_CLIENT_ID=your_actual_client_id_here
LINKEDIN_CLIENT_SECRET=your_actual_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:8000/api/auth/linkedin/callback
```

#### Step 5: Restart Backend
After updating the .env file, restart your backend server:
```bash
# The backend will automatically reload if using uvicorn --reload
# Or manually restart it
```

---

### 2. Google OAuth (OPTIONAL for Google Login)

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one

#### Step 2: Enable Google+ API
1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

#### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   ```
   http://localhost:8000/api/auth/google/callback
   ```
5. Copy your **Client ID** and **Client Secret**

#### Step 4: Update .env File
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

---

### 3. Email Configuration (OPTIONAL)

For email verification and password reset features:

#### Using Gmail:
1. Enable 2-factor authentication on your Google account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Update .env:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=ContentAI
SMTP_USE_TLS=true
```

#### Using Other Email Providers:
- **Outlook/Hotmail**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **SendGrid**: `smtp.sendgrid.net:587`

---

## 📋 Current .env Status

### ✅ Configured:
- Database (SQLite)
- AI Provider (Gemini)
- OpenAI API Key
- Gemini API Key
- JWT Secret
- Cloudflare Workers AI (for image generation)

### ❌ Missing (Need to Configure):
- **LinkedIn Client ID** (REQUIRED for LinkedIn login)
- **LinkedIn Client Secret** (REQUIRED for LinkedIn login)
- Google OAuth credentials (optional)
- SMTP email settings (optional)

---

## 🚀 Quick Start (Development)

If you want to test the app without LinkedIn OAuth:

1. Use the **Mock Login** feature on the login page
2. Enter any email address (e.g., `test@example.com`)
3. This will create a test user without OAuth

**Note**: Mock login is only available in development mode (`DEV_MODE=true` in config.py)

---

## 🔒 Production Checklist

Before deploying to production:

- [ ] Get real LinkedIn OAuth credentials
- [ ] Update redirect URIs to production domain
- [ ] Set `DEV_MODE=false` in config
- [ ] Generate strong JWT secret: `openssl rand -hex 32`
- [ ] Configure SMTP for email functionality
- [ ] Set up SSL/HTTPS
- [ ] Update CORS settings in config

---

## 🆘 Troubleshooting

### "client_id parameter missing"
- LinkedIn credentials not set in .env
- Backend needs restart after updating .env

### "Invalid redirect_uri"
- Redirect URI in .env doesn't match LinkedIn app settings
- Make sure to add the exact URL in LinkedIn Developer Portal

### "Insufficient permissions"
- Request "Sign In with LinkedIn using OpenID Connect" product
- Wait for LinkedIn approval (usually instant for development)

### Backend not reading .env
- Make sure .env file is in `backend/` directory
- Check file permissions: `chmod 644 backend/.env`
- Restart backend server

---

## 📚 Resources

- [LinkedIn OAuth Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [FastAPI Settings Documentation](https://fastapi.tiangolo.com/advanced/settings/)


