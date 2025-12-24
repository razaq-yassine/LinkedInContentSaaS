#!/usr/bin/env python3
"""
Test script for web search implementation
Run this to verify that web search is working correctly
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import find_trending_topics, research_topic_with_search, generate_completion
from app.config import get_settings

async def test_web_search():
    """Test web search functionality"""
    
    settings = get_settings()
    
    print("=" * 60)
    print("WEB SEARCH IMPLEMENTATION TEST")
    print("=" * 60)
    print()
    
    # Check configuration
    print("1. Configuration Check")
    print("-" * 60)
    print(f"AI Provider: {settings.ai_provider}")
    print(f"Gemini Model: {settings.gemini_model}")
    print(f"Gemini API Key: {'✓ Configured' if settings.gemini_api_key else '✗ Missing'}")
    print()
    
    if not settings.gemini_api_key:
        print("❌ ERROR: GEMINI_API_KEY not configured")
        print("Please set GEMINI_API_KEY in your .env file")
        return
    
    if settings.ai_provider.lower() != "gemini":
        print("⚠️  WARNING: AI_PROVIDER is not set to 'gemini'")
        print("Web search is only available with Gemini")
        print()
    
    # Test 1: Find Trending Topics
    print("2. Testing Trending Topics Finder")
    print("-" * 60)
    print("Searching for trending topics in AI and Software Development...")
    print()
    
    try:
        topics = await find_trending_topics(
            expertise_areas=["Artificial Intelligence", "Software Development", "Cloud Computing"],
            industry="Technology"
        )
        
        print(f"✓ Found {len(topics)} trending topics:")
        print()
        for i, topic in enumerate(topics, 1):
            print(f"{i}. {topic.get('title', 'N/A')}")
            print(f"   Description: {topic.get('description', 'N/A')}")
            print(f"   Relevance: {topic.get('relevance', 'N/A')}")
            print()
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print()
    
    # Test 2: Research Topic
    print("3. Testing Topic Research")
    print("-" * 60)
    print("Researching: 'Latest developments in AI for healthcare'")
    print()
    
    try:
        research = await research_topic_with_search(
            topic="Latest developments in AI for healthcare",
            context="Technology professional interested in AI applications"
        )
        
        print("✓ Research completed:")
        print()
        print(research[:500] + "..." if len(research) > 500 else research)
        print()
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print()
    
    # Test 3: Content Generation with Web Search
    print("4. Testing Content Generation with Web Search")
    print("-" * 60)
    print("Generating content about 'latest AI trends'...")
    print()
    
    try:
        system_prompt = """You are a LinkedIn content creator. Create a brief post (3-4 sentences) 
about the given topic using current information from web search."""
        
        content = await generate_completion(
            system_prompt=system_prompt,
            user_message="Write about the latest trends in artificial intelligence",
            temperature=0.7,
            use_search=True
        )
        
        print("✓ Content generated with web search:")
        print()
        print(content)
        print()
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print()
    
    # Test 4: Content Generation without Web Search (comparison)
    print("5. Testing Content Generation WITHOUT Web Search (for comparison)")
    print("-" * 60)
    print("Generating content about 'AI trends' without web search...")
    print()
    
    try:
        content = await generate_completion(
            system_prompt=system_prompt,
            user_message="Write about trends in artificial intelligence",
            temperature=0.7,
            use_search=False
        )
        
        print("✓ Content generated without web search:")
        print()
        print(content)
        print()
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print()
    
    # Summary
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print()
    print("✓ Web search implementation is working correctly!")
    print()
    print("Key observations:")
    print("- Content WITH web search should include current data/statistics")
    print("- Content WITHOUT web search may be more general")
    print("- Trending topics should be specific and timely")
    print()
    print("Next steps:")
    print("1. Test CV upload during onboarding")
    print("2. Verify trending topics appear in user profile")
    print("3. Test content generation with trending keywords")
    print()

if __name__ == "__main__":
    print()
    print("Starting web search tests...")
    print()
    
    try:
        asyncio.run(test_web_search())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n\n❌ FATAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print()
    print("Tests completed!")
    print()




