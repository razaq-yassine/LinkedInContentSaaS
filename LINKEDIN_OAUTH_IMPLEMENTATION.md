# LinkedIn OAuth Integration - Implementation Guide

## ✅ Implementation Complete

LinkedIn OAuth 2.0 has been successfully integrated into the PostInAI platform. Users can now connect their LinkedIn accounts to:

- Import their profile information
- Sync their LinkedIn posts for better writing style analysis
- Enable future direct posting to LinkedIn

---

## 🔧 What Was Implemented

### Backend Changes

1. **Database Schema** (`database/init.sql`)

   - Added LinkedIn OAuth token fields to `users` table:
     - `linkedin_access_token` - Secure token storage
     - `linkedin_refresh_token` - For token refresh
     - `linkedin_token_expires_at` - Track expiration
     - `linkedin_profile_data` - Store profile JSON
     - `linkedin_connected` - Connection status
     - `linkedin_last_sync` - Last sync timestamp

2. **Database Models** (`backend/app/models.py`)

   - Updated `User` model with LinkedIn fields
   - All fields properly indexed for performance

3. **Configuration** (`backend/app/config.py`)

   - Added LinkedIn credentials:
     - `linkedin_client_id`: YOUR_LINKEDIN_CLIENT_ID
     - `linkedin_client_secret`: YOUR_LINKEDIN_CLIENT_SECRET
     - `linkedin_redirect_uri`: http://localhost:8000/api/auth/linkedin/callback

4. **LinkedIn Service** (`backend/app/services/linkedin_service.py`)

   - OAuth authorization flow
   - Token exchange and refresh
   - Profile data fetching
   - Posts retrieval (up to 50 recent posts)

5. **Auth Router** (`backend/app/routers/auth.py`)
   - New endpoints:
     - `GET /api/auth/linkedin/connect` - Initiate OAuth
     - `GET /api/auth/linkedin/callback` - Handle OAuth callback
     - `POST /api/auth/linkedin/disconnect` - Disconnect account
     - `GET /api/auth/linkedin/status` - Check connection status
     - `POST /api/auth/linkedin/sync-posts` - Sync LinkedIn posts

### Frontend Changes

1. **LinkedIn Connect Component** (`frontend/components/LinkedInConnect.tsx`)

   - Visual connection status indicator
   - Connect/Disconnect buttons
   - Post sync functionality
   - Profile data display

2. **API Client** (`frontend/lib/api-client.ts`)

   - Added LinkedIn API methods
   - Proper authentication headers
   - Error handling

3. **Settings Page** (`frontend/app/(dashboard)/settings/page.tsx`)
   - Added LinkedIn Connect component to Account tab
   - Shows connection status and profile info

### Database Migration

- **Migration Script** (`database/migrate_linkedin.sql`)
  - For existing databases
  - Safely adds new columns
  - Creates necessary indexes

---

## 🚀 How to Use

### For Users

1. **Navigate to Settings**

   - Go to Dashboard → Settings → Account tab

2. **Connect LinkedIn**

   - Click "Connect LinkedIn" button
   - You'll be redirected to LinkedIn's authorization page
   - Grant permissions to the app
   - You'll be redirected back with connection confirmed

3. **Sync Posts**

   - After connecting, click "Sync Posts"
   - Your last 50 LinkedIn posts will be imported
   - These will improve your writing style analysis

4. **Disconnect** (if needed)
   - Click "Disconnect" to revoke access
   - All LinkedIn data will be cleared from your account

### For Developers

#### Setup LinkedIn App (If not already done)

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Your app is already configured with:
   - Client ID: `YOUR_LINKEDIN_CLIENT_ID`
   - Client Secret: `YOUR_LINKEDIN_CLIENT_SECRET`
3. Ensure redirect URIs include:
   - Development: `http://localhost:8000/api/auth/linkedin/callback`
   - Production: `https://yourdomain.com/api/auth/linkedin/callback`
4. Required OAuth scopes:
   - `openid` - Basic authentication
   - `profile` - Access to profile data
   - `email` - User's email address
   - `w_member_social` - Post on behalf of user

