# backend/app/main.py
# FastAPI: Stripe Connect Real + OpenAI Function Calling + WhatsApp Cloud API

from __future__ import annotations
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Literal
import uuid
import json
import hmac
import hashlib
import logging
import os

from fastapi import FastAPI, Depends, HTTPException, Request, Response, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import httpx
import stripe
from openai import OpenAI

from sqlalchemy import create_engine, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, func, select
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Mapped, mapped_column, Session

# ===== CONFIGURATION =====
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "postgresql+psycopg://of1p:of1p@localhost:5432/of1p"
    admin_token: str = "dev-admin-token"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    whatsapp_business_account_id: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_access_token: str = ""
    whatsapp_verify_token: str = "dev-whatsapp-verify"
    public_base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

settings = Settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

engine = create_engine(settings.database_url, pool_pre_ping=True, future=True, echo=False)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

class Base(DeclarativeBase):
    pass

# ===== MODELS =====
def uid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    role: Mapped[str] = mapped_column(String(20), default="customer")
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), unique=True, index=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(120), nullable=True)
    language: Mapped[str] = mapped_column(String(8), default="es")
    consent_marketing: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_ai: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Provider(Base):
    __tablename__ = "providers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    legal_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    kyc_status: Mapped[str] = mapped_column(String(20), default="pending")
    insurance_status: Mapped[str] = mapped_column(String(30), default="none")
    rating_x100: Mapped[int] = mapped_column(Integer, default=0)
    completed_jobs: Mapped[int] = mapped_column(Integer, default=0)
    stripe_account_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    payout_account_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Service(Base):
    __tablename__ = "services"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    category: Mapped[str] = mapped_column(String(80))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    commission_bps: Mapped[int] = mapped_column(Integer, default=2500)
    delivery_mode: Mapped[str] = mapped_column(String(20), default="hybrid")
    risk_level: Mapped[str] = mapped_column(String(20), default="low")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Lead(Base):
    __tablename__ = "leads"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    channel: Mapped[str] = mapped_column(String(30), default="web")
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    service_id: Mapped[str | None] = mapped_column(ForeignKey("services.id"), nullable=True)
    raw_message: Mapped[str] = mapped_column(Text)
    intent: Mapped[str | None] = mapped_column(String(120), nullable=True)
    score: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="new")
    risk_level: Mapped[str] = mapped_column(String(20), default="low")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    provider_id: Mapped[str | None] = mapped_column(ForeignKey("providers.id"), nullable=True)
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id"))
    status: Mapped[str] = mapped_column(String(20), default="created")
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    amount_cents: Mapped[int] = mapped_column(Integer)
    commission_cents: Mapped[int] = mapped_column(Integer, default=0)
    provider_payout_cents: Mapped[int] = mapped_column(Integer, default=0)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"))
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), unique=True)
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Dispute(Base):
    __tablename__ = "disputes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"))
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open")
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    refunded_cents: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    actor_type: Mapped[str] = mapped_column(String(30), default="system")
    actor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    action: Mapped[str] = mapped_column(String(120))
    entity: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

# ===== SCHEMAS =====
class ServiceCreate(BaseModel):
    slug: str = Field(min_length=3)
    name: str = Field(min_length=3)
    category: str = Field(min_length=2)
    description: str | None = None
    price_cents: int = Field(gt=0)
    commission_bps: int = Field(default=2500, ge=0, le=10000)
    delivery_mode: Literal["digital", "onsite", "hybrid"] = "hybrid"
    risk_level: Literal["low", "medium", "high"] = "low"
    active: bool = True

class LeadCreate(BaseModel):
    phone: str | None = None
    email: str | None = None
    name: str | None = None
    channel: str = "web"
    message: str = Field(min_length=3)
    service_slug: str | None = None

class OrderCreate(BaseModel):
    phone: str
    name: str | None = None
    service_slug: str
    provider_id: str | None = None
    scheduled_at: datetime | None = None

class ReviewCreate(BaseModel):
    order_id: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = None

