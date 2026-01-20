# Database Cleanup Instructions

## ✅ Completed
- Active database identified: `linkedin_content_saas.db` (root folder)
- Database verified with 2 admins and 6 subscription plans
- All Alembic migrations applied successfully
- Database seeded with initial data

## ⚠️ Action Required

The file `backend/linkedin_content_saas.db` is currently locked by a running process (likely the backend server).

### To complete cleanup:

1. **Stop the backend server** (if running)
   ```bash
   # Press Ctrl+C in the terminal running the backend
   ```

2. **Delete the duplicate database**
   ```powershell
   Remove-Item backend\linkedin_content_saas.db -Force
   ```

3. **Verify only one database remains**
   ```powershell
   Get-ChildItem -Recurse -Filter "*.db"
   ```

   You should only see: `linkedin_content_saas.db` in the root folder

## Database Location

The application is configured to use:
- **Path**: `./linkedin_content_saas.db` (relative to project root)
- **Full path**: `C:\Users\Setup Game\Desktop\projects\contentAi\LinkedInContentSaaS\linkedin_content_saas.db`

## Database Contents

- **Tables**: 21 (all required tables present)
- **Admins**: 2 users (passwordless login enabled)
  - admin@linkedincontent.com (SUPER_ADMIN)
  - postinai.inc@gmail.com (SUPER_ADMIN)
- **Subscription Plans**: 6 plans configured
- **Migration Status**: All migrations applied (head: 756965604e7d)

## Note

The `.gitignore` file already includes `*.db` pattern, so database files won't be committed to git.
