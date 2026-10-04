# BarriServei AI

**Autonomous local services platform** — FastAPI backend + Next.js frontend + OpenAI Function Calling + Stripe Connect + WhatsApp Cloud API.

Production-ready MVP: AI-powered service marketplace that detects demand, produces digital services, connects clients with providers, handles escrow payments, and auto-optimizes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)

---

## Overview

BarriServei AI is a complete service marketplace platform managed by 1 person + AI. It demonstrates enterprise-grade patterns for:

- **AI-driven intake** — OpenAI Function Calling classifies service requests
- **Automated payments** — Stripe Connect with escrow and automatic payouts
- **Multi-channel communication** — WhatsApp Cloud API integration
- **Provider management** — KYC, ratings, automated payouts
- **Real-time monitoring** — Admin dashboard with live KPIs

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
│  - Landing page + AI chat intake                             │
│  - Service checkout flow                                     │
│  - Admin dashboard                                           │
│  - Provider portal                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  - OpenAI Function Calling (GPT-4o mini)                     │
│  - Stripe webhook handling                                   │
│  - WhatsApp webhook processing                               │
│  - Database models & migrations                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   PostgreSQL Database                         │
│  - Users & leads                                             │
│  - Services & orders                                         │
│  - Providers & payouts                                       │
│  - Audit logs & metrics                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS |
| **Backend** | FastAPI + SQLAlchemy + PostgreSQL |
| **AI** | OpenAI GPT-4o mini + Function Calling |
| **Payments** | Stripe Connect (Escrow, Payouts, Connect) |
| **Messaging** | WhatsApp Cloud API |
| **Deployment** | Vercel (front) + Railway (back) + Supabase (DB) |
| **Monitoring** | Sentry + Railway logs |

---

## Key Features

### ✅ AI-Powered Service Intake
OpenAI Function Calling classifies user intent and suggests appropriate services:

```python
functions = [
    {
        "name": "suggest_service",
        "description": "Suggest a service based on user needs",
        "parameters": {
            "type": "object",
            "properties": {
                "service_category": {
                    "type": "string",
                    "enum": ["digital-support", "cleaning", "repairs", ...]
                },
                "urgency": {"type": "string", "enum": ["low", "medium", "high"]},
                "estimated_price": {"type": "number"}
            },
            "required": ["service_category"]
        }
    }
]
```

### ✅ Real Payments with Escrow
Stripe Connect handles complete payment lifecycle:

```python
# Create PaymentIntent
intent = stripe.PaymentIntent.create(
    amount=order.amount_cents,
    currency="eur",
    transfer_data={
        "destination": provider.stripe_account_id,
        "amount": payout_amount
    }
)

# Escrow: funds held until service completion
# Webhook verifies HMAC signature before processing
```

### ✅ WhatsApp Integration
Official WhatsApp Cloud API for multi-channel communication:

```python
@app.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request):
    body = await request.json()
    
    # Verify webhook signature
    if not verify_whatsapp_signature(request.headers, body):
        raise HTTPException(status_code=401)
    
    # Process incoming message
    message = extract_message(body)
    
    # AI classification + response
    response = classify_and_respond(message)
    
    # Send WhatsApp reply
    await send_whatsapp_message(message.from_number, response)
```

### ✅ Provider Management
Complete provider lifecycle:

- **KYC verification** — Identity and background checks
- **Rating system** — Post-service verified reviews
- **Automated payouts** — Stripe Connect transfers
- **Performance metrics** — Completion rate, response time

### ✅ Admin Dashboard
Real-time KPIs and operational metrics:

- GMV (Gross Merchandise Value)
- Commission revenue
- Lead conversion rate
- Order completion rate
- Provider performance

---

## User Flow

1. **Client arrives** → Landing page + AI chat
2. **Describes need** → AI classifies with Function Calling
3. **AI suggests service** → Client sees price and details
4. **Client purchases** → Stripe Checkout, funds in escrow
5. **Provider assigned** → Service delivered (digital or physical)
6. **Client validates** → Review + funds released to provider
7. **System learns** → KPIs updated, A/B testing, new categories

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/belentani7/noiacore-turbo.git
   cd noiacore-turbo
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start with Docker**
   ```bash
   docker compose up --build
   ```

4. **Seed database**
   ```bash
   docker compose exec backend python seed_db.py
   ```

5. **Access services**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - API Docs: http://localhost:8000/docs

---

## API Documentation

### Health Check
```http
GET /health
```
Returns system health status.

### List Services
```http
GET /api/services
```
Returns all available services.

### Create Lead
```http
POST /api/leads
Content-Type: application/json

{
  "phone": "+34611111111",
  "name": "Client Name",
  "message": "Need help with...",
  "channel": "web"
}
```

### Admin Metrics
```http
GET /api/admin/metrics
X-Admin-Token: your-admin-token
```
Returns GMV, commission, leads, orders.

