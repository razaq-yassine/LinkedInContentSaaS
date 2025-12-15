# Image Prompt & Generate Image Buttons - Implementation Summary

## Overview
Added "Copy Image Prompt" and "Generate Image" buttons to LinkedIn post previews for image and carousel posts.

## Changes Made

### 1. LinkedInPostPreview Component (`frontend/components/LinkedInPostPreview.tsx`)

**Added Props:**
- `onGenerateImage?: () => void` - Callback for generating images from prompts

**Updated Button Logic:**
- **Copy Prompt Button**: Now always visible for image/carousel posts (disabled if no prompt exists)
  - Shows for: `formatType === 'image' || formatType === 'carousel'`
  - Enabled only when `imagePrompt` is available
  - Tooltip shows preview of prompt or "No image prompt available"

- **Generate Image Button**: New button for image generation
  - Shows for: `formatType === 'image' || formatType === 'carousel'`
  - Enabled only when `imagePrompt` is available
  - Icon: ImageIcon from lucide-react
  - Tooltip: "Generate image from prompt" or "No image prompt available"

**Button Order:**
1. Copy Text
2. Copy Prompt (for image/carousel posts)
3. Generate Image (for image/carousel posts)
4. Download (for image/carousel posts)
5. Regenerate
6. [Divider]
7. Schedule
8. Publish

### 2. Generate Page (`frontend/app/(dashboard)/generate/page.tsx`)

**Updated LinkedInPostPreview Usage:**
- `onCopyImagePrompt`: Now always provided as a callback (checks for `msg.image_prompt` internally)
- `onGenerateImage`: Added with placeholder alert for future implementation

```typescript
onCopyImagePrompt={() => {
  if (msg.image_prompt) {
    copyToClipboard(msg.image_prompt);
  }
}}
onGenerateImage={() => {
  // TODO: Implement image generation
  alert("Image generation coming soon! The prompt will be sent to an AI image generator.");
}}
```

### 3. History Page (`frontend/app/(dashboard)/history/page.tsx`)

**Updated LinkedInPostPreview Usage:**
- Added `imagePrompt` prop: `post.generation_options?.image_prompt`
- `onCopyImagePrompt`: Extracts image prompt from `post.generation_options`
- `onGenerateImage`: Added with placeholder alert for future implementation

## User Experience

### For Image/Carousel Posts:
1. **Copy Prompt Button** is always visible
   - Enabled when AI has generated an image prompt
   - Disabled (grayed out) when no prompt available
   - Clicking copies the prompt to clipboard

2. **Generate Image Button** is always visible
   - Enabled when image prompt exists
   - Disabled (grayed out) when no prompt available
   - Currently shows placeholder alert (ready for future integration)

### For Text Posts:
- Only shows: Copy Text, Regenerate, Schedule, Publish buttons
- Image-related buttons are hidden

## Future Enhancements (TODO)

### Image Generation Integration:
1. Connect to AI image generation service (DALL-E, Midjourney, Stable Diffusion, etc.)
2. Show loading state while generating
3. Display generated image in the preview area
4. Enable "Download" button once image is generated
5. Store generated image URL with the post

### Suggested Implementation:
```typescript
onGenerateImage={async () => {
  setGenerating(true);
  try {
    const response = await api.images.generate(msg.image_prompt);
    // Update message with generated image URL
    updateMessage(msg.id, { generatedImageUrl: response.data.url });
  } catch (error) {
    alert("Image generation failed. Please try again.");
  } finally {
    setGenerating(false);
  }
}}
```

## Testing

### To Test:
1. Navigate to `/generate`
2. Generate an image post (e.g., "Create a post about AI with an image")
3. Verify the following buttons appear:
   - ✅ Copy Text
   - ✅ Copy Prompt (enabled if prompt exists)
   - ✅ Generate Image (enabled if prompt exists)
   - ✅ Download (disabled initially)
   - ✅ Regenerate
   - ✅ Schedule
   - ✅ Publish

4. Click "Copy Prompt" - should copy the image prompt to clipboard
5. Click "Generate Image" - should show placeholder alert

### Test Cases:
- ✅ Image post with prompt: All buttons visible and enabled
- ✅ Image post without prompt: Image buttons visible but disabled
- ✅ Text post: Image buttons hidden
- ✅ Carousel post: Same behavior as image post

## Files Modified
1. `/frontend/components/LinkedInPostPreview.tsx` - Added new prop and buttons
2. `/frontend/app/(dashboard)/generate/page.tsx` - Updated callbacks
3. `/frontend/app/(dashboard)/history/page.tsx` - Updated callbacks and props

## No Breaking Changes
- All changes are backwards compatible
- Existing functionality remains unchanged
- New buttons are optional (controlled by props)


