---
name: Modern LinkedIn UI Redesign & Conversation Management
overview: ""
todos:
  - id: 7e700710-64c7-414f-aa71-0cb953422feb
    content: Create project structure and initialize Next.js frontend + FastAPI backend
    status: pending
  - id: 715b77cb-5424-40b4-8c3e-c7ca3bb9e8d5
    content: Create MySQL database schema with all tables and seed admin settings
    status: pending
  - id: e313d5fc-7c98-4829-93f0-c8915ee1f749
    content: Build FastAPI core infrastructure (MySQL connection, auth, file uploads)
    status: pending
  - id: 4aed7587-0e46-4c58-8bc4-93d618d4db9e
    content: Implement onboarding API endpoints (CV upload, post import, processing)
    status: pending
  - id: 81d6e7bc-341a-49bc-bcdd-1688c3d19fdc
    content: Build AI service layer (profile generator, writing style analyzer, prompt engine)
    status: pending
  - id: 8f3f7706-319c-411f-8144-f23a08a1d25d
    content: Implement post and comment generation endpoints with worthiness evaluation
    status: pending
  - id: ba679fff-1ca3-4415-b546-bbd803dc25dd
    content: Build user settings and admin panel API endpoints
    status: pending
  - id: f3ebccef-825b-4219-8245-13a8be1d6af7
    content: Set up Next.js with Shadcn UI, layouts, and routing structure
    status: pending
  - id: bb4d2dc2-77d6-413a-a26f-1dd6ff4aa170
    content: Build landing page and authentication pages (with mock login)
    status: pending
  - id: efa29b51-4c66-41f4-94a9-4ce1f236c371
    content: Build onboarding wizard (4 steps) with preview and preferences editing
    status: pending
  - id: a11757fe-fae7-4b1d-9f07-30c4426e7337
    content: Build post generation page with chat interface and toggle controls
    status: pending
---

# Modern LinkedIn UI Redesign & Conversation Management

## Backend Changes

### 1. Database Schema Updates

Add new table for conversation management in [`database/init.sql`](database/init.sql):

