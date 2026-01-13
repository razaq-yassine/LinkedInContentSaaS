"""
Usage tracking service for monitoring AI service consumption
"""
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
import uuid

from ..models import UsageTracking, ServiceType, GeneratedPost, User, Subscription, SubscriptionPlanConfig
from .cost_calculator import (
    calculate_text_generation_cost,
    calculate_cloudflare_image_cost,
    calculate_brave_search_cost,
    cost_to_cents,
    cents_to_cost
)


def log_text_generation(
    db: Session,
    user_id: str,
    post_id: Optional[str],
    input_tokens: int,
    output_tokens: int,
    model: str,
    provider: str,
    metadata: Optional[Dict] = None
) -> UsageTracking:
    """
    Log text generation usage
    
    Args:
        db: Database session
        user_id: User ID
        post_id: Post ID (optional)
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        model: Model name
        provider: Provider name (openai, gemini, claude)
        metadata: Additional metadata
    
    Returns:
        Created UsageTracking record
    """
    total_tokens = input_tokens + output_tokens
    cost = calculate_text_generation_cost(input_tokens, output_tokens, model)
    
    usage = UsageTracking(
        id=str(uuid.uuid4()),
        user_id=user_id,
        post_id=post_id,
        service_type=ServiceType.TEXT_GENERATION,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        estimated_cost=cost_to_cents(cost),
        model=model,
        provider=provider,
        usage_metadata=metadata,
        created_at=datetime.utcnow()
    )
    
    db.add(usage)
    db.commit()
    db.refresh(usage)
    
    return usage


def log_image_generation(
    db: Session,
    user_id: str,
    post_id: Optional[str],
    image_count: int,
    height: int,
    width: int,
    num_steps: int,
    model: str,
    metadata: Optional[Dict] = None
) -> UsageTracking:
    """
    Log image generation usage
    
    Args:
        db: Database session
        user_id: User ID
        post_id: Post ID (optional)
        image_count: Number of images generated
        height: Image height
        width: Image width
        num_steps: Number of diffusion steps
        model: Model name
        metadata: Additional metadata
    
    Returns:
        Created UsageTracking record
    """
    cost_breakdown = calculate_cloudflare_image_cost(
        image_count=image_count,
        height=height,
        width=width,
        num_steps=num_steps,
        model=model
    )
    
    usage = UsageTracking(
        id=str(uuid.uuid4()),
        user_id=user_id,
        post_id=post_id,
        service_type=ServiceType.IMAGE_GENERATION,
        input_tokens=0,
        output_tokens=0,
        total_tokens=0,
        estimated_cost=cost_to_cents(cost_breakdown["total_cost"]),
        model=model,
        provider="cloudflare",
        image_count=image_count,
        tiles=cost_breakdown["tiles_per_image"],
        steps=cost_breakdown["steps_per_image"],
        usage_metadata=metadata,
        created_at=datetime.utcnow()
    )
    
    db.add(usage)
    db.commit()
    db.refresh(usage)
    
    return usage


def log_search_usage(
    db: Session,
    user_id: str,
    post_id: Optional[str],
    search_count: int = 1,
    search_query: Optional[str] = None,
    metadata: Optional[Dict] = None
) -> UsageTracking:
    """
    Log Brave Search API usage
    
    Args:
        db: Database session
        user_id: User ID
        post_id: Post ID (optional)
        search_count: Number of searches performed
        search_query: Search query (optional)
        metadata: Additional metadata
    
    Returns:
        Created UsageTracking record
    """
    cost = calculate_brave_search_cost(search_count, db)
    
    usage = UsageTracking(
        id=str(uuid.uuid4()),
        user_id=user_id,
        post_id=post_id,
        service_type=ServiceType.SEARCH,
        input_tokens=0,
        output_tokens=0,
        total_tokens=0,
        estimated_cost=cost_to_cents(cost),
        model="brave-search",
        provider="brave",
        search_count=search_count,
        search_query=search_query,
        usage_metadata=metadata,
        created_at=datetime.utcnow()
    )
    
    db.add(usage)
    db.commit()
    db.refresh(usage)
    
    return usage


