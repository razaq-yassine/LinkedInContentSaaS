from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import (
    User, UserProfile, AdminSetting, GeneratedPost, GeneratedComment,
    Subscription, SubscriptionPlanConfig, Conversation, Admin
)
from ..routers.admin_auth import get_current_admin
from ..schemas.admin_schemas import (
    UserDetailResponse, UserProfileDetail, UserSubscriptionDetail, UserStatsDetail,
    SubscriptionPlanResponse, CreateSubscriptionPlanRequest, UpdateSubscriptionPlanRequest,
    GlobalSettingResponse, UpdateGlobalSettingRequest, DashboardStatsResponse
)

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
                posts_this_month=subscription.posts_this_month,
                posts_limit=subscription.posts_limit,
                stripe_customer_id=subscription.stripe_customer_id,
                stripe_subscription_id=subscription.stripe_subscription_id,
                period_end=subscription.period_end
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
            posts_this_month=subscription.posts_this_month,
            posts_limit=subscription.posts_limit,
            stripe_customer_id=subscription.stripe_customer_id,
            stripe_subscription_id=subscription.stripe_subscription_id,
            period_end=subscription.period_end
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
    
    subscription.plan = plan
    subscription.posts_limit = plan_config.posts_limit
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
