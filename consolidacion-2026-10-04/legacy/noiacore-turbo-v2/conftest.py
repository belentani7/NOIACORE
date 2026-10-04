import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from httpx import AsyncClient
from main_app import app
from db_session import get_db, Base
from db_models import RestaurantClient, RestaurantOrder
import uuid

DATABASE_TEST_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture
async def test_db():
    """Create test database."""
    engine = create_async_engine(
        DATABASE_TEST_URL,
        connect_args={"check_same_thread": False},
        poolclass=None,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async def override_get_db():
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    yield async_session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()

@pytest_asyncio.fixture
async def client(test_db):
    """HTTP test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def test_client(test_db):
    """Create test restaurant client."""
    async with test_db() as db:
        client = RestaurantClient(
            id=str(uuid.uuid4()),
            name="Test Restaurant",
            owner_phone="34612345678",
            status="active"
        )
        db.add(client)
        await db.commit()
        await db.refresh(client)
        return client

@pytest.fixture
def admin_token():
    """Admin token for testing."""
    return "test-admin-token-32-chars-long-xxx"
