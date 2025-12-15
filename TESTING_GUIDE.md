# Testing Guide - LinkedIn UI Redesign

## Quick Start

### 1. Start the Backend

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

The backend should start at `http://localhost:8000`

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend should start at `http://localhost:3000`

## Testing Checklist

### ✅ Authentication & Onboarding

1. **Login**
   - Go to `http://localhost:3000/login`
   - Enter any email (mock login)
   - Should redirect to onboarding if not completed

2. **Onboarding Flow**
   - Step 1: Choose account type (Person/Business)
   - Step 2: Choose style (Top Creators/My Style)
   - Step 3: Import posts (only if "My Style" chosen)
   - Step 4: Upload CV (PDF, DOCX, or TXT)
   - Step 5: Preview and edit preferences
   - Verify progress bar updates
   - Check LinkedIn blue colors throughout

### ✅ Dashboard & Sidebar

1. **Sidebar Navigation**
   - Verify logo appears at top
   - Check "Create a post" button (LinkedIn blue)
   - Test navigation items:
     - Copilot
     - Posts Planning
     - Comments
     - Settings
   - Verify user profile at bottom
   - Test logout button
   - Check mobile responsiveness (toggle sidebar)

2. **Conversation List**
   - Should be empty initially
   - Create a post to generate first conversation
   - Verify conversation appears in sidebar
   - Check date grouping (Today, Yesterday, etc.)
   - Test hover actions (edit/delete)
   - Try renaming a conversation
   - Test deleting a conversation

### ✅ Generate Page (Copilot)

1. **Initial State**
   - Verify top banner: "Trained on posts of top LinkedIn creators"
   - Check creator avatars display
   - See example prompts
   - Test clicking example prompts

2. **Post Generation**
   - Enter a prompt (e.g., "Write a post about AI in sales")
   - Click "Generate" button
   - Verify loading animation (LinkedIn blue dots)
   - Check structured response:
     - LinkedIn Post Preview component displays
     - User avatar and profile info shown
     - Post content formatted correctly
     - Format type indicator (text/carousel/image)
     - Action buttons appear (Copy, Regenerate)
     - Metadata shows (tone, engagement)

3. **Conversation Flow**
   - First message creates new conversation
   - Conversation appears in sidebar
   - Title auto-generated
   - Continue conversation (send another message)
   - Verify messages stack vertically
   - User messages: right-aligned, LinkedIn blue
   - AI messages: LinkedIn post preview

4. **Options Panel**
   - Click "Options" button
   - Verify options panel opens
   - Test settings:
     - Post Type: auto/text/carousel/image
     - Tone: professional/casual/thought-leader/educator
     - Length: short/medium/long
     - Hashtags: slider 0-10
   - Close options panel

5. **Post Actions**
   - Click "Copy" button - should copy to clipboard
   - Click "Regenerate" - should generate new version
   - Click "Generate Image" (if image/carousel format)
   - Click "Schedule" button
   - Click "Post to LinkedIn" button

### ✅ Posts Planning Page

1. **Navigation**
   - Click "Posts Planning" in sidebar
   - Verify page title and description

2. **Filter Tabs**
   - Test filter tabs:
     - All
     - Scheduled (empty for now)
     - Published
     - Drafts
   - Verify tab highlighting (LinkedIn blue)

3. **Posts List**
   - Should show all generated posts
   - Each post displays:
     - Format badge
     - Date with icon
     - Full LinkedIn Post Preview
     - Edit/Delete/More actions
   - Test empty state if no posts

4. **Comments Tab**
   - Switch to Comments tab
   - Should show generated comments
   - Verify worthiness score display

### ✅ Settings Page

1. **Tabs**
   - Test 3 tabs: Preferences, Profile, Account
   - Verify active tab styling (LinkedIn blue)

2. **Preferences Tab**
   - See post type distribution sliders
   - Verify visual progress bars
   - Test adjusting percentages
   - Check hashtag count slider
   - Verify changes reflect in UI

