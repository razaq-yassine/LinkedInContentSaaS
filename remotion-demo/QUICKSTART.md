# Quick Start Guide

## 🚀 Start the Studio

```bash
cd remotion-demo
npm start
```

The Remotion Studio will open at `http://localhost:3000`

## 🎬 What You'll See

A 30-second SaaS demo video with:
- ✨ Animated brand intro
- 🎯 Problem/solution narrative
- 💡 Feature showcase
- 💰 Pricing display
- 📢 Strong call-to-action

## 🎨 Quick Customizations

### Change Brand Name
Edit `src/Root.tsx`:
```tsx
brandName: "YourBrand"
```

### Modify Colors
Each component has gradient backgrounds:
- Opening: Purple gradient (`#667eea` to `#764ba2`)
- Problem: Dark blue (`#1e3a8a` to `#312e81`)
- Solution: Green (`#10b981` to `#059669`)
- Features: Indigo/Purple (`#6366f1` to `#8b5cf6`)
- Pricing: Dark slate (`#0f172a` to `#1e293b`)
- CTA: Purple gradient (`#667eea` to `#764ba2`)

### Update Features
Edit `src/components/Features.tsx` - modify the `features` array

### Change Pricing
Edit `src/components/Pricing.tsx` - modify the `plans` array

## 📹 Render Video

```bash
npm run build
```

Output: `out/video.mp4`

## 💡 Pro Tips

1. Use the timeline scrubber in Studio to preview animations
2. Press Space to play/pause
3. Use arrow keys for frame-by-frame navigation
4. Adjust frame rate/resolution in `src/Root.tsx`
5. Add audio by importing and using `<Audio>` component

## 🎯 Video Timeline

- 0-4s: Opening
- 4-8s: Problem
- 8-12s: Solution
- 12-20s: Features
- 20-25s: Pricing
- 25-30s: CTA

## 🔧 Advanced

### Add Logo Image
Replace text logo in `Opening.tsx` with:
```tsx
<img src={staticFile("logo.png")} />
```

### Add Background Music
In `SaaSDemo.tsx`:
```tsx
import {Audio} from 'remotion';
<Audio src={staticFile("music.mp3")} />
```

### Export Different Formats
```bash
# 4K video
remotion render src/index.ts SaaSDemo out/4k.mp4 --width=3840 --height=2160

# Square format (Instagram)
remotion render src/index.ts SaaSDemo out/square.mp4 --width=1080 --height=1080

# Vertical (TikTok/Stories)
remotion render src/index.ts SaaSDemo out/vertical.mp4 --width=1080 --height=1920
```
