# Quick Start Guide - LinkedIn Content SaaS

## Prerequisites Check

```bash
# Check Node.js
node --version  # Should be 18+

# Check Python
python3 --version  # Should be 3.11+

# Check MySQL
mysql --version  # Should be 8.0+
```

## Step 1: Start MySQL

```bash
# Start MySQL service
brew services start mysql

# Or manually
mysql.server start

# Wait a few seconds for it to start
sleep 5

# Verify it's running
mysql -u root -e "SELECT 1"
```

## Step 2: Initialize Database

```bash
cd /Users/yrazaq/Documents/LinkedInContentSaaS

# Install Python dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run database initialization
cd ..
python database/seed_data.py
```

Expected output:
```
🚀 Initializing LinkedIn Content SaaS Database
--------------------------------------------------
Creating database tables...
✅ Database tables created successfully
✅ Seeded 5 admin settings
✅ Created sample user: test@example.com (ID: ...)
--------------------------------------------------
✅ Database initialization completed successfully!
```

## Step 3: Configure Environment Variables

### Backend (.env)

Create `/Users/yrazaq/Documents/LinkedInContentSaaS/backend/.env`:

```env
DATABASE_URL=mysql+pymysql://root@localhost:3306/linkedin_content_saas
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this
FRONTEND_URL=http://localhost:3000
```

**⚠️ IMPORTANT**: Replace `sk-your-actual-openai-api-key-here` with your real OpenAI API key!

### Frontend (.env.local)

Create `/Users/yrazaq/Documents/LinkedInContentSaaS/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Step 4: Start Backend

```bash
cd /Users/yrazaq/Documents/LinkedInContentSaaS/backend
source venv/bin/activate
python -m app.main
```

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
✅ Database tables created successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Backend is now running at: http://localhost:8000**
- API Docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Step 5: Start Frontend (New Terminal)

```bash
cd /Users/yrazaq/Documents/LinkedInContentSaaS/frontend
npm run dev
```

Expected output:
```
▲ Next.js 16.0.10
- Local:        http://localhost:3000
```

**Frontend is now running at: http://localhost:3000**

## Step 6: Test the Application

1. **Open browser**: http://localhost:3000

2. **Login with mock account**:
   - Email: `test@example.com`
   - Click "Mock Login (Dev Only)"

3. **Complete onboarding**:
   - Step 1: Select "Personal Profile"
   - Step 2: Choose "Top Creators Format" or "My Personal Style"
   - Step 3: (Optional) Add sample posts
   - Step 4: Upload a PDF CV (use any PDF file for testing)
   - Step 5: Review and complete

4. **Generate content**:
   - Go to "Generate" tab
   - Type: "Generate a post about AI in sales"
   - Click Send

5. **Test comment generator**:
   - Go to "Comments" tab
   - Paste any LinkedIn post text
   - Click "Evaluate Worthiness"

## Troubleshooting

### MySQL Not Starting

```bash
# Check status
brew services list | grep mysql

# Try restarting
brew services restart mysql

# Or manually
mysql.server restart

# Check for error logs
tail -f /usr/local/var/mysql/*.err
```

### Backend Errors

- **"OpenAI API key not configured"**: Add your API key to `backend/.env`
- **Database connection errors**: Check MySQL is running
- **Module not found**: Run `pip install -r requirements.txt` again

### Frontend Errors

- **"Network Error"**: Check backend is running on port 8000
- **Build errors**: Run `npm install` again

## Sample Users

After initialization, you have:

1. **test@example.com** - Basic test user for manual testing

## Admin Panel

Access admin panel at: http://localhost:3000/admin

View:
- User statistics
- Generated content counts
- AI system rules
- User management

## Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Admin Panel**: http://localhost:3000/admin

## Next Steps

1. **Add your OpenAI API key** to backend/.env
2. **Create your profile** through onboarding
3. **Generate test content** to verify everything works
4. **Customize AI rules** in the admin panel if needed

## Production Deployment

See [README.md](README.md) for deployment instructions to:
- Frontend: Vercel
- Backend: Railway or Render
- Database: PlanetScale or managed MySQL