# ===== DEPENDENCIES =====
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def require_admin(x_admin_token: str | None = Header(default=None)):
    if x_admin_token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")

# ===== UTILS =====
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def format_eur(cents: int) -> str:
    return f"{cents / 100:.2f} €"

def log_event(db: Session, action: str, entity: str, entity_id: str | None = None, actor_type: str = "system", actor_id: str | None = None, metadata: dict | None = None):
    db.add(AuditEvent(actor_type=actor_type, actor_id=actor_id, action=action, entity=entity, entity_id=entity_id, metadata_json=metadata or {}))
    db.commit()

def get_or_create_user_by_phone(db: Session, phone: str, name: str | None = None, email: str | None = None) -> User:
    user = db.query(User).filter(User.phone == phone).first()
    if user:
        if (name and not user.name) or (email and not user.email):
            if name:
                user.name = name
            if email:
                user.email = email
            db.commit()
            db.refresh(user)
        return user
    user = User(role="customer", phone=phone, name=name, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    log_event(db=db, action="user.created", entity="user", entity_id=user.id, metadata={"phone": phone})
    return user

def active_services(db: Session) -> list[Service]:
    return db.query(Service).filter(Service.active.is_(True)).all()

# ===== IA: OPENAI FUNCTION CALLING =====
openai_client = OpenAI(api_key=settings.openai_api_key)

TOOLS = [
    {"type": "function", "function": {"name": "get_services", "description": "Obtiene servicios disponibles", "parameters": {"type": "object", "properties": {}, "required": []}}},
    {"type": "function", "function": {"name": "create_order_draft", "description": "Crea borrador de pedido", "parameters": {"type": "object", "properties": {"service_slug": {"type": "string"}, "urgency": {"type": "string", "enum": ["low", "medium", "high"]}}, "required": ["service_slug"]}}},
    {"type": "function", "function": {"name": "escalate", "description": "Escala a humano", "parameters": {"type": "object", "properties": {"reason": {"type": "string"}}, "required": ["reason"]}}},
]

def ai_intake(message: str, services: list[Service], db: Session) -> dict:
    prompt = f"""Eres orquestador de BarriServei AI. Clasifica solicitud, sugiere servicio o escala.
Servicios: {json.dumps([{"slug": s.slug, "name": s.name, "price": format_eur(s.price_cents)} for s in services], ensure_ascii=False)}
Reglas: Si emergencia/salud/legal → escalate. Si encaja servicio → create_order_draft. Sino → responde pidiendo más info."""

    try:
        response = openai_client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": message},
            ],
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.3,
        )

        if response.choices and response.choices[0].message.tool_calls:
            tool = response.choices[0].message.tool_calls[0]
            args = json.loads(tool.function.arguments)

            if tool.function.name == "create_order_draft":
                service = next((s for s in services if s.slug == args.get("service_slug")), None)
                if service:
                    return {"reply": f"Perfecto: {service.name} por {format_eur(service.price_cents)}. ¿Procedo?", "action": "suggest", "slug": service.slug, "risk": "low"}
            elif tool.function.name == "escalate":
                return {"reply": f"{args.get('reason')}. Déjame un teléfono.", "action": "escalate", "risk": "high"}

        return {"reply": response.choices[0].message.content or "¿Cuéntame más?", "action": "info", "risk": "low"}
    except Exception as e:
        logger.error(f"OpenAI error: {e}")
        return {"reply": "Error procesando. Déjame revisar.", "action": "escalate", "risk": "medium"}

# ===== STRIPE =====
stripe.api_key = settings.stripe_secret_key

def create_payment_intent(order: Order) -> stripe.PaymentIntent:
    intent = stripe.PaymentIntent.create(
        amount=order.amount_cents,
        currency=order.currency.lower(),
        description=f"Pedido {order.id}",
        metadata={"order_id": order.id, "commission_cents": str(order.commission_cents), "provider_id": order.provider_id or "none"},
    )
    order.stripe_payment_intent_id = intent.id
    return intent

