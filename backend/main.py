from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, tournaments, matches, store, games, admin
from database import engine, Base
from auth import get_password_hash
app = FastAPI(title="CashClash API")

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default
    "https://cashclash.onrender.com",  # Production frontend
    "https://*.onrender.com",  # All Render subdomains
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(tournaments.router)
app.include_router(matches.router)
app.include_router(store.router)
app.include_router(games.router)
app.include_router(admin.router)

@app.on_event("startup")
async def startup():
    print("🚀 Starting CashClash Backend...")
    from sqlalchemy import select
    from models import User
    from auth import get_password_hash
    from database import async_session
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create default admin if not exists
    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.email == "admin@cashclash.com")
        )
        admin = result.scalars().first()
        
        if not admin:
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
        else:
            print("ℹ️  Admin user already exists")

@app.get("/")
async def root():
    return {"message": "Welcome to the LoL Tournament Platform API"}