```sql
CREATE TABLE conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Update `generated_posts` table to link conversations:

- Add `conversation_id VARCHAR(36)` column
- Add foreign key to `conversations` table

### 2. Add SQLAlchemy Models

In [`backend/app/models.py`](backend/app/models.py):

- Add `Conversation` model with fields: id, user_id, title, created_at, updated_at
- Update `GeneratedPost` model to include `conversation_id` field

### 3. Update AI Response Structure

Modify [`backend/app/routers/generation.py`](backend/app/routers/generation.py):

- Return structured JSON instead of plain text
- Response format:
  ```json
  {
    "post_content": "...",
    "format_type": "text|carousel|image",
    "image_prompt": "...",
    "metadata": {
      "hashtags": ["tag1", "tag2"],
      "tone": "professional",
      "estimated_engagement": "high"
    }
  }
  ```


### 4. Create Conversation Management Endpoints

New router [`backend/app/routers/conversations.py`](backend/app/routers/conversations.py):

- `GET /api/conversations` - List user's conversations with preview
- `GET /api/conversations/{id}` - Get conversation with all messages
- `POST /api/conversations` - Create new conversation
- `PUT /api/conversations/{id}/title` - Rename conversation
- `DELETE /api/conversations/{id}` - Delete conversation

### 5. Auto-Generate Conversation Titles

In [`backend/app/services/ai_service.py`](backend/app/services/ai_service.py):

- Add `generate_conversation_title(first_message: str)` function
- Use AI to create concise 3-5 word title based on first user message
- Example: "AI in Sales Strategy" from "I want to write about AI in sales"

### 6. Update Schemas

New file [`backend/app/schemas/conversation.py`](backend/app/schemas/conversation.py):

- `ConversationResponse` - id, title, created_at, updated_at, message_count, last_message_preview
- `ConversationDetailResponse` - full conversation with all messages
- `CreateConversationRequest` - initial message
- `UpdateConversationTitleRequest` - new title

## Frontend Changes

### 7. LinkedIn Color System & Design Tokens

Create [`frontend/lib/linkedin-theme.ts`](frontend/lib/linkedin-theme.ts):

```typescript
export const linkedinColors = {
  primary: '#0A66C2',      // LinkedIn blue
  primaryHover: '#004182',
  primaryLight: '#378FE9',
  background: '#F3F2F0',   // LinkedIn gray
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0DFDC',
  success: '#057642',
  // ... more colors
}
```

Update [`frontend/app/globals.css`](frontend/app/globals.css) with LinkedIn-inspired design tokens.

### 8. Redesigned Sidebar Layout

Complete redesign of [`frontend/app/(dashboard)/layout.tsx`](frontend/app/\\\\\(dashboard)/layout.tsx):

**New sidebar structure:**

- Logo at top
- "Create a post" button (prominent, LinkedIn blue)
- Active conversation indicator
- Conversation history section:
  - "Today" group
  - "Yesterday" group  
  - "Previous 7 Days" group
  - "Older" group (collapsed by default)
- Navigation items:
  - Copilot (current chat)
  - Posts Planning (scheduled posts page)
  - Analytics (placeholder)
  - Settings
- User profile at bottom with avatar and name

**Implementation:**

- Left sidebar: 280px fixed width
- Collapsible on mobile
- Smooth animations for hover states
- LinkedIn color scheme throughout
- Icons from lucide-react (replace emojis)

### 9. LinkedIn Post Preview Component

New component [`frontend/components/LinkedInPostPreview.tsx`](frontend/components/LinkedInPostPreview.tsx):

**Structure:**

- User avatar and profile info (name, headline, timestamp)
- Post content (formatted with proper line breaks)
- Action buttons area:
  - "Generate Image" button (if format is image/auto)
  - "Schedule" button
  - "Post Now" button
- LinkedIn-style card design with proper shadows

**Props:**

- `postContent: string`
- `formatType: string`
- `imagePrompt?: string`
- `userProfile: { name, headline, avatar }`
- `onGenerateImage?: () => void`
- `onSchedule?: () => void`
- `onPost?: () => void`

### 10. Redesigned Generate Page

Major update to [`frontend/app/(dashboard)/generate/page.tsx`](frontend/app/\\\\\(dashboard)/generate/page.tsx):

**New layout:**

1. **Top banner:** "Trained on posts of top LinkedIn creators" with creator avatars
2. **Main content area (full width, centered, max 900px):**

   - Clean chat interface
   - Minimalist input box at bottom
   - Context indicator showing user's profile style

3. **Message display (stacked):**

   - User messages: right-aligned, LinkedIn blue
   - AI responses:
     - AI explanation/reasoning (if any)
     - LinkedIn Post Preview component (showing the actual post)
     - Action buttons (Copy, Regenerate, etc.)

4. **Options panel:** Collapsible settings icon (not always visible)

**Key features:**

- Parse structured JSON response from backend
- Display `post_content` in LinkedIn preview
- Show `image_prompt` in "Generate Image" button tooltip
- Better loading states (LinkedIn-style skeleton)

### 11. Conversation Management UI

New component [`frontend/components/ConversationList.tsx`](frontend/components/ConversationList.tsx):

- Display conversations grouped by date
- Show conversation title + last message preview
- Highlight active conversation
- Delete/rename options on hover
- Click to load conversation

Update API client [`frontend/lib/api-client.ts`](frontend/lib/api-client.ts):

- Add conversation endpoints
- Update generate endpoint to accept `conversation_id`

### 12. Polish Onboarding Wizard

Update all wizard steps for modern design:

[`frontend/app/(auth)/onboarding/page.tsx`](frontend/app/\\\\\(auth)/onboarding/page.tsx):

- Add progress indicator with steps (1 of 5, 2 of 5, etc.)
- Better spacing and typography
- LinkedIn color accents
- Smooth transitions between steps

[`frontend/components/wizard/Step4UploadCV.tsx`](frontend/components/wizard/Step4UploadCV.tsx):

- More modern drag-drop area
- Better file type indicators
- LinkedIn-style upload animation

[`frontend/components/wizard/Step5Preview.tsx`](frontend/components/wizard/Step5Preview.tsx):

- Card-based preview layout
- Editable inline preferences
- Better visual hierarchy

### 13. Settings Page Redesign

Update [`frontend/app/(dashboard)/settings/page.tsx`](frontend/app/\\\\\(dashboard)/settings/page.tsx):

- Tabbed interface (Profile, Preferences, Account)
- LinkedIn-style form controls
- Sliders for post type percentages with visual bars
- Save button always visible at bottom

### 14. Scheduled Posts Page

Update [`frontend/app/(dashboard)/history/page.tsx`](frontend/app/\\\\\(dashboard)/history/page.tsx) to show scheduled posts:

- Timeline view of scheduled posts
- Filter tabs: All, Scheduled, Published, Drafts
- LinkedIn post preview for each item
- Edit/reschedule/delete actions

### 15. Global UI Improvements

**Typography:**

- Use Inter or system fonts (LinkedIn-like)
- Consistent heading sizes
- Better line-height for readability

**Spacing:**

- More generous whitespace
- Consistent padding/margins (8px grid)

**Animations:**

- Smooth transitions (200ms ease)
- Hover effects on interactive elements
- Loading states everywhere

**Components:**

- Update all Shadcn components to use LinkedIn colors
- Custom button variants (primary = LinkedIn blue)
- Better focus states for accessibility

## Implementation Order

1. Backend: Database schema + models (conversations)
2. Backend: Update AI response format (structured JSON)
3. Backend: Conversation endpoints
4. Frontend: LinkedIn theme system
5. Frontend: Sidebar redesign
6. Frontend: LinkedIn Post Preview component
7. Frontend: Generate page redesign (stacked layout)
8. Frontend: Conversation management integration
9. Frontend: Onboarding polish
10. Frontend: Settings page polish
11. Testing and refinement

## Visual Design Goals

- Clean, professional LinkedIn aesthetic
- Modern card-based layouts
- Generous whitespace
- Clear visual hierarchy
- Smooth interactions
- Mobile responsive throughout

## Key Files to Modify

Backend:

- [`database/init.sql`](database/init.sql) - Add conversations table
- [`backend/app/models.py`](backend/app/models.py) - Add Conversation model
- [`backend/app/routers/generation.py`](backend/app/routers/generation.py) - Structured responses
- [`backend/app/routers/conversations.py`](backend/app/routers/conversations.py) - New router
- [`backend/app/services/ai_service.py`](backend/app/services/ai_service.py) - Title generation
- [`backend/app/schemas/conversation.py`](backend/app/schemas/conversation.py) - New schemas

Frontend:

- [`frontend/lib/linkedin-theme.ts`](frontend/lib/linkedin-theme.ts) - New theme file
- [`frontend/app/globals.css`](frontend/app/globals.css) - LinkedIn design tokens
- [`frontend/app/(dashboard)/layout.tsx`](frontend/app/\\\\\(dashboard)/layout.tsx) - Sidebar redesign
- [`frontend/components/LinkedInPostPreview.tsx`](frontend/components/LinkedInPostPreview.tsx) - New component
- [`frontend/components/ConversationList.tsx`](frontend/components/ConversationList.tsx) - New component
- [`frontend/app/(dashboard)/generate/page.tsx`](frontend/app/\\\\\(dashboard)/generate/page.tsx) - Major redesign
- [`frontend/lib/api-client.ts`](frontend/lib/api-client.ts) - Add conversation APIs
- All wizard steps - Polish UI
- Settings and History pages - Redesign