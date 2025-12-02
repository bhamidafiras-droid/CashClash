from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import User, Transaction, TransactionType, StoreItem, Redemption
from schemas import Transaction as TransactionSchema, StoreItem as StoreItemSchema
from auth import get_current_user
from typing import List
import uuid

router = APIRouter(
    prefix="/store",
    tags=["store"]
)

@router.post("/buy-sp", response_model=TransactionSchema)
async def buy_sp(amount: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    # Mock payment processing
    # In a real app, we would integrate Stripe/PayPal here
    
    # Create transaction
    transaction = Transaction(
        user_id=current_user.id,
        amount=amount,
        type=TransactionType.DEPOSIT,
        description=f"Purchased {amount} SP"
    )
    
    # Update user balance
    current_user.sp_points += amount
    
    db.add(transaction)
    db.add(current_user)
    await db.commit()
    await db.refresh(transaction)
    
    return transaction

@router.get("/items", response_model=List[StoreItemSchema])
async def get_store_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StoreItem))
    return result.scalars().all()

@router.post("/redeem/{item_id}", response_model=TransactionSchema)
async def redeem_item(item_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Get item
    result = await db.execute(select(StoreItem).where(StoreItem.id == item_id))
    item = result.scalars().first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if current_user.sp_points < item.sp_cost:
        raise HTTPException(status_code=400, detail="Insufficient SP points")
    
    # Create transaction
    transaction = Transaction(
        user_id=current_user.id,
        amount=-item.sp_cost,
        type=TransactionType.PURCHASE,
        description=f"Redeemed {item.name}"
    )
    
    # Create redemption record for admin tracking
    redemption = Redemption(
        user_id=current_user.id,
        item_id=item.id,
        email_sent=False,
        fulfilled=False
    )
    
    # Update user balance
    current_user.sp_points -= item.sp_cost
    
    db.add(transaction)
    db.add(redemption)
    db.add(current_user)
    await db.commit()
    await db.refresh(transaction)
    
    return transaction

# Initialize store items (helper endpoint for MVP)
@router.post("/init-items")
async def init_store_items(db: AsyncSession = Depends(get_db)):
    # Check if items exist
    result = await db.execute(select(StoreItem))
    if result.scalars().first():
        return {"message": "Items already initialized"}
        
    items = [
        StoreItem(name="1380 RP", sp_cost=10, description="League of Legends 1380 RP Card", item_type="rp_card"),
        StoreItem(name="650 RP", sp_cost=5, description="League of Legends 650 RP Card", item_type="rp_card"),
        StoreItem(name="2800 RP", sp_cost=20, description="League of Legends 2800 RP Card", item_type="rp_card"),
    ]
    
    db.add_all(items)
    await db.commit()
    return {"message": "Store items initialized"}
