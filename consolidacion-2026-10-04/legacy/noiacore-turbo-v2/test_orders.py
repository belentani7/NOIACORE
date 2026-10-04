import pytest
from httpx import AsyncClient
from uuid import uuid4

@pytest.mark.asyncio
async def test_create_order_success(client: AsyncClient, test_client):
    """Test successful order creation."""

    payload = {
        "client_id": test_client.id,
        "table_number": 5,
        "items": [
            {"sku": "pasta-001", "name": "Carbonara", "price_cents": 1500, "quantity": 1},
            {"sku": "wine-001", "name": "Rioja", "price_cents": 2000, "quantity": 1}
        ],
        "notes": "No onion"
    }

    response = await client.post("/api/v1/restaurants/orders", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["client_id"] == test_client.id
    assert data["total_cents"] == 3500
    assert data["status"] == "awaiting_payment"
    assert "payment_intent_id" in data

@pytest.mark.asyncio
async def test_create_order_client_not_found(client: AsyncClient):
    """Test order creation with non-existent client."""

    payload = {
        "client_id": str(uuid4()),
        "items": [
            {"sku": "pasta-001", "name": "Carbonara", "price_cents": 1500, "quantity": 1}
        ]
    }

    response = await client.post("/api/v1/restaurants/orders", json=payload)

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_create_order_invalid_items(client: AsyncClient, test_client):
    """Test order creation with invalid items."""

    payload = {
        "client_id": test_client.id,
        "items": []  # Empty items
    }

    response = await client.post("/api/v1/restaurants/orders", json=payload)

    assert response.status_code == 422  # Validation error

@pytest.mark.asyncio
async def test_get_order(client: AsyncClient, test_client):
    """Test retrieving order details."""

    # Create order first
    create_payload = {
        "client_id": test_client.id,
        "items": [
            {"sku": "pasta-001", "name": "Carbonara", "price_cents": 1500, "quantity": 1}
        ]
    }

    create_response = await client.post("/api/v1/restaurants/orders", json=create_payload)
    order_id = create_response.json()["id"]

    # Retrieve order
    response = await client.get(f"/api/v1/restaurants/orders/{order_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == order_id
    assert data["client_id"] == test_client.id

@pytest.mark.asyncio
async def test_get_order_not_found(client: AsyncClient):
    """Test retrieving non-existent order."""

    response = await client.get(f"/api/v1/restaurants/orders/{str(uuid4())}")

    assert response.status_code == 404