3. **Profile Tab**
   - See profile management buttons
   - Verify disabled state (coming soon)

4. **Account Tab**
   - See current plan (Free)
   - Verify upgrade button

5. **Save Changes**
   - Adjust some preferences
   - Click "Save Changes" button (fixed at bottom)
   - Should show success message

### ✅ Design System Verification

1. **Colors**
   - Primary: LinkedIn Blue (#0A66C2) - buttons, active states
   - Background: LinkedIn Gray (#F3F2F0)
   - Surface: White cards
   - Text: Black primary, gray secondary
   - Borders: LinkedIn border gray (#E0DFDC)

2. **Typography**
   - System fonts (matches LinkedIn)
   - Font weights: normal, medium, semibold, bold
   - Consistent heading sizes

3. **Spacing**
   - 8px grid system throughout
   - Generous whitespace
   - Consistent padding in cards

4. **Animations**
   - 200ms transitions
   - Smooth hover effects
   - Loading spinners (LinkedIn blue)
   - Button hover states

5. **Shadows**
   - Card shadows (soft, medium, large)
   - Consistent elevation

### ✅ Mobile Responsiveness

1. **Test on Mobile Viewport** (Chrome DevTools)
   - Sidebar becomes overlay
   - Mobile header with menu button
   - Content stacks properly
   - Buttons remain accessible
   - LinkedIn Post Preview scales
   - Text remains readable

## API Testing

### Test Conversation Endpoints

```bash
# List conversations (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/conversations

# Create conversation
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"initial_message": "Test conversation"}' \
  http://localhost:8000/api/conversations

# Get conversation
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/conversations/{conversation_id}

# Update title
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"title": "New Title"}' \
  http://localhost:8000/api/conversations/{conversation_id}/title

# Delete conversation
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/conversations/{conversation_id}
```

### Test Generation with Conversation

```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "message": "Write a post about AI",
    "options": {"post_type": "text", "tone": "professional"},
    "conversation_id": "CONVERSATION_ID"
  }' \
  http://localhost:8000/api/generate/post
```

## Common Issues & Solutions

### Issue: Backend fails to start
- Check if port 8000 is already in use
- Verify virtual environment is activated
- Check database connection

### Issue: Frontend fails to start
- Run `npm install` to ensure dependencies
- Check if port 3000 is available
- Verify `.env` file if present

### Issue: API calls fail
- Check CORS settings in backend
- Verify API_URL in frontend (default: http://localhost:8000)
- Check browser console for errors

### Issue: Conversations not saving
- Verify database tables created (check backend logs)
- Test conversation endpoints directly
- Check auth token is valid

### Issue: LinkedIn Post Preview not displaying
- Check browser console for errors
- Verify component imports
- Check CSS classes are loading

## Performance Checks

1. **Page Load Times**
   - Initial load: < 2 seconds
   - Navigation: instant (< 100ms)
   - Generation: depends on AI (5-15 seconds)

2. **Animations**
   - Smooth 60fps transitions
   - No janky scrolling
   - Responsive hover effects

3. **API Response Times**
   - List conversations: < 200ms
   - Generate post: 5-15 seconds (AI processing)
   - Update preferences: < 500ms

## Success Criteria

✅ All pages render correctly with LinkedIn styling
✅ Conversations can be created, viewed, edited, and deleted
✅ Post generation returns structured JSON
✅ LinkedIn Post Preview displays properly
✅ All navigation works smoothly
✅ Mobile responsive throughout
✅ No console errors
✅ No linter errors

## Next Steps After Testing

1. Gather user feedback
2. Add scheduled posting feature
3. Implement image generation
4. Add LinkedIn OAuth integration
5. Enhance analytics dashboard

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify database schema is up to date
4. Ensure all dependencies are installed
5. Review IMPLEMENTATION_SUMMARY.md for details

