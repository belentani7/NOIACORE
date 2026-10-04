from pydantic import BaseModel, Field, conint, validator
from typing import List, Optional
from datetime import datetime

class OrderItemCreate(BaseModel):
    sku: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=160)
    price_cents: conint(ge=0) = Field(..., description="Price in cents (EUR)")
    quantity: conint(ge=1) = Field(default=1)

    @validator("price_cents")
    def price_not_zero(cls, v):
        if v == 0:
            raise ValueError("Price must be greater than 0")
        return v

class CreateOrderRequest(BaseModel):
    client_id: str = Field(..., min_length=36, max_length=36)
    table_number: Optional[int] = Field(default=None, ge=1, le=999)
    items: List[OrderItemCreate] = Field(..., min_items=1, max_items=100)
    notes: Optional[str] = Field(default=None, max_length=500)

    @validator("items")
    def total_amount_reasonable(cls, v):
        total = sum(item.price_cents * item.quantity for item in v)
        if total > 1_000_000:  # 10,000 EUR
            raise ValueError("Order total exceeds maximum allowed amount")
        return v

class OrderResponse(BaseModel):
    id: str
    client_id: str
    status: str
    total_cents: int
    table_number: Optional[int]
    created_at: datetime
    payment_intent_id: Optional[str] = None

    class Config:
        from_attributes = True
