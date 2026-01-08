from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta
import os
import uuid
import shutil
import csv
import io
import json

from ..database import get_db
from ..models import (
    User, UserProfile, AdminSetting, GeneratedPost, GeneratedComment,
    Subscription, SubscriptionPlan, SubscriptionPlanConfig, Conversation, Admin, UsageTracking,
    SystemLog, LogLevel
)
from ..routers.admin_auth import get_current_admin
from ..schemas.admin_schemas import (
    UserDetailResponse, UserProfileDetail, UserSubscriptionDetail, UserStatsDetail,
    SubscriptionPlanResponse, CreateSubscriptionPlanRequest, UpdateSubscriptionPlanRequest,
    GlobalSettingResponse, UpdateGlobalSettingRequest, CreateGlobalSettingRequest,
    PublicSettingsResponse, DashboardStatsResponse
)
from ..schemas.analytics import (
    UsageSummaryResponse, TopUserResponse, UserUsageDetailResponse,
    TimelineDataPoint, PostWithUsageResponse, PostsListResponse,
    PostUsageDetailResponse, AnalyticsFilters, PostsListFilters
)
from ..services.usage_tracking_service import (
    get_usage_summary, get_user_usage, get_top_users_by_usage,
    get_usage_timeline, get_revenue_summary
)
from ..services import credit_service
from ..services.cost_calculator import cents_to_cost

router = APIRouter()


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users_30d = db.query(User).join(GeneratedPost).filter(
        GeneratedPost.created_at >= thirty_days_ago
    ).distinct().count()
    
    total_posts = db.query(GeneratedPost).count()
    total_comments = db.query(GeneratedComment).count()
    
    first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    posts_this_month = db.query(GeneratedPost).filter(
        GeneratedPost.created_at >= first_day_of_month
    ).count()
    
    avg_rating = db.query(func.avg(GeneratedPost.user_rating)).filter(
        GeneratedPost.user_rating.isnot(None)
    ).scalar() or 0.0
    
    subscription_breakdown = db.query(
        Subscription.plan,
        func.count(Subscription.user_id)
    ).group_by(Subscription.plan).all()
    
    subscription_dict = {plan: count for plan, count in subscription_breakdown}
    
    plan_configs = db.query(SubscriptionPlanConfig).all()
    revenue_monthly = sum(
        config.price_monthly * subscription_dict.get(config.plan_name, 0)
        for config in plan_configs
    )
    revenue_yearly = sum(
        config.price_yearly * subscription_dict.get(config.plan_name, 0)
        for config in plan_configs
    )
    
    return DashboardStatsResponse(
        total_users=total_users,
        active_users_30d=active_users_30d,
        total_posts=total_posts,
        total_comments=total_comments,
        posts_this_month=posts_this_month,
        avg_post_rating=round(avg_rating, 2),
        subscription_breakdown=subscription_dict,
        revenue_monthly=revenue_monthly,
        revenue_yearly=revenue_yearly
    )