def get_usage_summary(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get usage summary with aggregated metrics
    
    Args:
        db: Database session
        start_date: Filter by start date (optional)
        end_date: Filter by end date (optional)
        user_id: Filter by user ID (optional)
    
    Returns:
        Dictionary with usage summary
    """
    query = db.query(UsageTracking)
    
    # Apply filters
    if start_date:
        query = query.filter(UsageTracking.created_at >= start_date)
    if end_date:
        query = query.filter(UsageTracking.created_at <= end_date)
    if user_id:
        query = query.filter(UsageTracking.user_id == user_id)
    
    # Get all usage records
    records = query.all()
    
    # Aggregate metrics
    total_tokens = sum(r.total_tokens for r in records)
    total_cost_cents = sum(r.estimated_cost for r in records)
    total_cost = cents_to_cost(total_cost_cents)
    
    # Breakdown by service
    service_breakdown = {}
    for service_type in ServiceType:
        service_records = [r for r in records if r.service_type == service_type]
        service_cost = sum(r.estimated_cost for r in service_records)
        service_tokens = sum(r.total_tokens for r in service_records)
        
        service_breakdown[service_type.value] = {
            "count": len(service_records),
            "tokens": service_tokens,
            "cost": cents_to_cost(service_cost)
        }
    
    # Breakdown by model
    model_breakdown = {}
    for record in records:
        if record.model not in model_breakdown:
            model_breakdown[record.model] = {
                "count": 0,
                "tokens": 0,
                "cost": 0.0
            }
        model_breakdown[record.model]["count"] += 1
        model_breakdown[record.model]["tokens"] += record.total_tokens
        model_breakdown[record.model]["cost"] += cents_to_cost(record.estimated_cost)
    
    # Round model costs
    for model in model_breakdown:
        model_breakdown[model]["cost"] = round(model_breakdown[model]["cost"], 2)
    
    return {
        "total_tokens": total_tokens,
        "total_cost": total_cost,
        "total_requests": len(records),
        "service_breakdown": service_breakdown,
        "model_breakdown": model_breakdown
    }


def get_user_usage(
    db: Session,
    user_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Get usage for a specific user
    
    Args:
        db: Database session
        user_id: User ID
        start_date: Filter by start date (optional)
        end_date: Filter by end date (optional)
    
    Returns:
        Dictionary with user usage details
    """
    return get_usage_summary(db, start_date, end_date, user_id)


def get_top_users_by_usage(
    db: Session,
    limit: int = 10,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    sort_by: str = "cost"  # "cost", "tokens", "requests"
) -> List[Dict[str, Any]]:
    """
    Get top users ranked by usage
    
    Args:
        db: Database session
        limit: Number of users to return
        start_date: Filter by start date (optional)
        end_date: Filter by end date (optional)
        sort_by: Sort metric ("cost", "tokens", "requests")
    
    Returns:
        List of users with usage stats
    """
    query = db.query(
        UsageTracking.user_id,
        func.sum(UsageTracking.total_tokens).label("total_tokens"),
        func.sum(UsageTracking.estimated_cost).label("total_cost"),
        func.count(UsageTracking.id).label("total_requests")
    )
    
    # Apply filters
    if start_date:
        query = query.filter(UsageTracking.created_at >= start_date)
    if end_date:
        query = query.filter(UsageTracking.created_at <= end_date)
    
    # Group by user
    query = query.group_by(UsageTracking.user_id)
    
    # Sort
    if sort_by == "cost":
        query = query.order_by(func.sum(UsageTracking.estimated_cost).desc())
    elif sort_by == "tokens":
        query = query.order_by(func.sum(UsageTracking.total_tokens).desc())
    else:  # requests
        query = query.order_by(func.count(UsageTracking.id).desc())
    
    # Limit
    query = query.limit(limit)
    
    results = query.all()
    
    # Fetch user details
    top_users = []
    for result in results:
        user = db.query(User).filter(User.id == result.user_id).first()
        if user:
            # Get subscription info
            subscription = db.query(Subscription).filter(
                Subscription.user_id == user.id
            ).first()
            
            top_users.append({
                "user_id": user.id,
                "email": user.email,
                "name": user.name,
                "total_tokens": result.total_tokens,
                "total_cost": cents_to_cost(result.total_cost),
                "total_requests": result.total_requests,
                "subscription_plan": subscription.plan.value if subscription else "free"
            })
    
    return top_users


def get_usage_timeline(
    db: Session,
    start_date: datetime,
    end_date: datetime,
    granularity: str = "day"  # "day", "week", "month"
) -> List[Dict[str, Any]]:
    """
    Get usage timeline data for charting
    
    Args:
        db: Database session
        start_date: Start date
        end_date: End date
        granularity: Time granularity ("day", "week", "month")
    
    Returns:
        List of time series data points
    """
    # Query usage grouped by date
    if granularity == "day":
        date_func = func.date(UsageTracking.created_at)
    elif granularity == "week":
        date_func = func.strftime('%Y-W%W', UsageTracking.created_at)
    else:  # month
        date_func = func.strftime('%Y-%m', UsageTracking.created_at)
    
    query = db.query(
        date_func.label("date"),
        func.sum(UsageTracking.total_tokens).label("tokens"),
        func.sum(UsageTracking.estimated_cost).label("cost"),
        func.count(UsageTracking.id).label("requests")
    ).filter(
        and_(
            UsageTracking.created_at >= start_date,
            UsageTracking.created_at <= end_date
        )
    ).group_by(date_func).order_by(date_func)
    
    results = query.all()
    
    timeline = []
    for result in results:
        timeline.append({
            "date": str(result.date),
            "tokens": result.tokens or 0,
            "cost": cents_to_cost(result.cost or 0),
            "requests": result.requests or 0
        })
    
    return timeline


def get_revenue_summary(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Calculate revenue from subscriptions
    
    Args:
        db: Database session
        start_date: Filter by start date (optional)
        end_date: Filter by end date (optional)
    
    Returns:
        Dictionary with revenue summary
    """
    # Get all active subscriptions
    subscriptions = db.query(Subscription).all()
    
    # Get plan configs
    plan_configs = db.query(SubscriptionPlanConfig).all()
    plan_config_map = {config.plan_name: config for config in plan_configs}
    
    total_monthly_revenue = 0
    total_yearly_revenue = 0
    subscription_breakdown = {}
    
    for subscription in subscriptions:
        plan_name = subscription.plan.value
        config = plan_config_map.get(plan_name)
        
        if config:
            total_monthly_revenue += config.price_monthly
            total_yearly_revenue += config.price_yearly
            
            if plan_name not in subscription_breakdown:
                subscription_breakdown[plan_name] = {
                    "count": 0,
                    "monthly_revenue": 0,
                    "yearly_revenue": 0
                }
            
            subscription_breakdown[plan_name]["count"] += 1
            subscription_breakdown[plan_name]["monthly_revenue"] += config.price_monthly
            subscription_breakdown[plan_name]["yearly_revenue"] += config.price_yearly
    
    return {
        "total_monthly_revenue": total_monthly_revenue / 100,  # Convert cents to dollars
        "total_yearly_revenue": total_yearly_revenue / 100,
        "subscription_breakdown": subscription_breakdown
    }


