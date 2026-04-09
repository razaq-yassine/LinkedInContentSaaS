"""
Single source of truth for every AI instruction related to carousel post generation.

WHY A DICT AND NOT ONE BIG STRING?
These pieces are injected into different AI calls at different times:
  - "format_rules" + "json_format"               → always sent to the main LLM call
  - "topic_selection"                             → only added when the user clicks
                                                    "Generate random post" (is_random_request=True)
  - "image_prompt_system" + "image_prompt_user"   → used in a completely separate AI call
                                                    (generate_carousel_image_prompts) that only
                                                    fires when the main LLM fails to return
                                                    image_prompts in its JSON response

Keeping them as separate keys lets generation.py pick exactly what it needs
without wasting tokens or confusing the model with irrelevant instructions.

CONSUMERS:
  - format_instructions.py  → imports "format_rules" and "json_format"
  - templates.py            → imports "format_rules" (used as the carousel template)
  - generation.py           → imports "topic_selection", "image_prompt_system", "image_prompt_user"
"""

CAROUSEL_AI_INSTRUCTIONS = {

    # ─────────────────────────────────────────────────────────────────────
    # FORMAT RULES
    # ─────────────────────────────────────────────────────────────────────
    # WHERE:  Appended to the system prompt via both:
    #         - templates.py → get_format_specific_instructions("carousel")
    #         - format_instructions.py → get_format_instructions("carousel")
    # WHEN:   Every carousel generation request
    # WHY:    Tells the LLM the task + detailed field-level rules for
    #         post_content and image_prompts
    # ─────────────────────────────────────────────────────────────────────
    "format_rules": """Generate a LinkedIn carousel post.

Format to respect:

1. post_content: The LinkedIn post that accompanies the carousel (users read this in their feed).
   - Structure: Hook → Context/Why it matters → Key benefits or takeaways → CTA
   - The hook should grab attention (bold opinion, surprising fact, or a question)
   - Group related ideas into short paragraphs (2-3 sentences each), don't make every sentence its own line
   - Explain WHY, not just WHAT — give the reader insight they can act on
   - End with a clear takeaway
   - Do NOT just list the slide titles as sentences — the post should stand alone and be in sync with the carousel (generated images)

2. image_prompts: Array of image prompts for Image generation (REQUIRED)
   - Visual style is professional cartoon
   - Each slide illustrates 1 point from the post
   - Slides progress depending on the topic
   - Slides should have the core information
   - Format: 1200×1200px square per slide
   - Output ONLY JSON array
""",

    # ─────────────────────────────────────────────────────────────────────
    # JSON FORMAT
    # ─────────────────────────────────────────────────────────────────────
    # WHERE:  Appended to the system prompt via format_instructions.py → get_json_format("carousel")
    # WHEN:   Every carousel generation request
    # WHY:    Shows the LLM the exact JSON shape it must return so we can
    #         reliably parse title, post_content, image_prompts, and hashtags
    # ─────────────────────────────────────────────────────────────────────
    "json_format": """{
    "title": "Concise title (3-8 words)",
    "post_content": "LinkedIn post text with hashtags at end",
    "image_prompts": ["Slide 1: prompt1", "Slide 2: prompt2", "Slide 3: prompt3"],
    "hashtags": ["#tag1", "#tag2", "#tag3"]
}
""",

    # ─────────────────────────────────────────────────────────────────────
    # TOPIC SELECTION (conditional)
    # ─────────────────────────────────────────────────────────────────────
    # WHERE:  Injected into the system prompt in generation.py → generate_post()
    #         (appears in both the TOON-context path and the legacy-fallback path)
    # WHEN:   ONLY when is_random_request=True AND post_type=="carousel"
    #         i.e. user clicked "Generate random post" with carousel selected
    # WHY:    Guides the LLM to pick topics that actually work as multi-slide
    #         carousels (step-by-step guides, Top-X lists, etc.) and reject
    #         topics that are too thin for slides (single facts, announcements)
    # NOTE:   NOT sent when the user provides their own topic — would waste
    #         tokens and could override the user's intent
    # ─────────────────────────────────────────────────────────────────────
    "topic_selection": """
- We want a random/fresh topic based on industry/expertise, avoid talking about an exact project from the CV.
- CAROUSEL TOPIC SELECTION RULES:
  1. ONLY propose topics that naturally break into more than 4 distinct slides/points.
  2. Prefer: step-by-step guides, "Top X" lists, frameworks, roadmaps, myths vs reality, before/after comparisons, metric/trend breakdowns, checklists, or process walkthroughs.
  3. NEVER choose topics that are single announcements, single facts, one-off opinions, or vague motivational statements.
  4. Each slide must convey a standalone point that adds value on its own while contributing to the overall narrative arc.
""",

    # ─────────────────────────────────────────────────────────────────────
    # FALLBACK IMAGE-PROMPT GENERATOR — system prompt
    # ─────────────────────────────────────────────────────────────────────
    # WHERE:  Used as the system_prompt arg in generation.py → generate_carousel_image_prompts()
    # WHEN:   ONLY when the main LLM call did NOT return an image_prompts array
    #         in its JSON response (fallback path). This triggers a second,
    #         separate AI call whose sole job is to produce image prompts
    #         from the already-generated post_content.
    # WHY:    Some models occasionally omit image_prompts. This dedicated
    #         prompt is optimized for diffusion-model prompt writing and
    #         ensures we always get slide images even if the main call fails.
    # ─────────────────────────────────────────────────────────────────────
    "image_prompt_system": """You write image generation prompts for AI image generator to create LinkedIn carousel slides.
 Array of image prompts for Image generation (REQUIRED)
   - Visual style is professional cartoon
   - Each slide illustrates 1 point from the post
   - Slides progress depending on the topic
   - Slides should have the core information
   - Format: 1200×1200px square per slide
   - Output ONLY JSON array
Return ONLY a valid JSON array of prompt strings. No explanations, no markdown.""",

    # ─────────────────────────────────────────────────────────────────────
    # FALLBACK IMAGE-PROMPT GENERATOR — user message template
    # ─────────────────────────────────────────────────────────────────────
    # WHERE:  Used as the user_message arg in generation.py → generate_carousel_image_prompts()
    # WHEN:   Same as image_prompt_system above (fallback only)
    # WHY:    Provides the post content + user context so the model can
    #         generate visually relevant, industry-appropriate slide prompts
    # PLACEHOLDERS (filled at runtime via .format()):
    #   {slide_count}   — number of slides (4-15, from user request or estimated)
    #   {post_content}  — first 800 chars of the generated post
    #   {industry}      — user's industry from profile context
    #   {expertise_str} — user's top expertise areas from profile context
    # ─────────────────────────────────────────────────────────────────────
    "image_prompt_user": """Create exactly {slide_count} carousel slide image prompts for this LinkedIn post:

POST: {post_content}

INDUSTRY: {industry} | EXPERTISE: {expertise_str}

Return ONLY a JSON array of {slide_count} strings:""",
}
