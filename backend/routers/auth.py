from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import User
from auth import get_current_user, get_password_hash, verify_password
from google.oauth2 import id_token
from google.auth.transport import requests
from passlib.context import CryptContext
import bcrypt
import os
import jwt
import datetime


router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"


def create_access_token(user_id: str, email: str):
    access_token_expires = datetime.timedelta(minutes=60 * 24 * 7)  # 7 days
    expire = datetime.datetime.utcnow() + access_token_expires
    to_encode = {"sub": email, "user_id": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

class GoogleLoginRequest(BaseModel):
    token: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/google-login")
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(request.token, requests.Request(), GOOGLE_CLIENT_ID)
        
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', 'Unknown')

        # Check if user exists
        result = await db.execute(select(User).where(User.google_id == google_id))
        user = result.scalars().first()

        if not user:
            # Create new user
            user = User(google_id=google_id, email=email, display_name=name)
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        # Create JWT token
        access_token = create_access_token(str(user.id), user.email)
        
        return {"access_token": access_token, "token_type": "bearer", "user": {"id": str(user.id), "display_name": user.display_name, "email": user.email}}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid token: {str(e)}")

@router.post("/register")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == request.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    user = User(
        email=request.email,
        display_name=request.display_name,
        hashed_password=hashed_password
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create JWT token
    access_token = create_access_token(str(user.id), user.email)
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "id": str(user.id), 
            "display_name": user.display_name, 
            "email": user.email,
            "sp_points": user.sp_points,
            "role": user.role
        }
    }

@router.post("/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalars().first()
    
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    access_token = create_access_token(str(user.id), user.email)
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "id": str(user.id), 
            "display_name": user.display_name, 
            "email": user.email,
            "sp_points": user.sp_points,
            "role": user.role
        }
    }

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
