import stripe
import hmac
import hashlib
import logging
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core_config import settings
from db_models import RestaurantOrder, StripeWebhookLog
from typing import Dict, Any

logger = logging.getLogger(__name__)

stripe.api_key = settings.stripe_secret_key.get_secret_value()

async def create_payment_intent(
    order_id: str,
    amount_cents: int,
    description: str,
    metadata: Dict[str, Any] | None = None
) -> stripe.PaymentIntent:
    """Create a Stripe PaymentIntent with idempotency."""
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="eur",
            description=description,
            metadata=metadata or {},
            automatic_payment_methods={"enabled": True},
            idempotency_key=f"order_{order_id}_{amount_cents}",
        )
        logger.info(f"PaymentIntent created: {intent.id} for order {order_id}")
        return intent
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating PaymentIntent: {e}")
        raise HTTPException(status_code=400, detail="Payment initialization failed")

def verify_stripe_signature(payload: bytes, sig_header: str) -> bool:
    """Verify Stripe webhook signature using HMAC-SHA256."""
    try:
        expected_sig = hmac.new(
            settings.stripe_webhook_secret.get_secret_value().encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_sig, sig_header)
    except Exception as e:
        logger.error(f"Signature verification error: {e}")
        return False

async def handle_payment_intent_succeeded(
    event: Dict[str, Any],
    db: AsyncSession
) -> None:
    """Handle payment_intent.succeeded webhook event."""
    pi = event["data"]["object"]
    order_id = pi["metadata"].get("order_id")

    if not order_id:
        logger.warning(f"Payment intent {pi['id']} has no order_id metadata")
        return

    stmt = select(RestaurantOrder).where(RestaurantOrder.id == order_id)
    order = (await db.execute(stmt)).scalars().first()

    if not order:
        logger.error(f"Order {order_id} not found for payment {pi['id']}")
        return

    order.status = "paid"
    order.payment_intent_id = pi["id"]
    await db.commit()

    logger.info(f"Order {order_id} marked as paid via Stripe {pi['id']}")

async def handle_payment_intent_failed(
    event: Dict[str, Any],
    db: AsyncSession
) -> None:
    """Handle payment_intent.payment_failed webhook event."""
    pi = event["data"]["object"]
    order_id = pi["metadata"].get("order_id")

    if not order_id:
        return

    stmt = select(RestaurantOrder).where(RestaurantOrder.id == order_id)
    order = (await db.execute(stmt)).scalars().first()

    if order:
        order.status = "payment_failed"
        await db.commit()
        logger.warning(f"Order {order_id} payment failed: {pi.get('last_payment_error', {}).get('message')}")

async def log_webhook_event(
    event_id: str,
    event_type: str,
    payload: Dict[str, Any],
    db: AsyncSession
) -> None:
    """Log webhook event for audit and replay."""
    webhook_log = StripeWebhookLog(
        event_id=event_id,
        event_type=event_type,
        payload=payload,
        processed=False
    )
    db.add(webhook_log)
    await db.commit()
