"""
Brave Search API Service
Provides unified web search across all AI models
Verified implementation using latest Brave API specs (2026)
"""
import httpx
from typing import Dict, List, Optional
from ..config import get_settings

settings = get_settings()

async def search_web(
    query: str,
    count: int = 10,
    search_lang: str = "en",
    country: str = "us"
) -> Dict:
    """
    Perform web search using Brave Search API
    
    API Documentation: https://brave.com/search/api/
    Free tier: 2,000 queries/month
    Paid: $5-9 per 1,000 searches
    
    Args:
        query: Search query
        count: Number of results to return (1-20)
        search_lang: Language for search
        country: Country code for search
    
    Returns:
        Dictionary containing search results
    """
    if not settings.brave_api_key:
        raise ValueError("Brave API key not configured")
    
    headers = {
        "X-Subscription-Token": settings.brave_api_key,  # Verified header name
        "Accept": "application/json"
    }
    
    params = {
        "q": query,
        "count": min(count, 20),  # Max 20 results per API limits
        "search_lang": search_lang,
        "country": country
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://api.search.brave.com/res/v1/web/search",  # Verified endpoint
                headers=headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise Exception(f"Brave Search API error: {str(e)}")


def format_search_results(results: Dict, max_results: int = 5) -> str:
    """
    Format Brave search results for AI context
    
    Args:
        results: Raw Brave API response
        max_results: Maximum number of results to include
    
    Returns:
        Formatted string for AI context
    """
    if not results.get("web") or not results["web"].get("results"):
        return "No search results found."
    
    web_results = results["web"]["results"][:max_results]
    
    formatted = "Web Search Results:\n\n"
    for idx, result in enumerate(web_results, 1):
        title = result.get("title", "No title")
        url = result.get("url", "")
        description = result.get("description", "No description")
        
        formatted += f"{idx}. {title}\n"
        formatted += f"   URL: {url}\n"
        formatted += f"   {description}\n\n"
    
    return formatted


