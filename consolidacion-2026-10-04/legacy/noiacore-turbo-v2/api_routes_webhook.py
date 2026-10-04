from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from db_session import get_db
from services_stripe import (
    verify_stripe_signature,
    handle_payment_intent_succeeded,
    handle_payment_intent_failed,
    log_webhook_event
)
import stripe
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events with signature verification."""

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    if not verify_stripe_signature(payload, sig_header):
        logger.warning("Invalid Stripe signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        event = stripe.Event.construct_from(
            stripe.util.json.loads(payload),
            stripe.api_key
        )
    except ValueError as e:
        logger.error(f"Invalid Stripe payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")

    event_id = event["id"]
    event_type = event["type"]

    # Log event for audit trail
    await log_webhook_event(event_id, event_type, event, db)

    # Route to handler
    if event_type == "payment_intent.succeeded":
        await handle_payment_intent_succeeded(event, db)
    elif event_type == "payment_intent.payment_failed":
        await handle_payment_intent_failed(event, db)
    else:
        logger.info(f"Unhandled event type: {event_type}")

    return {"received": True, "event_id": event_id}
