from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, tournaments, matches, store, games, admin
from database import engine, Base

app = FastAPI(title="CashClash API")

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Vite default
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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Welcome to the LoL Tournament Platform API"}
