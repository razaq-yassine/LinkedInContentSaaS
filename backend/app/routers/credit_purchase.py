"""
Credit purchase router
Handles endpoints for purchasing credits separate from subscriptions
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import stripe

from ..database import get_db
from ..models import User, CreditPurchase
from ..routers.auth import get_current_user
from ..services import credit_purchase_service
from ..config import get_settings

settings = get_settings()
stripe.api_key = settings.stripe_secret_key

router = APIRouter()


class PurchaseRequest(BaseModel):
    credits_amount: float


@router.get("/pricing")
async def get_credit_pricing(db: Session = Depends(get_db)):
    """Get credit pricing and purchase configuration"""
    pricing = credit_purchase_service.get_credit_pricing(db)
    return pricing


@router.post("/purchase")
async def create_credit_purchase(
    request: PurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create checkout session for credit purchase"""
    result = credit_purchase_service.create_credit_purchase_checkout(
        db=db,
        user=current_user,
        credits_amount=request.credits_amount
    )
    return result


@router.get("/purchases")
async def get_purchase_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get credit purchase history for current user"""
    purchases = db.query(CreditPurchase).filter(
        CreditPurchase.user_id == current_user.id
    ).order_by(CreditPurchase.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": purchase.id,
            "credits_purchased": purchase.credits_purchased,
            "amount_paid_cents": purchase.amount_paid_cents,
            "status": purchase.status.value,
            "purchase_date": purchase.purchase_date.isoformat() if purchase.purchase_date else None,
            "created_at": purchase.created_at.isoformat() if purchase.created_at else None
        }
        for purchase in purchases
    ]


@router.post("/purchase/webhook")
async def credit_purchase_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events for credit purchases"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not settings.stripe_webhook_secret:
        # Dev mode - skip verification
        event = stripe.Event.construct_from(
            await request.json(), stripe.api_key
        )
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle checkout.session.completed for credit purchases
    if event.type == "checkout.session.completed":
        session = event.data.object
        # Check if this is a credit purchase (not subscription)
        if session.metadata and session.metadata.get("type") == "credit_purchase":
            result = credit_purchase_service.handle_credit_purchase_completed(
                db=db,
                checkout_session_id=session.id
            )
            return {"status": "success", "event": "checkout.session.completed", "result": result}
    
    # Handle payment_intent.succeeded for credit purchases
    elif event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        # Check metadata to see if it's a credit purchase
        if payment_intent.metadata and payment_intent.metadata.get("type") == "credit_purchase":
            result = credit_purchase_service.handle_credit_purchase_completed(
                db=db,
                payment_intent_id=payment_intent.id
            )
            return {"status": "success", "event": "payment_intent.succeeded", "result": result}
    
    return {"status": "ignored", "event_type": event.type}