### WhatsApp Webhook
```http
POST /webhooks/whatsapp
Content-Type: application/json

{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "34611111111",
          "text": {"body": "Need help configuring phone"}
        }]
      }
    }]
  }]
}
```

---

## Environment Variables

```env
# DATABASE
DATABASE_URL=postgresql+psycopg://user:password@host/dbname

# OPENAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# STRIPE (Test or Live)
STRIPE_SECRET_KEY=<YOUR_STRIPE_SECRET_KEY>
STRIPE_PUBLISHABLE_KEY=<YOUR_STRIPE_PUBLISHABLE_KEY>
STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>

# WHATSAPP
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_VERIFY_TOKEN=your-verify-token

# ADMIN
ADMIN_TOKEN=your-secret-admin-token-32-chars

# URLs
PUBLIC_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

---

## Security Features

- **JWT Authentication** — Secure token-based auth
- **Webhook Signature Verification** — HMAC validation for Stripe & WhatsApp
- **Input Validation** — Pydantic models validate all inputs
- **SQL Injection Protection** — SQLAlchemy ORM with parameterized queries
- **CORS Configuration** — Restricted to trusted origins
- **Audit Logging** — All API calls logged with user context
- **Escrow Protection** — Funds held until service completion

---

## Testing

```bash
# Backend tests
pytest

# Frontend tests
npm test

# E2E tests
npm run test:e2e

# Manual API testing
curl http://localhost:8000/health
curl http://localhost:8000/api/services
```

---

## Deployment

### Docker (Production)
```bash
docker compose -f docker-compose.yml up -d
```

### Railway + Vercel
1. Connect GitHub repo to Railway (backend)
2. Connect to Vercel (frontend)
3. Set environment variables
4. Deploy (automatic on push to main)

---

## Project Structure

```
noiacore-turbo/
├── backend_main.py              # FastAPI application (515 lines)
├── api_routes_admin.py          # Admin endpoints
├── api_routes_orders.py         # Order management
├── api_routes_webhook.py        # Stripe & WhatsApp webhooks
├── db_models.py                 # SQLAlchemy models
├── core_config.py               # Pydantic settings
├── services_stripe.py           # Stripe integration
├── seed_db.py                   # Database seeding
├── conftest.py                  # Test configuration
├── test_admin.py                # Admin endpoint tests
├── test_orders.py               # Order endpoint tests
├── docker-compose.yml           # Docker orchestration
├── Dockerfile                   # Backend container
├── frontend_*.tsx               # Next.js components
├── hooks-useAuth.ts             # React authentication hook
├── lib-auth.ts                  # Auth utilities
├── lib-ceo-core.ts              # CEO AI core logic
├── components-TaskExecutor.tsx  # Task execution UI
└── README.md
```

---

## Implementation Highlights

### OpenAI Function Calling
```python
def classify_service_request(message: str) -> dict:
    """Use OpenAI to classify service needs"""
    response = openai_client.chat.completions.create(
        model=settings.openai_model,
        messages=[{"role": "user", "content": message}],
        functions=[{
            "name": "suggest_service",
            "description": "Suggest appropriate service",
            "parameters": {
                "type": "object",
                "properties": {
                    "service_id": {"type": "integer"},
                    "confidence": {"type": "number"},
                    "reasoning": {"type": "string"}
                },
                "required": ["service_id", "confidence"]
            }
        }],
        function_call={"name": "suggest_service"}
    )
    
    return json.loads(response.choices[0].message.function_call.arguments)
```

### Stripe Escrow Flow
```python
@app.post("/api/orders/{order_id}/complete")
async def complete_order(order_id: int):
    """Complete order and release funds from escrow"""
    order = db.query(Order).get(order_id)
    
    # Verify service completion
    if order.status != "completed":
        raise HTTPException(status_code=400, detail="Service not completed")
    
    # Transfer funds to provider
    transfer = stripe.Transfer.create(
        amount=order.payout_cents,
        currency="eur",
        destination=order.provider.stripe_account_id
    )
    
    order.payment_status = "paid_out"
    db.commit()
    
    return {"status": "success", "transfer_id": transfer.id}
```

---

## Roadmap

- [x] MVP with core service marketplace
- [x] Stripe Connect integration
- [x] WhatsApp Cloud API
- [x] Admin dashboard
- [x] Provider management
- [ ] Multi-language support (ES, PT, EN, CA)
- [ ] Advanced analytics
- [ ] A/B testing framework
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## About the Author

**Pedro Belentani** — Full-Stack Engineer & AI Systems Architect

- 🌍 São Paulo → Barcelona
- 🤖 Specializing in AI-driven platforms and service automation
- 🎵 Creative technologist bridging code and art
- 📧 [contact@belentani.com](mailto:contact@belentani.com)
- 🔗 [GitHub](https://github.com/belentani7) | [Portfolio](https://belentani.vercel.app)

---

<div align="center">

**Built with ❤️ and intelligent automation**

*"Every deploy is proof that I existed today."*

</div>
