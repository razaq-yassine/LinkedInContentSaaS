# LinkedIn Content SaaS

AI-powered LinkedIn content generation platform with authentic voice matching.

## 🏗️ Architecture

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Python FastAPI + SQLAlchemy
- **Database**: MySQL 8.0
- **AI**: OpenAI GPT-4o

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- MySQL 8.0
- OpenAI API key

## 🚀 Quick Start

### 1. Start MySQL

```bash
# macOS (Homebrew)
brew services start mysql

# Or manually
mysql.server start
```

### 2. Initialize Database

```bash
# Option 1: Using MySQL CLI
mysql -u root < database/init.sql

# Option 2: Using Python script (recommended)
cd /Users/yrazaq/Documents/LinkedInContentSaaS
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
python database/seed_database.py
```

This script creates:
- Database tables and subscription plans
- **Admin account**: `postinai.inc@gmail.com` (passwordless login via email code)

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL=mysql+pymysql://root@localhost:3306/linkedin_content_saas
OPENAI_API_KEY=sk-your-key-here
JWT_SECRET_KEY=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_client_id
```

### 4. Start Backend

```bash
cd backend
source venv/bin/activate
python -m app.main
# Or with uvicorn:
uvicorn app.main:app --reload --port 8000
```

Backend will run at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 5. Start Frontend

```bash
cd frontend
npm install  # if not already done
npm run dev
```

Frontend will run at: http://localhost:3000

## 📁 Project Structure

```
LinkedInContentSaaS/
├── frontend/              # Next.js app
│   ├── app/
│   │   ├── (auth)/       # Auth pages
│   │   ├── (dashboard)/  # Dashboard pages
│   │   └── admin/        # Admin panel
│   ├── components/       # React components
│   └── lib/              # Utilities & API client
├── backend/              # FastAPI app
│   ├── app/
│   │   ├── routers/     # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── prompts/     # AI prompts
│   │   └── models.py    # Database models
│   └── uploads/         # File storage
└── database/            # SQL schemas
```

## 🧪 Testing

### Mock Login

Use the mock login button on the login page for development:
- Email: `test@example.com`
- No password required

### Sample Users

After running `seed_data.py`, you'll have:
- test@example.com (basic test user)

## 🔧 Development

### Add Shadcn UI Component

```bash
cd frontend
npx shadcn@latest add [component-name]
```

### Database Migrations

After modifying models, recreate tables:

```bash
python database/seed_data.py
```

## 📚 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel deploy
```

### Backend (Railway/Render)

1. Push code to GitHub
2. Connect repo to Railway/Render
3. Set environment variables
4. Deploy

### Database

- **Development**: Local MySQL
- **Production**: PlanetScale, Railway, or managed MySQL

## 📝 Features

- ✅ LinkedIn OAuth (mock for development)
- ✅ Onboarding wizard with CV upload
- ✅ Writing style analysis
- ✅ AI-powered post generation
- ✅ Comment worthiness evaluation
- ✅ Chat interface for generation
- ✅ User preferences management
- ✅ Admin panel
- ✅ Content history tracking

## 🔐 Security Notes

- Change `JWT_SECRET_KEY` in production
- Use environment variables for all secrets
- Enable HTTPS in production
- Configure CORS properly

## 📞 Support

For issues or questions, check:
- API docs: http://localhost:8000/docs
- Frontend dev server: http://localhost:3000

## 📄 License

Proprietary - All rights reserved


