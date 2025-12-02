from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/dbname")

print(f"DEBUG: Original DATABASE_URL starts with: {DATABASE_URL.split(':')[0]}")

# Fix Render database URL for asyncpg
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

print(f"DEBUG: Final DATABASE_URL starts with: {DATABASE_URL.split(':')[0]}")

engine = create_async_engine(DATABASE_URL, echo=True)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Alias for compatibility
async_session = AsyncSessionLocal

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
