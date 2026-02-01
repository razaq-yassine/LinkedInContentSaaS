# PotInAi SaaS Demo Video

A professional motion graphics demo video created with Remotion for the PotInAi LinkedIn Content SaaS platform.

## Video Structure

The demo video is 30 seconds long (900 frames at 30fps) and includes:

1. **Opening Scene** (0-4s): Brand introduction with logo and tagline
2. **Problem Scene** (4-8s): Highlights common LinkedIn content challenges
3. **Solution Scene** (8-12s): Introduces PotInAi as the solution
4. **Features Scene** (12-20s): Showcases 4 key features with animations
5. **Pricing Scene** (20-25s): Displays 3 pricing tiers
6. **Call to Action** (25-30s): Strong CTA with website URL

## Getting Started

### Install Dependencies

```bash
cd remotion-demo
npm install
```

### Preview the Video

```bash
npm start
```

This opens the Remotion Studio in your browser where you can:
- Preview the video in real-time
- Scrub through frames
- Edit compositions
- Adjust properties

### Render the Video

```bash
npm run build
```

This renders the video to `out/video.mp4`

## Customization

### Edit Brand Properties

Open `src/Root.tsx` and modify the `defaultProps`:

```tsx
defaultProps={{
  brandName: "Your Brand",
  tagline: "Your Tagline",
}}
```

### Modify Scenes

Each scene is in `src/components/`:
- `Opening.tsx` - Brand introduction
- `Problem.tsx` - Problem statement
- `Solution.tsx` - Solution overview
- `Features.tsx` - Feature highlights
- `Pricing.tsx` - Pricing tiers
- `CallToAction.tsx` - Final CTA

### Adjust Timing

Edit `src/SaaSDemo.tsx` to change scene durations:

```tsx
<Sequence from={0} durationInFrames={120}>
  <Opening />
</Sequence>
```

## Video Specifications

- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 FPS
- **Duration**: 30 seconds (900 frames)
- **Format**: MP4

## Technologies Used

- [Remotion](https://remotion.dev) - Video creation with React
- React 18
- TypeScript
- CSS-in-JS styling

## Next Steps

1. Customize the brand name and colors
2. Add your logo (replace text with image)
3. Update pricing details
4. Add background music
5. Render in different resolutions (4K, social media formats)
