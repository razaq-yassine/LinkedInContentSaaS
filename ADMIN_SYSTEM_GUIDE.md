# Admin System Implementation Guide

## Overview

A comprehensive admin authentication and dashboard system has been implemented for managing users, subscriptions, and global settings.

## Features

### 1. **Admin Authentication**
- Secure login system with JWT tokens
- Role-based access control (Admin, Super Admin)
- Session management with token expiration
- Password hashing with bcrypt

### 2. **Dashboard Overview**
- Real-time statistics and metrics
- User analytics (total users, active users)
- Content metrics (posts, comments)
- Revenue tracking (monthly/yearly)
- Subscription breakdown

### 3. **User Management**
- View all users with detailed information
- Search and filter users
- View individual user profiles
- Manage user subscriptions
- Reset user onboarding
- Delete users
- View user statistics (posts, comments, conversations)

### 4. **Subscription Plan Management**
- Create new subscription plans
- Edit existing plans
- Delete unused plans
- Configure pricing (monthly/yearly)
- Set post limits
- Manage features list
- Activate/deactivate plans

### 5. **Global Settings Management**
- Edit system-wide configuration
- Manage AI prompts and rules
- Configure content format guidelines
- Update comment worthiness rubric
- Manage default preferences
- Update trending topics

## Backend Implementation

### Database Models

#### Admin Model (`backend/app/models.py`)
```python
class Admin(Base):
    id: UUID
    email: str (unique)
    password_hash: str
    name: str
    role: AdminRole (admin/super_admin)
    is_active: bool
    last_login: datetime
    created_at: datetime
    updated_at: datetime
```

#### SubscriptionPlanConfig Model
```python
class SubscriptionPlanConfig(Base):
    id: UUID
    plan_name: str (unique)
    display_name: str
    description: str
    price_monthly: int (in cents)
    price_yearly: int (in cents)
    posts_limit: int
    features: JSON (list of features)
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
```

### API Endpoints

#### Admin Authentication (`/api/admin/auth`)
- `POST /login` - Admin login
- `GET /me` - Get current admin info
- `POST /admins` - Create new admin (super admin only)
- `GET /admins` - List all admins (super admin only)
- `PUT /admins/{id}` - Update admin (super admin only)
- `DELETE /admins/{id}` - Delete admin (super admin only)
- `POST /change-password` - Change password

#### Admin Management (`/api/admin`)
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /users` - List all users with details
- `GET /users/{id}` - Get specific user details
- `PUT /users/{id}/subscription` - Update user subscription
- `POST /users/{id}/reset-onboarding` - Reset user onboarding
- `DELETE /users/{id}` - Delete user
- `GET /subscription-plans` - List all subscription plans
- `POST /subscription-plans` - Create subscription plan
- `PUT /subscription-plans/{id}` - Update subscription plan
- `DELETE /subscription-plans/{id}` - Delete subscription plan
- `GET /settings` - List all global settings
- `GET /settings/{key}` - Get specific setting
- `PUT /settings/{key}` - Update setting

## Frontend Implementation

### Pages Structure

```
frontend/app/admin/
├── login/
│   └── page.tsx                    # Admin login page
└── dashboard/
    ├── layout.tsx                  # Dashboard layout with navigation
    ├── page.tsx                    # Dashboard overview with stats
    ├── users/
    │   └── page.tsx                # User management
    ├── plans/
    │   └── page.tsx                # Subscription plans management
    └── settings/
        └── page.tsx                # Global settings management
```

### Key Features

#### Dashboard Layout
- Responsive sidebar navigation
- Mobile-friendly with hamburger menu
- Admin profile display
- Logout functionality
- Active route highlighting

#### User Management
- Searchable user table
- Detailed user modal with:
  - Basic information
  - Subscription details
  - Usage statistics
  - Profile information
  - Quick actions (update subscription, reset onboarding, delete)

#### Subscription Plans
- Grid view of all plans
- Create new plans with modal
- Edit existing plans
- Delete plans (with validation)
- Feature management
- Pricing configuration

#### Global Settings
- List of all system settings
- Inline editing with textarea
- Save/cancel functionality
- Last updated timestamps
- Setting descriptions

## Database Migration

Run the admin migration to create necessary tables:

```bash
# Navigate to database directory
cd LinkedInContentSaaS/database

# Run migration (MySQL)
mysql -u your_user -p your_database < admin_migration.sql
```

Or for SQLite (development):
```bash
# Tables will be created automatically on startup
python -m uvicorn app.main:app --reload
```

## Default Admin Credentials

**Email:** `admin@linkedincontent.com`  
**Password:** `Admin@123456`

⚠️ **IMPORTANT:** Change these credentials immediately in production!

## Security Features

### Backend Security
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Token expiration (8 hours)
- ✅ HTTPS recommended for production
- ✅ CORS configuration
- ✅ SQL injection prevention (prepared statements)

### Frontend Security
- ✅ Token storage in localStorage
- ✅ Automatic redirect on unauthorized access
- ✅ Token validation on protected routes
- ✅ Secure logout (token removal)

## Environment Variables

Add to your `.env` file:

```env
# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL
FRONTEND_URL=http://localhost:3000

# API URL (frontend)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Usage Guide

### Creating a New Admin

1. Login as super admin
2. Navigate to admin management (via API or add UI)
3. Use `POST /api/admin/auth/admins` endpoint:

```json
{
  "email": "newadmin@example.com",
  "password": "SecurePassword123!",
  "name": "New Admin",
  "role": "admin"
}
```

### Managing Users

1. Navigate to **Users** page
2. Search for specific users
3. Click **eye icon** to view details
4. Update subscription, reset onboarding, or delete user

### Creating Subscription Plans

1. Navigate to **Subscription Plans** page
2. Click **Create Plan** button
3. Fill in plan details:
   - Plan name (slug, e.g., "premium")
   - Display name (e.g., "Premium Plan")
   - Description
   - Monthly/yearly pricing (in cents)
   - Post limit
   - Features list
   - Active status
4. Click **Create Plan**

### Updating Global Settings

1. Navigate to **Global Settings** page
2. Click **Edit Setting** on desired setting
3. Modify the value in textarea
4. Click **Save Changes**

## API Authentication

All admin endpoints require Bearer token authentication:

```javascript
const token = localStorage.getItem('admin_token');

axios.get('/api/admin/users', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

## Troubleshooting

### Cannot Login
- Verify admin exists in database
- Check password is correct
- Ensure JWT_SECRET is set in backend
- Check backend logs for errors

### 401 Unauthorized
- Token may have expired (8 hours)
- Token may be invalid
- Re-login to get new token

### Cannot Delete Plan
- Plan may have active subscriptions
- Move users to different plan first
- Then delete the plan

### Settings Not Saving
- Check admin has proper permissions
- Verify backend is running
- Check browser console for errors
- Verify API endpoint is correct

## Production Deployment Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET to strong random value
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Review and test all permissions
- [ ] Enable database encryption at rest

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Admin activity logging
- [ ] Email notifications for admin actions
- [ ] Bulk user operations
- [ ] Advanced analytics and reporting
- [ ] Export data functionality
- [ ] Admin API rate limiting
- [ ] Audit trail for all changes
- [ ] Custom roles and permissions
- [ ] Admin dashboard widgets

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs
3. Check browser console
4. Verify API responses
5. Contact development team

---

**Last Updated:** December 2024  
**Version:** 1.0.0
