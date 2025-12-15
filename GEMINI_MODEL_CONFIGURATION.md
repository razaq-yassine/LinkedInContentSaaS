# Gemini Model Configuration Guide

## 🎯 Current Issue
You hit the rate limit for `gemini-2.5-flash` (22/20 RPD - over limit).

## ✅ Solution: Use Available Gemini Models

Based on your Google AI Studio dashboard and available models, here are the working options:

### Available Gemini Models (Stable/GA)

| Model | RPM Limit | TPM Limit | Speed | Best For |
|-------|-----------|-----------|-------|----------|
| **gemini-2.5-pro** | - | 1M | Slower | Complex reasoning, coding, large context |
| **gemini-2.5-flash** | 20 | 250K | Fast | ⚠️ **Currently over limit** (22/20) |
| **gemini-2.5-flash-lite** | 10 | 250K | Very Fast | ⭐ **Now Active** - Scale, cost-efficient |
| **gemini-2.0-flash** | - | - | Fast | Multimodal, general tasks |
| **gemini-2.0-flash-lite** | - | - | Very Fast | High-frequency, simple tasks |

### 🏆 Current Choice: `gemini-2.5-flash-lite`
- **Very fast** response times
- **Cost-efficient** and built for scale
- **Plenty of capacity** (0/10 RPM currently)
- **High throughput** (0/250K TPM)

## 📝 How to Update Your Configuration

### Step 1: Edit Your `.env` File

```bash
cd /Users/yrazaq/Documents/LinkedInContentSaaS/backend
nano .env  # or use your preferred editor (code .env, vim .env, etc.)
```

### Step 2: Add or Update This Line

```env
GEMINI_MODEL=gemini-2.5-flash-lite
```

Your `.env` file should look like this:

```env
# AI Provider
AI_PROVIDER=gemini

# Gemini Configuration
GEMINI_API_KEY=your-actual-api-key-here
GEMINI_MODEL=gemini-2.5-flash-lite

# Other settings...
DATABASE_URL=sqlite:///./linkedin_content_saas.db
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000
```

### Step 3: Restart the Backend Server

1. **Stop the current backend** (Ctrl+C in the backend terminal)
2. **Start it again**:
   ```bash
   cd /Users/yrazaq/Documents/LinkedInContentSaaS/backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

## 🔄 Alternative: If You Want to Use OpenAI

If you have an OpenAI API key and want to use GPT models instead:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o, gpt-3.5-turbo
```

## 🧪 Testing After Configuration

1. Go to http://localhost:3000
2. Try generating a LinkedIn post
3. Should work without rate limit errors now!

## 📊 Model Comparison

### gemini-2.5-flash-lite vs gemini-2.5-flash

| Feature | gemini-2.5-flash-lite | gemini-2.5-flash |
|---------|----------------------|------------------|
| **Rate Limit** | 10 RPM ✅ | 20 RPM ⚠️ |
| **Current Usage** | 0/10 (available!) | 22/20 (blocked!) |
| **Speed** | Very Fast ⚡⚡ | Fast ⚡ |
| **Quality** | Good ✅ | Excellent ✨ |
| **Cost** | Free tier | Free tier (limited) |
| **Best For** | Scale, high-throughput | Balanced intelligence |

## 🎨 Model Selection Guidelines

### For Development (Testing):
→ Use **gemini-2.5-flash-lite** (very fast, built for scale) ✅ **Currently Active**

### For Production (Best Quality):
→ Use **gemini-2.5-pro** (complex reasoning) OR **gpt-4o** (OpenAI)

### For Maximum Speed:
→ Use **gemini-2.0-flash-lite** (ultra-efficient for simple tasks)

### For Maximum Quality:
→ Use **gemini-2.5-pro** OR **gpt-4o** (OpenAI)

## 🚀 Quick Commands

### Check Current Model in Use:
```bash
cd /Users/yrazaq/Documents/LinkedInContentSaaS/backend
grep GEMINI_MODEL .env
```

### Switch Models:
```bash
# Edit .env
nano .env

# Change GEMINI_MODEL=gemma-3-2b
# Save and exit (Ctrl+X, Y, Enter in nano)

# Restart backend
pkill -f "uvicorn app.main:app"
uvicorn app.main:app --reload --port 8000
```

## 📚 Additional Resources

- **Gemini Pricing**: https://ai.google.dev/pricing
- **Model Docs**: https://ai.google.dev/gemini-api/docs/models
- **Rate Limits**: https://ai.google.dev/gemini-api/docs/rate-limits

## ✨ Code Changes Made

The application now supports configurable models via environment variables:

1. ✅ Added `GEMINI_MODEL` to config (`backend/app/config.py`)
2. ✅ Added `OPENAI_MODEL` to config
3. ✅ Updated AI service to use configured model (`backend/app/services/ai_service.py`)
4. ✅ Created `.env.example` with all options

No code changes needed - just update your `.env` file!

