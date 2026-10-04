from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4
from schemas_order import CreateOrderRequest, OrderResponse
from db_session import get_db
from db_models import RestaurantOrder, RestaurantClient
from services_stripe import create_payment_intent
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/restaurants", tags=["orders"])

@router.post("/orders", status_code=201, response_model=OrderResponse)
async def create_restaurant_order(
    payload: CreateOrderRequest,
    db: AsyncSession = Depends(get_db)
) -> OrderResponse:
    """Create a new restaurant order with Stripe payment intent."""

    # Verify client exists
    stmt = select(RestaurantClient).where(RestaurantClient.id == payload.client_id)
    client = (await db.execute(stmt)).scalars().first()

    if not client:
        raise HTTPException(status_code=404, detail="Restaurant client not found")

    # Calculate total
    total_cents = sum(item.price_cents * item.quantity for item in payload.items)

    # Create order with idempotency key
    idempotency_key = f"{payload.client_id}_{total_cents}_{uuid4().hex[:8]}"

    order = RestaurantOrder(
        client_id=payload.client_id,
        table_number=payload.table_number,
        items_json=[item.dict() for item in payload.items],
        total_cents=total_cents,
        status="created",
        idempotency_key=idempotency_key,
        notes=payload.notes
    )

    async with db.begin():
        db.add(order)
        await db.flush()

    # Create Stripe PaymentIntent
    try:
        intent = await create_payment_intent(
            order_id=order.id,
            amount_cents=total_cents,
            description=f"Order {order.id} - {client.name}",
            metadata={
                "order_id": order.id,
                "client_id": payload.client_id,
                "items_count": len(payload.items)
            }
        )
        order.payment_intent_id = intent.id
        order.status = "awaiting_payment"
        await db.commit()

    except Exception as e:
        logger.error(f"Failed to create payment intent for order {order.id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Payment initialization failed")

    return OrderResponse(
        id=order.id,
        client_id=order.client_id,
        status=order.status,
        total_cents=order.total_cents,
        table_number=order.table_number,
        created_at=order.created_at,
        payment_intent_id=order.payment_intent_id
    )

@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db)
) -> OrderResponse:
    """Retrieve order details."""

    stmt = select(RestaurantOrder).where(RestaurantOrder.id == order_id)
    order = (await db.execute(stmt)).scalars().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return OrderResponse(
        id=order.id,
        client_id=order.client_id,
        status=order.status,
        total_cents=order.total_cents,
        table_number=order.table_number,
        created_at=order.created_at,
        payment_intent_id=order.payment_intent_id
    )