def verify_stripe_sig(body: bytes, sig: str) -> bool:
    expected = hmac.new(settings.stripe_webhook_secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)

# ===== WHATSAPP =====
async def send_whatsapp(to_phone: str, text: str) -> bool:
    url = f"https://graph.instagram.com/v19.0/{settings.whatsapp_phone_number_id}/messages"
    payload = {"messaging_product": "whatsapp", "to": to_phone.replace("+", ""), "type": "text", "text": {"body": text}}
    headers = {"Authorization": f"Bearer {settings.whatsapp_access_token}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(url, json=payload, headers=headers)
            return r.status_code == 200
    except:
        return False

# ===== APP =====
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="BarriServei AI", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_url, "http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root():
    return {"service": "BarriServei AI", "version": "1.0.0", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok", "time": now_utc().isoformat()}

# ===== SERVICES =====
@app.post("/api/services", dependencies=[Depends(require_admin)])
def create_service(payload: ServiceCreate, db: Session = Depends(get_db)):
    if db.query(Service).filter(Service.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Slug exists")
    service = Service(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    log_event(db=db, action="service.created", entity="service", entity_id=service.id, metadata={"slug": service.slug})
    return jsonable_encoder(service)

@app.get("/api/services")
def list_services(db: Session = Depends(get_db)):
    return jsonable_encoder(active_services(db))

# ===== LEADS =====
@app.post("/api/leads")
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    if not payload.phone and not payload.email:
        raise HTTPException(status_code=400, detail="Phone or email required")

    user = get_or_create_user_by_phone(db, payload.phone, payload.name, payload.email) if payload.phone else None
    if not user:
        user = User(role="customer", name=payload.name, email=payload.email)
        db.add(user)
        db.commit()
        db.refresh(user)

    services = active_services(db)
    ai_result = ai_intake(payload.message, services, db)

    service = None
    if ai_result.get("slug"):
        service = next((s for s in services if s.slug == ai_result["slug"]), None)

    lead = Lead(channel=payload.channel, user_id=user.id, service_id=service.id if service else None, raw_message=payload.message, intent=ai_result.get("action"), score=85 if service else 50, status="new", risk_level=ai_result.get("risk", "low"))
    db.add(lead)
    db.commit()
    db.refresh(lead)
    log_event(db=db, action="lead.created", entity="lead", entity_id=lead.id, metadata={"intent": lead.intent})
    return {"lead_id": lead.id, "reply": ai_result["reply"], "slug": ai_result.get("slug")}

# ===== ORDERS =====
@app.post("/api/orders")
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    user = get_or_create_user_by_phone(db, payload.phone, payload.name)
    service = db.query(Service).filter(Service.slug == payload.service_slug, Service.active.is_(True)).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    comm_cents = int(service.price_cents * service.commission_bps / 10000)
    order = Order(user_id=user.id, provider_id=payload.provider_id, service_id=service.id, status="created", scheduled_at=payload.scheduled_at, amount_cents=service.price_cents, commission_cents=comm_cents, provider_payout_cents=service.price_cents - comm_cents, currency=service.currency)
    db.add(order)
    db.commit()
    db.refresh(order)

    try:
        pi = create_payment_intent(order)
        db.commit()
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail="Payment error")

    log_event(db=db, action="order.created", entity="order", entity_id=order.id, metadata={"service_slug": service.slug, "amount_cents": order.amount_cents})
    return {"order_id": order.id, "amount_cents": order.amount_cents, "client_secret": pi.client_secret, "checkout_url": f"{settings.frontend_url}/checkout?order_id={order.id}"}

@app.get("/api/orders/{order_id}")
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    return jsonable_encoder(order) if order else HTTPException(status_code=404, detail="Order not found")

@app.post("/api/orders/{order_id}/complete", dependencies=[Depends(require_admin)])
def complete_order(order_id: str, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order or order.status not in ["paid", "assigned"]:
        raise HTTPException(status_code=400, detail="Cannot complete")
    order.status = "completed"
    order.completed_at = now_utc()
    if order.provider_id:
        provider = db.get(Provider, order.provider_id)
        if provider:
            provider.completed_jobs = (provider.completed_jobs or 0) + 1
    db.commit()
    db.refresh(order)
    log_event(db=db, action="order.completed", entity="order", entity_id=order.id)
    return jsonable_encoder(order)

# ===== REVIEWS =====
@app.post("/api/reviews")
def create_review(payload: ReviewCreate, db: Session = Depends(get_db)):
    order = db.get(Order, payload.order_id)
    if not order or order.status != "completed":
        raise HTTPException(status_code=400, detail="Order not completed")
    if db.query(Review).filter(Review.order_id == order.id).first():
        raise HTTPException(status_code=400, detail="Review exists")
    review = Review(order_id=order.id, rating=payload.rating, comment=payload.comment)
    db.add(review)
    if order.provider_id:
        provider = db.get(Provider, order.provider_id)
        if provider:
            count = max(provider.completed_jobs or 1, 1)
            old_sum = (provider.rating_x100 or 0) * (count - 1)
            provider.rating_x100 = int((old_sum + payload.rating * 100) / count)
    db.commit()
    db.refresh(review)
    log_event(db=db, action="review.created", entity="review", entity_id=review.id, metadata={"rating": payload.rating})
    return jsonable_encoder(review)

# ===== WEBHOOKS =====
@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request, bg: BackgroundTasks):
    body = await request.body()
    sig = request.headers.get("stripe-signature")
    if not sig or not verify_stripe_sig(body, sig):
        raise HTTPException(status_code=403, detail="Invalid")

    try:
        event = stripe.Event.construct_from(json.loads(body), settings.stripe_secret_key)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")

    if event.type == "payment_intent.succeeded":
        pi = event.data.object
        db = SessionLocal()
        try:
            payment = db.query(Payment).filter(Payment.stripe_payment_intent_id == pi.id).first()
            if payment:
                payment.status = "succeeded"
                order = db.get(Order, payment.order_id)
                if order:
                    order.status = "assigned" if order.provider_id else "paid"
                    db.commit()
                    if order.user_id:
                        user = db.get(User, order.user_id)
                        if user and user.phone:
                            bg.add_task(send_whatsapp, user.phone, "✓ Pago confirmado. Te contactaremos en breve.")
        finally:
            db.close()

    return {"received": True}

@app.get("/webhooks/whatsapp")
async def whatsapp_verify(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    if mode == "subscribe" and token == settings.whatsapp_verify_token:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Forbidden")

@app.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request, bg: BackgroundTasks):
    payload = await request.json()
    messages = payload.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {}).get("messages", [])
    if not messages:
        return {"status": "ok"}
    msg = messages[0]
    from_phone, text = msg.get("from"), msg.get("text", {}).get("body", "")
    if not from_phone or not text:
        return {"status": "ok"}

    db = SessionLocal()
    try:
        result = create_lead(LeadCreate(phone=from_phone, channel="whatsapp", message=text), db)
        bg.add_task(send_whatsapp, from_phone, result.get("reply", "Entendido."))
    finally:
        db.close()
    return {"status": "ok"}

# ===== ADMIN =====
@app.get("/api/admin/metrics", dependencies=[Depends(require_admin)])
def admin_metrics(db: Session = Depends(get_db)):
    gmv = db.scalar(select(func.coalesce(func.sum(Order.amount_cents), 0)).where(Order.status.in_(["paid", "assigned", "completed"]))) or 0
    comm = db.scalar(select(func.coalesce(func.sum(Order.commission_cents), 0)).where(Order.status.in_(["paid", "assigned", "completed"]))) or 0
    return {
        "users": db.scalar(select(func.count(User.id))) or 0,
        "leads": db.scalar(select(func.count(Lead.id))) or 0,
        "orders": db.scalar(select(func.count(Order.id))) or 0,
        "gmv_eur": round(gmv / 100, 2),
        "commission_eur": round(comm / 100, 2),
    }