@router.get("/users", response_model=List[UserDetailResponse])
async def get_all_users(
    admin: Admin = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    users = db.query(User).offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        
        posts_count = db.query(GeneratedPost).filter(GeneratedPost.user_id == user.id).count()
        comments_count = db.query(GeneratedComment).filter(GeneratedComment.user_id == user.id).count()
        conversations_count = db.query(Conversation).filter(Conversation.user_id == user.id).count()
        
        avg_rating = db.query(func.avg(GeneratedPost.user_rating)).filter(
            and_(GeneratedPost.user_id == user.id, GeneratedPost.user_rating.isnot(None))
        ).scalar()
        
        last_post = db.query(GeneratedPost).filter(
            GeneratedPost.user_id == user.id
        ).order_by(GeneratedPost.created_at.desc()).first()
        
        profile_detail = None
        if profile:
            profile_detail = UserProfileDetail(
                onboarding_completed=profile.onboarding_completed,
                onboarding_step=profile.onboarding_step,
                cv_filename=profile.cv_filename,
                has_writing_samples=bool(profile.writing_samples),
                has_custom_instructions=bool(profile.custom_instructions),
                updated_at=profile.updated_at
            )
        
        subscription_detail = None
        if subscription:
            subscription_detail = UserSubscriptionDetail(
                plan=subscription.plan.value,
                credits_used_this_month=subscription.credits_used_this_month,
                credits_limit=subscription.credits_limit,
                stripe_customer_id=subscription.stripe_customer_id,
                stripe_subscription_id=subscription.stripe_subscription_id,
                current_period_end=subscription.current_period_end
            )
        
        stats = UserStatsDetail(
            total_posts=posts_count,
            total_comments=comments_count,
            total_conversations=conversations_count,
            avg_post_rating=round(avg_rating, 2) if avg_rating else None,
            last_post_date=last_post.created_at if last_post else None
        )
        
        result.append(UserDetailResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            account_type=user.account_type.value,
            email_verified=user.email_verified,
            linkedin_connected=user.linkedin_connected,
            created_at=user.created_at,
            profile=profile_detail,
            subscription=subscription_detail,
            stats=stats
        ))
    
    return result


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    
    posts_count = db.query(GeneratedPost).filter(GeneratedPost.user_id == user.id).count()
    comments_count = db.query(GeneratedComment).filter(GeneratedComment.user_id == user.id).count()
    conversations_count = db.query(Conversation).filter(Conversation.user_id == user.id).count()
    
    avg_rating = db.query(func.avg(GeneratedPost.user_rating)).filter(
        and_(GeneratedPost.user_id == user.id, GeneratedPost.user_rating.isnot(None))
    ).scalar()
    
    last_post = db.query(GeneratedPost).filter(
        GeneratedPost.user_id == user.id
    ).order_by(GeneratedPost.created_at.desc()).first()
    
    profile_detail = None
    if profile:
        profile_detail = UserProfileDetail(
            onboarding_completed=profile.onboarding_completed,
            onboarding_step=profile.onboarding_step,
            cv_filename=profile.cv_filename,
            has_writing_samples=bool(profile.writing_samples),
            has_custom_instructions=bool(profile.custom_instructions),
            updated_at=profile.updated_at
        )
    
    subscription_detail = None
    if subscription:
        subscription_detail = UserSubscriptionDetail(
            plan=subscription.plan.value,
            credits_used_this_month=subscription.credits_used_this_month,
            credits_limit=subscription.credits_limit,
            stripe_customer_id=subscription.stripe_customer_id,
            stripe_subscription_id=subscription.stripe_subscription_id,
            current_period_end=subscription.current_period_end
        )
    
    stats = UserStatsDetail(
        total_posts=posts_count,
        total_comments=comments_count,
        total_conversations=conversations_count,
        avg_post_rating=round(avg_rating, 2) if avg_rating else None,
        last_post_date=last_post.created_at if last_post else None
    )
    
    return UserDetailResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        account_type=user.account_type.value,
        email_verified=user.email_verified,
        linkedin_connected=user.linkedin_connected,
        created_at=user.created_at,
        profile=profile_detail,
        subscription=subscription_detail,
        stats=stats
    )

@router.put("/users/{user_id}/subscription")
async def update_user_subscription(
    user_id: str,
    plan: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    plan_config = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.plan_name == plan
    ).first()
    
    if not plan_config:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    # Convert string to SubscriptionPlan enum
    try:
        subscription.plan = SubscriptionPlan(plan)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")
    
    subscription.credits_limit = plan_config.credits_limit
    db.commit()
    
    return {"success": True, "message": "Subscription updated successfully"}


