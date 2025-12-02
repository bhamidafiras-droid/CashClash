#!/usr/bin/env python3
"""
Startup script for Render deployment
Creates default admin user if it doesn't exist
"""
import asyncio
from sqlalchemy import select
from database import async_session, engine, Base
from models import User
from auth import get_password_hash

async def init_admin():
    """Create default admin user if not exists"""
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        # Check if admin exists
        result = await session.execute(
            select(User).where(User.email == "admin@cashclash.com")
        )
        admin = result.scalars().first()
        
        if not admin:
            # Create admin user
            admin = User(
                email="admin@cashclash.com",
                hashed_password=get_password_hash("Admin123!@#"),
                display_name="Admin",
                role="admin",
                is_verified=True,
                sp_points=10000
            )
            session.add(admin)
            await session.commit()
            print("✅ Default admin user created!")
            print("   Email: admin@cashclash.com")
            print("   Password: Admin123!@#")
        else:
            print("ℹ️  Admin user already exists")

if __name__ == "__main__":
    asyncio.run(init_admin())
