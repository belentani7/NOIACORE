from sqlalchemy import Column, String, Integer, JSON, DateTime, Boolean, func, UniqueConstraint, Index, Text
from sqlalchemy.orm import Mapped, mapped_column
from db_session import Base
from datetime import datetime
from typing import Optional, Dict, Any
import uuid

def uid() -> str:
    return str(uuid.uuid4())

def now_utc() -> datetime:
    return datetime.utcnow()

class RestaurantClient(Base):
    __tablename__ = "restaurant_clients"
    __table_args__ = (
        UniqueConstraint("owner_phone", name="uq_owner_phone"),
        Index("idx_client_status", "status"),
        Index("idx_client_created", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    owner_phone: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="active")
    config_data: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, server_default="{}")
    stripe_account_id: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())

class RestaurantOrder(Base):
    __tablename__ = "restaurant_orders"
    __table_args__ = (
        UniqueConstraint("client_id", "idempotency_key", name="uq_order_idempotency"),
        Index("idx_order_client", "client_id"),
        Index("idx_order_status", "status"),
        Index("idx_order_created", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    table_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, server_default="received", index=True)
    items_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    total_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    payment_intent_id: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    idempotency_key: Mapped[str] = mapped_column(String(100), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())

class StripeWebhookLog(Base):
    __tablename__ = "stripe_webhook_logs"
    __table_args__ = (
        UniqueConstraint("event_id", name="uq_stripe_event_id"),
        Index("idx_webhook_type", "event_type"),
        Index("idx_webhook_created", "received_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    event_id: Mapped[str] = mapped_column(String(120), nullable=False)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    processed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