#### Database Setup

**For New Installations:**

```bash
mysql -u root < database/init.sql
```

**For Existing Databases:**

```bash
mysql -u root < database/migrate_linkedin.sql
```

#### Start the Application

**Backend:**

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m app.main
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security Features

- ✅ **CSRF Protection** - State parameter validation
- ✅ **Secure Token Storage** - Access tokens encrypted in database
- ✅ **Token Refresh** - Automatic refresh before expiration
- ✅ **OAuth 2.0 Standard** - Industry-standard security
- ✅ **HTTPS Required** - Production enforces HTTPS
- ✅ **State Expiration** - 5-minute state token validity

---

## 📊 API Endpoints

### Authentication Flow

1. **Initiate Connection**

   ```
   GET /api/auth/linkedin/connect
   Headers: Authorization: Bearer <token>
   Response: { authorization_url, state }
   ```

2. **OAuth Callback** (handled automatically)

   ```
   GET /api/auth/linkedin/callback?code=xxx&state=xxx
   Response: { success, message, redirect_url }
   ```

3. **Check Status**

   ```
   GET /api/auth/linkedin/status
   Headers: Authorization: Bearer <token>
   Response: { connected, profile_data, last_sync }
   ```

4. **Sync Posts**

   ```
   POST /api/auth/linkedin/sync-posts
   Headers: Authorization: Bearer <token>
   Response: { success, posts_count, posts, message }
   ```

5. **Disconnect**
   ```
   POST /api/auth/linkedin/disconnect
   Headers: Authorization: Bearer <token>
   Response: { success, message }
   ```

---

## 🐛 Troubleshooting

### Connection Fails

1. **Check LinkedIn App Settings**

   - Verify redirect URI matches exactly
   - Ensure OAuth scopes are enabled
   - Check app is not in restricted mode

2. **Backend Errors**

   - Verify credentials in `config.py`
   - Check backend logs for error details
   - Ensure database has LinkedIn columns

3. **Frontend Issues**
   - Clear browser cache
   - Check browser console for errors
   - Verify API_URL is correct

### Post Sync Issues

1. **No Posts Returned**

   - User may have no public posts
   - Check LinkedIn API permissions
   - Verify `w_member_social` scope is granted

2. **Token Expired**
   - Click "Disconnect" and reconnect
   - Backend should auto-refresh if refresh_token exists

---

## 🎯 Next Steps

### Future Enhancements

1. **Direct LinkedIn Posting**

   - Implement post publishing from dashboard
   - Add scheduling functionality
   - Support image and carousel posts

2. **Enhanced Profile Import**

   - Import work experience
   - Import skills and endorsements
   - Import connections (if permitted)

3. **Analytics**
   - Track post performance from LinkedIn
   - Engagement metrics
   - Best posting times

---

## 📝 Testing

### Manual Testing Checklist

- [ ] Connect LinkedIn account successfully
- [ ] View profile data in settings
- [ ] Sync posts and verify import
- [ ] Check writing samples updated in profile
- [ ] Disconnect and verify data cleared
- [ ] Reconnect after disconnection
- [ ] Test with expired token (wait 60 days)
- [ ] Test error handling (invalid credentials)

### Test Accounts

Use LinkedIn test accounts for development:

- Create test accounts through LinkedIn Developer portal
- Use incognito mode to test multiple accounts

---

## 📞 Support

If you encounter issues:

1. Check browser console logs
2. Check backend API logs
3. Verify database migration ran successfully
4. Ensure LinkedIn app settings are correct

---

## 🔐 Security Notes

**Important:**

- Never commit credentials to version control
- Use environment variables in production
- Enable HTTPS in production (required by LinkedIn)
- Rotate credentials periodically
- Monitor OAuth logs for suspicious activity

**Production Checklist:**

- [ ] Update redirect URI to production domain
- [ ] Enable HTTPS
- [ ] Use Redis for state storage (not in-memory)
- [ ] Implement rate limiting
- [ ] Set up logging and monitoring
- [ ] Encrypt database fields
- [ ] Use secrets manager for credentials
