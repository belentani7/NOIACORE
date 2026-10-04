from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from db_session import get_db
from db_models import RestaurantClient, RestaurantOrder
from core_config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

async def verify_admin_token(x_admin_token: str = Header(None)):
    """Verify admin token."""
    if not x_admin_token or x_admin_token != settings.admin_token.get_secret_value():
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

@router.get("/health", dependencies=[Depends(verify_admin_token)])
async def admin_health():
    """Health check for admin panel."""
    return {
        "status": "ok",
        "environment": settings.environment,
        "version": "2.0.0"
    }

@router.get("/metrics", dependencies=[Depends(verify_admin_token)])
async def get_metrics(db: AsyncSession = Depends(get_db)):
    """Retrieve system metrics."""

    # Total clients
    total_clients_stmt = select(func.count(RestaurantClient.id))
    total_clients = (await db.execute(total_clients_stmt)).scalar() or 0

    # Total orders
    total_orders_stmt = select(func.count(RestaurantOrder.id))
    total_orders = (await db.execute(total_orders_stmt)).scalar() or 0

    # Total revenue (cents)
    total_revenue_stmt = select(func.sum(RestaurantOrder.total_cents)).where(
        RestaurantOrder.status.in_(["paid", "completed"])
    )
    total_revenue = (await db.execute(total_revenue_stmt)).scalar() or 0

    # Orders by status
    pending_stmt = select(func.count(RestaurantOrder.id)).where(
        RestaurantOrder.status == "awaiting_payment"
    )
    pending_orders = (await db.execute(pending_stmt)).scalar() or 0

    paid_stmt = select(func.count(RestaurantOrder.id)).where(
        RestaurantOrder.status == "paid"
    )
    paid_orders = (await db.execute(paid_stmt)).scalar() or 0

    return {
        "total_clients": total_clients,
        "total_orders": total_orders,
        "total_revenue_cents": total_revenue,
        "total_revenue_eur": total_revenue / 100,
        "orders_pending": pending_orders,
        "orders_paid": paid_orders,
        "avg_order_value_cents": int(total_revenue / total_orders) if total_orders > 0 else 0
    }

@router.get("/clients", dependencies=[Depends(verify_admin_token)])
async def list_clients(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all restaurant clients."""

    stmt = select(RestaurantClient).offset(skip).limit(limit)
    clients = (await db.execute(stmt)).scalars().all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "phone": c.owner_phone,
            "status": c.status,
            "created_at": c.created_at.isoformat()
        }
        for c in clients
    ]

@router.post("/orders/{order_id}/complete", dependencies=[Depends(verify_admin_token)])
async def complete_order(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Mark order as completed (admin action)."""

    stmt = select(RestaurantOrder).where(RestaurantOrder.id == order_id)
    order = (await db.execute(stmt)).scalars().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = "completed"
    await db.commit()

    logger.info(f"Order {order_id} marked as completed by admin")

    return {"status": "success", "order_id": order_id}
