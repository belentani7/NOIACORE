NOIACORE + AUREA X v2.0 - SETUP GUIDE

═══════════════════════════════════════════════════════════════════

1. INSTALL DEPENDENCIES

    pip install poetry
    poetry install
    poetry install --with dev  # For development

2. CONFIGURE ENVIRONMENT

    cp env-example.txt .env
    # Edit .env with your actual credentials

3. LOCAL DEVELOPMENT

    # Option A: Docker
    docker compose -f docker-compose-dev.yml up

    # Option B: Manual
    # Terminal 1: PostgreSQL
    docker run -d -p 5432:5432 \
      -e POSTGRES_USER=noiacore_user \
      -e POSTGRES_PASSWORD=noiacore_pass_dev \
      -e POSTGRES_DB=noiacore_db \
      postgres:16-alpine

    # Terminal 2: API
    uvicorn main_app:app --reload

4. TEST DATABASE SETUP

    # Run migrations (using Alembic)
    alembic upgrade head

    # Or let SQLAlchemy create tables on startup
    # (already configured in main_app.py lifespan)

5. RUN TESTS

    pytest -v
    pytest --cov=.  # With coverage

6. API ENDPOINTS

    Health:        GET  http://localhost:8000/health
    Docs:          GET  http://localhost:8000/docs
    Create Order:  POST http://localhost:8000/api/v1/restaurants/orders
    Get Order:     GET  http://localhost:8000/api/v1/restaurants/orders/{id}
    Admin Health:  GET  http://localhost:8000/api/v1/admin/health
    Admin Metrics: GET  http://localhost:8000/api/v1/admin/metrics
    Stripe Hook:   POST http://localhost:8000/webhooks/stripe

7. ADMIN AUTHENTICATION

    All admin endpoints require header:
    X-Admin-Token: <value from .env ADMIN_TOKEN>

    Example:
    curl -H "X-Admin-Token: dev-admin-token-32-chars-minimum-xxx" \
         http://localhost:8000/api/v1/admin/metrics

8. STRIPE TESTING

    Use Stripe test keys from https://dashboard.stripe.com/

    Test webhook locally:
    stripe listen --forward-to localhost:8000/webhooks/stripe

    Trigger test event:
    stripe trigger payment_intent.succeeded

9. DATABASE MIGRATIONS (Alembic)

    Initialize:
    alembic init alembic

    Generate migration:
    alembic revision --autogenerate -m "description"

    Apply migration:
    alembic upgrade head

10. CODE QUALITY

    Format:
    black .
    isort .

    Lint:
    flake8 .
    mypy main_app

    All together:
    black . && isort . && mypy main_app && flake8 .

11. DEPLOYMENT

    Production Docker build:
    docker build -t noiacore:latest .

    Push to registry:
    docker tag noiacore:latest myregistry/noiacore:latest
    docker push myregistry/noiacore:latest

    Deploy to Railway/Heroku:
    - Connect GitHub repository
    - Set environment variables in platform dashboard
    - Platform detects Dockerfile and deploys automatically

12. MONITORING & LOGGING

    Logs available at:
    - Docker: docker logs noiacore-api
    - File: Configure in core_config.py
    - Sentry: Set SENTRY_DSN in .env (optional)

    Health check:
    curl http://localhost:8000/health

13. TROUBLESHOOTING

    DB connection error:
    - Check DATABASE_URL in .env
    - Verify PostgreSQL is running
    - Check credentials

    Import errors:
    - Run: poetry install
    - Check PYTHONPATH includes project root

    Tests fail:
    - Run: pytest -v for details
    - Check DB is clean: docker compose down -v

    Stripe webhook not firing:
    - Verify webhook secret in .env
    - Use stripe listen locally for testing
    - Check logs: docker logs noiacore-api

═══════════════════════════════════════════════════════════════════

STRUCTURE OVERVIEW:

main_app.py              ← Entry point (FastAPI + lifespan)
  ├─ api_routes_*.py    ← Route handlers
  ├─ services_*.py      ← Business logic (Stripe, orders, etc)
  ├─ db_*.py            ← Database (models, session)
  ├─ schemas_*.py       ← Pydantic validation
  └─ core_config.py     ← Configuration

tests/                   ← Test suite
  ├─ conftest.py        ← Fixtures + test DB setup
  ├─ test_orders.py     ← Order endpoint tests
  └─ test_admin.py      ← Admin endpoint tests

═══════════════════════════════════════════════════════════════════
