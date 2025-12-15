# Cloudflare Workers AI - Setup Guide

## 🌟 What is Cloudflare Workers AI?

Cloudflare Workers AI lets you run AI models (like image generation) on Cloudflare's global network. It's:
- ⚡ **Fast** - Runs close to your users worldwide
- 💰 **Affordable** - $0.007 per 512x512 image
- 🚀 **Simple** - Just API calls, no infrastructure to manage
- 🔒 **Secure** - Built on Cloudflare's infrastructure

## 📋 Step 1: Get Cloudflare Account & API Token

### 1.1 Create Cloudflare Account
1. Go to https://dash.cloudflare.com/sign-up
2. Sign up (it's free!)
3. Verify your email

### 1.2 Get Your Account ID
1. Log in to Cloudflare Dashboard: https://dash.cloudflare.com/
2. Go to **Workers & Pages** in the left sidebar
3. Click on **Overview**
4. Copy your **Account ID** (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 1.3 Create API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Click **Use template** next to **Workers AI**
4. Or create custom with these permissions:
   - **Account** → **Workers AI** → **Read & Edit**
5. Click **Continue to summary**
6. Click **Create Token**
7. **IMPORTANT**: Copy the token immediately (you won't see it again!)
   - Looks like: `abcdef1234567890abcdef1234567890abcdef12`

## 📝 Step 2: Add Credentials to Your App

Add these to your `.env` file:

```bash
# Cloudflare Workers AI
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_API_TOKEN=your-api-token-here
```

## 🎯 Available Models

Cloudflare Workers AI has several text-to-image models:

### Recommended: **@cf/leonardo/lucid-origin**
- **Quality**: Excellent (most adaptable)
- **Speed**: Fast
- **Cost**: $0.007 per 512x512 tile, $0.00013 per step
- **Best for**: LinkedIn posts, professional graphics
- **Features**: Sharp designs, HD renders, accurate text

### Alternative: **@cf/black-forest-labs/flux-1-schnell**
- **Quality**: Very good
- **Speed**: Faster
- **Cost**: Similar pricing
- **Best for**: Quick generations

### Alternative: **@cf/stabilityai/stable-diffusion-xl-base-1.0**
- **Quality**: Good
- **Speed**: Medium
- **Cost**: Lower
- **Best for**: General images

## 💡 Why Use Cloudflare Workers AI?

### vs. DALL-E (OpenAI):
- ✅ **Much cheaper** ($0.007 vs $0.040 per image)
- ✅ **Faster** (global network)
- ✅ **No API queuing**

### vs. Midjourney:
- ✅ **API access** (programmatic)
- ✅ **Predictable pricing**
- ✅ **No Discord required**

### vs. Self-hosted Stable Diffusion:
- ✅ **No infrastructure** to manage
- ✅ **No GPU costs**
- ✅ **Scales automatically**

## 🔌 Integration Overview

Our integration will:
1. ✅ Generate images from text prompts
2. ✅ Return base64-encoded images
3. ✅ Support multiple models
4. ✅ Handle errors gracefully
5. ✅ Cache generated images (optional)

## 📊 Pricing Example

For a typical LinkedIn image post:
- **512x512 image**: $0.007
- **1024x1024 image**: $0.028 (4 tiles)
- **100 images/month**: ~$0.70 - $2.80

Compare to:
- **DALL-E 3**: $0.040 per image = $4.00 per 100
- **Midjourney**: $10/month minimum

## 🚀 Next Steps

After this setup, you'll be able to:
1. Generate images from LinkedIn post prompts
2. Display images in the post preview
3. Download generated images
4. Schedule posts with images

Let's implement it! 🎨

