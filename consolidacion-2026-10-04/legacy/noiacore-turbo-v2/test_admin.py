import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_admin_health(client: AsyncClient, admin_token):
    """Test admin health endpoint."""

    response = await client.get(
        "/api/v1/admin/health",
        headers={"X-Admin-Token": admin_token}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data

@pytest.mark.asyncio
async def test_admin_health_unauthorized(client: AsyncClient):
    """Test admin health without token."""

    response = await client.get("/api/v1/admin/health")

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_admin_health_invalid_token(client: AsyncClient):
    """Test admin health with invalid token."""

    response = await client.get(
        "/api/v1/admin/health",
        headers={"X-Admin-Token": "invalid-token"}
    )

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_metrics(client: AsyncClient, admin_token, test_client):
    """Test metrics endpoint."""

    response = await client.get(
        "/api/v1/admin/metrics",
        headers={"X-Admin-Token": admin_token}
    )

    assert response.status_code == 200
    data = response.json()
    assert "total_clients" in data
    assert "total_orders" in data
    assert "total_revenue_cents" in data

@pytest.mark.asyncio
async def test_list_clients(client: AsyncClient, admin_token, test_client):
    """Test list clients endpoint."""

    response = await client.get(
        "/api/v1/admin/clients",
        headers={"X-Admin-Token": admin_token}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(c["id"] == test_client.id for c in data)

@pytest.mark.asyncio
async def test_complete_order(client: AsyncClient, admin_token, test_client):
    """Test completing an order."""

    # Create order
    create_payload = {
        "client_id": test_client.id,
        "items": [
            {"sku": "pasta-001", "name": "Carbonara", "price_cents": 1500, "quantity": 1}
        ]
    }

    create_response = await client.post("/api/v1/restaurants/orders", json=create_payload)
    order_id = create_response.json()["id"]

    # Complete order
    response = await client.post(
        f"/api/v1/admin/orders/{order_id}/complete",
        headers={"X-Admin-Token": admin_token}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "success"