@router.get("/settings", response_model=List[GlobalSettingResponse])
async def get_all_settings(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    settings = db.query(AdminSetting).all()
    return [
        GlobalSettingResponse(
            id=setting.id,
            key=setting.key,
            value=setting.value,
            description=setting.description,
            updated_at=setting.updated_at
        )
        for setting in settings
    ]


@router.get("/settings/{key}", response_model=GlobalSettingResponse)
async def get_setting(
    key: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    setting = db.query(AdminSetting).filter(AdminSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    return GlobalSettingResponse(
        id=setting.id,
        key=setting.key,
        value=setting.value,
        description=setting.description,
        updated_at=setting.updated_at
    )

@router.put("/settings/{key}")
async def update_setting(
    key: str,
    request: UpdateGlobalSettingRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    setting = db.query(AdminSetting).filter(AdminSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    setting.value = request.value
    setting.updated_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "message": f"Setting '{key}' updated successfully"}


@router.post("/settings", response_model=GlobalSettingResponse)
async def create_setting(
    request: CreateGlobalSettingRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(AdminSetting).filter(AdminSetting.key == request.key).first()
    if existing:
        raise HTTPException(status_code=400, detail="Setting with this key already exists")
    
    import uuid
    new_setting = AdminSetting(
        id=str(uuid.uuid4()),
        key=request.key,
        value=request.value,
        description=request.description
    )
    
    db.add(new_setting)
    db.commit()
    db.refresh(new_setting)
    
    return GlobalSettingResponse(
        id=new_setting.id,
        key=new_setting.key,
        value=new_setting.value,
        description=new_setting.description,
        updated_at=new_setting.updated_at
    )


@router.delete("/settings/{key}")
async def delete_setting(
    key: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    protected_keys = ["system_prompt", "content_format_guidelines", "comment_worthiness_rubric"]
    if key in protected_keys:
        raise HTTPException(status_code=400, detail="Cannot delete protected system settings")
    
    setting = db.query(AdminSetting).filter(AdminSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    db.delete(setting)
    db.commit()
    
    return {"success": True, "message": f"Setting '{key}' deleted successfully"}

@router.get("/subscription-plans", response_model=List[SubscriptionPlanResponse])
async def get_subscription_plans(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    plans = db.query(SubscriptionPlanConfig).order_by(SubscriptionPlanConfig.sort_order).all()
    return [
        SubscriptionPlanResponse(
            id=plan.id,
            plan_name=plan.plan_name,
            display_name=plan.display_name,
            description=plan.description,
            price_monthly=plan.price_monthly,
            price_yearly=plan.price_yearly,
            posts_limit=plan.posts_limit,
            features=plan.features or [],
            is_active=plan.is_active,
            sort_order=plan.sort_order,
            created_at=plan.created_at,
            updated_at=plan.updated_at
        )
        for plan in plans
    ]


@router.post("/subscription-plans", response_model=SubscriptionPlanResponse)
async def create_subscription_plan(
    request: CreateSubscriptionPlanRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.plan_name == request.plan_name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Plan with this name already exists")
    
    new_plan = SubscriptionPlanConfig(
        plan_name=request.plan_name,
        display_name=request.display_name,
        description=request.description,
        price_monthly=request.price_monthly,
        price_yearly=request.price_yearly,
        posts_limit=request.posts_limit,
        features=request.features,
        is_active=request.is_active,
        sort_order=request.sort_order
    )
    
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    
    return SubscriptionPlanResponse(
        id=new_plan.id,
        plan_name=new_plan.plan_name,
        display_name=new_plan.display_name,
        description=new_plan.description,
        price_monthly=new_plan.price_monthly,
        price_yearly=new_plan.price_yearly,
        posts_limit=new_plan.posts_limit,
        features=new_plan.features or [],
        is_active=new_plan.is_active,
        sort_order=new_plan.sort_order,
        created_at=new_plan.created_at,
        updated_at=new_plan.updated_at
    )


@router.put("/subscription-plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def update_subscription_plan(
    plan_id: str,
    request: UpdateSubscriptionPlanRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    plan = db.query(SubscriptionPlanConfig).filter(SubscriptionPlanConfig.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if request.display_name is not None:
        plan.display_name = request.display_name
    if request.description is not None:
        plan.description = request.description
    if request.price_monthly is not None:
        plan.price_monthly = request.price_monthly
    if request.price_yearly is not None:
        plan.price_yearly = request.price_yearly
    if request.posts_limit is not None:
        plan.posts_limit = request.posts_limit
    if request.features is not None:
        plan.features = request.features
    if request.is_active is not None:
        plan.is_active = request.is_active
    if request.sort_order is not None:
        plan.sort_order = request.sort_order
    
    plan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(plan)
    
    return SubscriptionPlanResponse(
        id=plan.id,
        plan_name=plan.plan_name,
        display_name=plan.display_name,
        description=plan.description,
        price_monthly=plan.price_monthly,
        price_yearly=plan.price_yearly,
        posts_limit=plan.posts_limit,
        features=plan.features or [],
        is_active=plan.is_active,
        sort_order=plan.sort_order,
        created_at=plan.created_at,
        updated_at=plan.updated_at
    )


@router.delete("/subscription-plans/{plan_id}")
async def delete_subscription_plan(
    plan_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    plan = db.query(SubscriptionPlanConfig).filter(SubscriptionPlanConfig.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    active_subscriptions = db.query(Subscription).filter(
        Subscription.plan == plan.plan_name
    ).count()
    
    if active_subscriptions > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete plan with {active_subscriptions} active subscriptions"
        )
    
    db.delete(plan)
    db.commit()
    
    return {"success": True, "message": "Plan deleted successfully"}

@router.post("/users/{user_id}/reset-onboarding")
async def reset_user_onboarding(
    user_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    profile.onboarding_completed = False
    profile.onboarding_step = 1
    db.commit()
    
    return {"success": True, "message": "User onboarding reset successfully"}


@router.post("/users/{user_id}/credits/grant")
async def grant_user_credits(
    user_id: str,
    credits: float,
    reason: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin grants credits to a user manually"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Grant credits and log transaction
    result = credit_service.admin_grant_credits(
        db=db,
        user_id=user_id,
        amount=credits,
        admin_id=admin.id,
        reason=reason
    )
    
    return {
        "success": True,
        "message": f"Granted {credits} credits to user",
        "result": result
    }


@router.get("/users/{user_id}/credit-transactions")
async def get_user_credit_transactions(
    user_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get credit transaction history for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    transactions = credit_service.get_credit_transactions(db, user_id, limit=50)
    
    return [
        {
            "id": t.id,
            "action_type": t.action_type,
            "credits_used": t.credits_used,
            "credits_before": t.credits_before,
            "credits_after": t.credits_after,
            "description": t.description,
            "created_at": t.created_at
        }
        for t in transactions
    ]


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"success": True, "message": "User deleted successfully"}


@router.post("/upload/logo")
async def upload_logo(
    file: UploadFile = File(...),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Upload a logo image for the application."""
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: JPEG, PNG, WebP, SVG"
        )
    
    # Validate file size (max 2MB)
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 2MB"
        )
    
    # Create uploads directory if it doesn't exist
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "logos")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ".png"
    unique_filename = f"logo_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save the file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return the URL path (relative to the API)
    logo_url = f"/uploads/logos/{unique_filename}"
    
    return {"success": True, "url": logo_url, "filename": unique_filename}


# Analytics Endpoints

@router.get("/analytics/summary", response_model=UsageSummaryResponse)
async def get_analytics_summary(
    period: str = "month",  # "today", "week", "month", "all"
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get overall analytics summary with costs and revenue"""
    
    # Calculate date range based on period
    end_date = datetime.utcnow()
    if period == "today":
        start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = end_date - timedelta(days=7)
    elif period == "month":
        start_date = end_date - timedelta(days=30)
    else:  # all
        start_date = None
    
    # Get usage summary
    usage_summary = get_usage_summary(db, start_date, end_date)
    
    # Get revenue summary
    revenue_summary = get_revenue_summary(db, start_date, end_date)
    
    # Calculate net profit
    total_cost = usage_summary["total_cost"]
    monthly_revenue = revenue_summary["total_monthly_revenue"]
    yearly_revenue = revenue_summary["total_yearly_revenue"]
    
    net_profit_monthly = monthly_revenue - total_cost
    net_profit_yearly = yearly_revenue - (total_cost * 12)  # Annualize cost
    
    return UsageSummaryResponse(
        total_tokens=usage_summary["total_tokens"],
        total_cost=usage_summary["total_cost"],
        total_requests=usage_summary["total_requests"],
        total_monthly_revenue=monthly_revenue,
        total_yearly_revenue=yearly_revenue,
        net_profit_monthly=net_profit_monthly,
        net_profit_yearly=net_profit_yearly,
        service_breakdown=usage_summary["service_breakdown"],
        model_breakdown=usage_summary["model_breakdown"]
    )


@router.get("/analytics/timeline", response_model=List[TimelineDataPoint])
async def get_analytics_timeline(
    days: int = 30,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get usage timeline for charting"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    timeline = get_usage_timeline(db, start_date, end_date, granularity="day")
    
    return [TimelineDataPoint(**point) for point in timeline]


@router.get("/analytics/top-users", response_model=List[TopUserResponse])
async def get_analytics_top_users(
    limit: int = 10,
    sort_by: str = "cost",
    period: str = "month",
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get top users by usage"""
    
    # Calculate date range
    end_date = datetime.utcnow()
    if period == "today":
        start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = end_date - timedelta(days=7)
    elif period == "month":
        start_date = end_date - timedelta(days=30)
    else:  # all
        start_date = None
    
    top_users = get_top_users_by_usage(db, limit, start_date, end_date, sort_by)
    
    return [TopUserResponse(**user) for user in top_users]


@router.get("/users/{user_id}/usage", response_model=UserUsageDetailResponse)
async def get_user_usage_detail(
    user_id: str,
    period: str = "month",
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed usage for a specific user"""
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate date range
    end_date = datetime.utcnow()
    if period == "today":
        start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = end_date - timedelta(days=7)
    elif period == "month":
        start_date = end_date - timedelta(days=30)
    else:  # all
        start_date = None
    
    # Get usage summary for user
    usage_summary = get_user_usage(db, user_id, start_date, end_date)
    
    # Get recent usage records
    query = db.query(UsageTracking).filter(UsageTracking.user_id == user_id)
    if start_date:
        query = query.filter(UsageTracking.created_at >= start_date)
    recent_usage = query.order_by(UsageTracking.created_at.desc()).limit(20).all()
    
    recent_usage_list = []
    for record in recent_usage:
        recent_usage_list.append({
            "id": record.id,
            "service_type": record.service_type.value,
            "tokens": record.total_tokens,
            "cost": cents_to_cost(record.estimated_cost),
            "model": record.model,
            "created_at": record.created_at.isoformat()
        })
    
    return UserUsageDetailResponse(
        user_id=user.id,
        email=user.email,
        name=user.name,
        total_tokens=usage_summary["total_tokens"],
        total_cost=usage_summary["total_cost"],
        total_requests=usage_summary["total_requests"],
        service_breakdown=usage_summary["service_breakdown"],
        model_breakdown=usage_summary["model_breakdown"],
        recent_usage=recent_usage_list
    )


@router.get("/posts", response_model=PostsListResponse)
async def get_posts_with_usage(
    search: Optional[str] = None,
    format: Optional[str] = None,
    user_id: Optional[str] = None,
    sort_by: str = "cost",  # "cost", "tokens", "date"
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 20,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all posts with usage/cost data (sortable, filterable)"""
    
    # Base query
    query = db.query(GeneratedPost)
    
    # Apply filters
    if search:
        query = query.filter(
            or_(
                GeneratedPost.content.contains(search),
                GeneratedPost.topic.contains(search)
            )
        )
    if format:
        query = query.filter(GeneratedPost.format == format)
    if user_id:
        query = query.filter(GeneratedPost.user_id == user_id)
    
    # Get total count before pagination
    total = query.count()
    
    # Get all posts (we need to calculate costs)
    all_posts = query.all()
    
    # Calculate costs for each post
    posts_with_cost = []
    total_cost_sum = 0.0
    total_tokens_sum = 0
    
    for post in all_posts:
        # Get usage records for this post
        usage_records = db.query(UsageTracking).filter(
            UsageTracking.post_id == post.id
        ).all()
        
        post_tokens = sum(r.total_tokens for r in usage_records)
        post_cost_cents = sum(r.estimated_cost for r in usage_records)
        post_cost = cents_to_cost(post_cost_cents)
        
        models_used = list(set(r.model for r in usage_records if r.model))
        has_image = any(r.service_type.value == "image_generation" for r in usage_records)
        has_search = any(r.service_type.value == "search" for r in usage_records)
        
        # Get user info
        user = db.query(User).filter(User.id == post.user_id).first()
        
        posts_with_cost.append({
            "post": post,
            "total_tokens": post_tokens,
            "total_cost": post_cost,
            "models_used": models_used,
            "has_image": has_image,
            "has_search": has_search,
            "user_email": user.email if user else "Unknown",
            "user_name": user.name if user else None
        })
        
        total_cost_sum += post_cost
        total_tokens_sum += post_tokens
    
    # Sort posts
    if sort_by == "cost":
        posts_with_cost.sort(key=lambda x: x["total_cost"], reverse=(sort_order == "desc"))
    elif sort_by == "tokens":
        posts_with_cost.sort(key=lambda x: x["total_tokens"], reverse=(sort_order == "desc"))
    else:  # date
        posts_with_cost.sort(key=lambda x: x["post"].created_at, reverse=(sort_order == "desc"))
    
    # Apply pagination
    paginated_posts = posts_with_cost[skip:skip + limit]
    
    # Build response
    posts_response = []
    for item in paginated_posts:
        post = item["post"]
        content_preview = post.content[:100] + "..." if len(post.content) > 100 else post.content
        
        posts_response.append(PostWithUsageResponse(
            id=post.id,
            content=content_preview,
            format=post.format.value,
            topic=post.topic,
            created_at=post.created_at,
            user_email=item["user_email"],
            user_name=item["user_name"],
            total_tokens=item["total_tokens"],
            total_cost=item["total_cost"],
            models_used=item["models_used"],
            has_image=item["has_image"],
            has_search=item["has_search"]
        ))
    
    avg_cost = total_cost_sum / total if total > 0 else 0.0
    
    return PostsListResponse(
        posts=posts_response,
        total=total,
        skip=skip,
        limit=limit,
        total_cost=total_cost_sum,
        total_tokens=total_tokens_sum,
        avg_cost_per_post=avg_cost
    )


@router.get("/posts/{post_id}", response_model=PostUsageDetailResponse)
async def get_post_usage_detail(
    post_id: str,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed usage breakdown for a specific post"""
    
    # Get post
    post = db.query(GeneratedPost).filter(GeneratedPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get user
    user = db.query(User).filter(User.id == post.user_id).first()
    
    # Get usage records
    usage_records = db.query(UsageTracking).filter(
        UsageTracking.post_id == post_id
    ).all()
    
    # Aggregate by service type
    text_gen_cost = 0.0
    text_input_tokens = 0
    text_output_tokens = 0
    text_model = None
    text_provider = None
    
    image_gen_cost = 0.0
    image_count = 0
    image_model = None
    
    search_cost = 0.0
    search_count = 0
    
    for record in usage_records:
        cost = cents_to_cost(record.estimated_cost)
        
        if record.service_type.value == "text_generation":
            text_gen_cost += cost
            text_input_tokens += record.input_tokens
            text_output_tokens += record.output_tokens
            if not text_model:
                text_model = record.model
                text_provider = record.provider
        elif record.service_type.value == "image_generation":
            image_gen_cost += cost
            image_count += record.image_count
            if not image_model:
                image_model = record.model
        elif record.service_type.value == "search":
            search_cost += cost
            search_count += record.search_count
    
    total_cost = text_gen_cost + image_gen_cost + search_cost
    total_tokens = text_input_tokens + text_output_tokens
    
    return PostUsageDetailResponse(
        post_id=post.id,
        content=post.content,
        format=post.format.value,
        topic=post.topic,
        created_at=post.created_at,
        user_id=post.user_id,
        user_email=user.email if user else "Unknown",
        user_name=user.name if user else None,
        text_generation_cost=text_gen_cost,
        text_input_tokens=text_input_tokens,
        text_output_tokens=text_output_tokens,
        text_model=text_model,
        text_provider=text_provider,
        image_generation_cost=image_gen_cost,
        image_count=image_count,
        image_model=image_model,
        search_cost=search_cost,
        search_count=search_count,
        total_cost=total_cost,
        total_tokens=total_tokens,
        generation_options=post.generation_options if isinstance(post.generation_options, dict) else None
    )


@router.get("/logs")
async def get_system_logs(
    level: Optional[str] = None,
    user_id: Optional[str] = None,
    endpoint: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get system logs with optional filters
    
    Query Parameters:
    - level: Filter by log level (debug, info, warning, error, critical)
    - user_id: Filter by user ID
    - endpoint: Filter by API endpoint
    - limit: Number of logs to return (default: 100, max: 500)
    - offset: Pagination offset (default: 0)
    """
    # Limit max to 500
    limit = min(limit, 500)
    
    # Build query
    query = db.query(SystemLog)
    
    # Apply filters
    if level:
        try:
            log_level = LogLevel(level.lower())
            query = query.filter(SystemLog.level == log_level)
        except ValueError:
            pass  # Invalid level, ignore filter
    
    if user_id:
        query = query.filter(SystemLog.user_id == user_id)
    
    if endpoint:
        query = query.filter(SystemLog.endpoint.like(f"%{endpoint}%"))
    
    # Get total count
    total = query.count()
    
    # Get logs ordered by most recent first
    logs = query.order_by(SystemLog.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "level": log.level.value,
                "logger_name": log.logger_name,
                "message": log.message,
                "user_id": log.user_id,
                "admin_id": log.admin_id,
                "endpoint": log.endpoint,
                "method": log.method,
                "ip_address": log.ip_address,
                "extra_data": log.extra_data,
                "stack_trace": log.stack_trace,
                "created_at": log.created_at
            }
            for log in logs
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/logs/file")
async def get_log_file(
    file_type: str = "app",
    lines: int = 100,
    admin: Admin = Depends(get_current_admin)
):
    """
    Get recent lines from log files
    
    Query Parameters:
    - file_type: Type of log file (app, error, credits, access)
    - lines: Number of recent lines to return (default: 100, max: 1000)
    """
    import os
    from pathlib import Path
    
    # Limit max lines
    lines = min(lines, 1000)
    
    # Map file type to file path
    logs_dir = Path(__file__).parent.parent.parent / "logs"
    file_map = {
        "app": logs_dir / "app.log",
        "error": logs_dir / "error.log",
        "credits": logs_dir / "credits.log",
        "access": logs_dir / "access.log"
    }
    
    if file_type not in file_map:
        raise HTTPException(status_code=400, detail=f"Invalid file_type. Must be one of: {', '.join(file_map.keys())}")
    
    log_file = file_map[file_type]
    
    if not log_file.exists():
        return {
            "file": file_type,
            "lines": [],
            "message": "Log file does not exist yet"
        }
    
    try:
        # Read last N lines efficiently
        with open(log_file, 'r') as f:
            # For small files, read all
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:]
        
        return {
            "file": file_type,
            "lines": [line.strip() for line in recent_lines],
            "total_lines": len(all_lines)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read log file: {str(e)}")


@router.get("/logs/analytics")
async def get_log_analytics(
    days: int = 7,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get log analytics for the specified time period
    
    Query Parameters:
    - days: Number of days to analyze (default: 7, max: 90)
    """
    days = min(days, 90)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Error rate by level over time (daily buckets)
    error_timeline = db.query(
        func.date(SystemLog.created_at).label('date'),
        SystemLog.level,
        func.count(SystemLog.id).label('count')
    ).filter(
        SystemLog.created_at >= start_date
    ).group_by(
        func.date(SystemLog.created_at),
        SystemLog.level
    ).order_by(func.date(SystemLog.created_at)).all()
    
    # Format timeline data
    timeline_data = {}
    for date, level, count in error_timeline:
        date_str = str(date)
        if date_str not in timeline_data:
            timeline_data[date_str] = {
                "debug": 0,
                "info": 0,
                "warning": 0,
                "error": 0,
                "critical": 0
            }
        timeline_data[date_str][level.value] = count
    
    # Total counts by level
    level_counts = db.query(
        SystemLog.level,
        func.count(SystemLog.id).label('count')
    ).filter(
        SystemLog.created_at >= start_date
    ).group_by(SystemLog.level).all()
    
    total_by_level = {
        "debug": 0,
        "info": 0,
        "warning": 0,
        "error": 0,
        "critical": 0
    }
    for level, count in level_counts:
        total_by_level[level.value] = count
    
    # Top error endpoints
    top_error_endpoints = db.query(
        SystemLog.endpoint,
        func.count(SystemLog.id).label('count')
    ).filter(
        and_(
            SystemLog.created_at >= start_date,
            SystemLog.level.in_([LogLevel.ERROR, LogLevel.CRITICAL]),
            SystemLog.endpoint.isnot(None)
        )
    ).group_by(SystemLog.endpoint).order_by(func.count(SystemLog.id).desc()).limit(10).all()
    
    # Users with most errors
    top_error_users = db.query(
        SystemLog.user_id,
        func.count(SystemLog.id).label('count')
    ).filter(
        and_(
            SystemLog.created_at >= start_date,
            SystemLog.level.in_([LogLevel.ERROR, LogLevel.CRITICAL]),
            SystemLog.user_id.isnot(None)
        )
    ).group_by(SystemLog.user_id).order_by(func.count(SystemLog.id).desc()).limit(10).all()
    
    # Get user emails for top error users
    user_error_details = []
    for user_id, count in top_error_users:
        user = db.query(User).filter(User.id == user_id).first()
        user_error_details.append({
            "user_id": user_id,
            "email": user.email if user else "Unknown",
            "name": user.name if user else None,
            "error_count": count
        })
    
    # Credit transaction statistics
    from ..models import CreditTransaction
    credit_stats = db.query(
        func.date(CreditTransaction.created_at).label('date'),
        func.sum(func.abs(CreditTransaction.credits_used)).label('total_credits')
    ).filter(
        CreditTransaction.created_at >= start_date
    ).group_by(
        func.date(CreditTransaction.created_at)
    ).order_by(func.date(CreditTransaction.created_at)).all()
    
    credit_timeline = {str(date): float(total) for date, total in credit_stats}
    
    # Most common actions
    common_actions = db.query(
        CreditTransaction.action_type,
        func.count(CreditTransaction.id).label('count'),
        func.sum(func.abs(CreditTransaction.credits_used)).label('total_credits')
    ).filter(
        CreditTransaction.created_at >= start_date
    ).group_by(
        CreditTransaction.action_type
    ).order_by(func.count(CreditTransaction.id).desc()).limit(10).all()
    
    return {
        "period_days": days,
        "start_date": start_date.isoformat(),
        "end_date": datetime.utcnow().isoformat(),
        "total_logs": sum(total_by_level.values()),
        "logs_by_level": total_by_level,
        "timeline": [
            {
                "date": date,
                **data
            }
            for date, data in sorted(timeline_data.items())
        ],
        "top_error_endpoints": [
            {"endpoint": endpoint or "Unknown", "count": count}
            for endpoint, count in top_error_endpoints
        ],
        "top_error_users": user_error_details,
        "credit_usage": {
            "timeline": [
                {"date": date, "credits": credits}
                for date, credits in sorted(credit_timeline.items())
            ],
            "total_credits_used": sum(credit_timeline.values()),
            "common_actions": [
                {
                    "action": action,
                    "count": count,
                    "total_credits": float(total_credits) if total_credits else 0
                }
                for action, count, total_credits in common_actions
            ]
        }
    }


@router.get("/logs/export/csv")
async def export_logs_csv(
    level: Optional[str] = None,
    user_id: Optional[str] = None,
    endpoint: Optional[str] = None,
    days: int = 7,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Export logs as CSV
    
    Query Parameters:
    - level: Filter by log level
    - user_id: Filter by user ID
    - endpoint: Filter by endpoint
    - days: Number of days to export (default: 7, max: 90)
    """
    days = min(days, 90)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Build query
    query = db.query(SystemLog).filter(SystemLog.created_at >= start_date)
    
    if level:
        try:
            log_level = LogLevel(level.lower())
            query = query.filter(SystemLog.level == log_level)
        except ValueError:
            pass
    
    if user_id:
        query = query.filter(SystemLog.user_id == user_id)
    
    if endpoint:
        query = query.filter(SystemLog.endpoint.like(f"%{endpoint}%"))
    
    logs = query.order_by(SystemLog.created_at.desc()).limit(10000).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'Timestamp', 'Level', 'Logger', 'Message', 'User ID', 
        'Endpoint', 'Method', 'IP Address', 'Stack Trace'
    ])
    
    # Write data
    for log in logs:
        writer.writerow([
            log.created_at.isoformat(),
            log.level.value,
            log.logger_name or '',
            log.message,
            log.user_id or '',
            log.endpoint or '',
            log.method or '',
            log.ip_address or '',
            log.stack_trace or ''
        ])
    
    # Return CSV file
    output.seek(0)
    filename = f"logs_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/logs/export/json")
async def export_logs_json(
    level: Optional[str] = None,
    user_id: Optional[str] = None,
    endpoint: Optional[str] = None,
    days: int = 7,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Export logs as JSON
    
    Query Parameters:
    - level: Filter by log level
    - user_id: Filter by user ID
    - endpoint: Filter by endpoint
    - days: Number of days to export (default: 7, max: 90)
    """
    days = min(days, 90)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Build query
    query = db.query(SystemLog).filter(SystemLog.created_at >= start_date)
    
    if level:
        try:
            log_level = LogLevel(level.lower())
            query = query.filter(SystemLog.level == log_level)
        except ValueError:
            pass
    
    if user_id:
        query = query.filter(SystemLog.user_id == user_id)
    
    if endpoint:
        query = query.filter(SystemLog.endpoint.like(f"%{endpoint}%"))
    
    logs = query.order_by(SystemLog.created_at.desc()).limit(10000).all()
    
    # Format logs
    logs_data = [
        {
            "id": log.id,
            "timestamp": log.created_at.isoformat(),
            "level": log.level.value,
            "logger_name": log.logger_name,
            "message": log.message,
            "user_id": log.user_id,
            "admin_id": log.admin_id,
            "endpoint": log.endpoint,
            "method": log.method,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "extra_data": log.extra_data,
            "stack_trace": log.stack_trace
        }
        for log in logs
    ]
    
    filename = f"logs_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    
    return Response(
        content=json.dumps(logs_data, indent=2),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
