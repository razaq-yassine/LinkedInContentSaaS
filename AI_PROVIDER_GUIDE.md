# AI Provider Configuration Guide

The application now supports **both OpenAI and Google Gemini** as AI providers!

## ✅ Current Configuration

**Active Provider:** Gemini (Google)  
Location: `/Users/yrazaq/Documents/LinkedInContentSaaS/backend/.env`

## 🔧 How to Configure

Edit the `.env` file in the backend directory:

```bash
# Choose your AI provider
AI_PROVIDER=gemini          # Options: "gemini" or "openai"

# OpenAI Configuration (kept for easy switching)
OPENAI_API_KEY=sk-your-openai-key-here

# Gemini Configuration
GEMINI_API_KEY=your-gemini-key-here
```

## 🔄 Switching Between Providers

### Switch to Gemini (Current):
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-actual-gemini-key
```

### Switch to OpenAI:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-openai-key
```

**After changing:** Restart the backend server (I can do this for you!)

## 📝 Getting API Keys

### Gemini API Key:
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Add to `.env` as `GEMINI_API_KEY`

### OpenAI API Key:
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key
4. Add to `.env` as `OPENAI_API_KEY`

## 🎯 Models Used

**Gemini:**
- Model: `gemini-1.5-flash` (fast and efficient)
- Can be changed to `gemini-1.5-pro` for higher quality

**OpenAI:**
- Model: `gpt-4o` (default)
- High quality responses

## 💡 Features

✅ Both providers fully integrated  
✅ Easy switching via environment variable  
✅ All existing code works with both  
✅ No code changes needed to switch  
✅ OpenAI code preserved for easy rollback  

## 🔍 How It Works

The application uses a wrapper function that:
1. Checks the `AI_PROVIDER` environment variable
2. Routes to the appropriate AI service (Gemini or OpenAI)
3. Returns the generated content

All your existing endpoints work the same way:
- Profile generation
- Writing style analysis
- Post generation
- Comment generation
- Worthiness evaluation

## 📊 Cost Comparison

**Gemini 1.5 Flash:**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens
- Very fast, cost-effective

**OpenAI GPT-4o:**
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens
- Higher quality, more expensive

## 🐛 Troubleshooting

**Error: "Gemini API key not configured"**
- Add your Gemini API key to `.env`
- Restart the backend

**Error: "OpenAI API key not configured"**
- If using OpenAI, add your OpenAI API key to `.env`
- Or switch to Gemini

**Want to switch providers?**
- Edit `AI_PROVIDER` in `.env`
- Let me know and I'll restart the server for you!

---

**Current Status:** ✅ Running with Gemini  
**Backend:** http://localhost:8000  
**Frontend:** http://localhost:3000


