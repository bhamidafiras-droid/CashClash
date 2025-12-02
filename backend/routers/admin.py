from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from database import get_db
from models import User, CustomGame, GamePlayer, Redemption, StoreItem, Transaction
from routers.auth import get_current_user
from pydantic import BaseModel
from typing import Optional, List
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])

# Pydantic models
class UserUpdate(BaseModel):
    role: Optional[str] = None
    sp_points: Optional[int] = None
    is_verified: Optional[bool] = None

class GameCreate(BaseModel):
    type: str  # '1v1' or '5v5'
    wager_amount: int

class GameVerify(BaseModel):
    winner_team: int

class EmailRequest(BaseModel):
    redemption_id: str
    message: Optional[str] = None

# Dependency to check if user is admin
async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Dependency to check if user is admin or moderator
async def require_moderator(current_user: User = Depends(get_current_user)):
    if current_user.role not in ['admin', 'moderator']:
        raise HTTPException(status_code=403, detail="Moderator or Admin access required")
    return current_user

# ============= USER MANAGEMENT =============

@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all users with their details"""
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [{
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "sp_points": user.sp_points,
        "role": user.role,
        "riot_summoner_name": user.riot_summoner_name,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat()
    } for user in users]

@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    updates: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user details (promote to moderator, adjust SP, verify account)"""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if updates.role is not None:
        if updates.role not in ['admin', 'moderator', 'user']:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = updates.role
    
    if updates.sp_points is not None:
        user.sp_points = updates.sp_points
    
    if updates.is_verified is not None:
        user.is_verified = updates.is_verified
    
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "sp_points": user.sp_points,
        "role": user.role,
        "is_verified": user.is_verified
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a user account"""
    await db.execute(delete(User).where(User.id == uuid.UUID(user_id)))
    await db.commit()
    return {"message": "User deleted successfully"}

# ============= GAME MANAGEMENT =============

@router.post("/games")
async def create_game(
    game_data: GameCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator)
):
    """Create a custom game (moderator/admin only)"""
    new_game = CustomGame(
        type=game_data.type,
        wager_amount=game_data.wager_amount,
        creator_id=current_user.id,
        status='OPEN'
    )
    db.add(new_game)
    await db.commit()
    await db.refresh(new_game)
    
    return {
        "id": str(new_game.id),
        "type": new_game.type,
        "wager_amount": new_game.wager_amount,
        "status": new_game.status
    }

@router.get("/games")
async def list_all_games(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator)
):
    """List all games (all statuses)"""
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(CustomGame).options(
            selectinload(CustomGame.players).selectinload(GamePlayer.user)
        )
    )
    games = result.scalars().all()
    
    games_list = []
    for game in games:
        games_list.append({
            "id": str(game.id),
            "type": game.type,
            "wager_amount": game.wager_amount,
            "status": game.status,
            "winner_team": game.winner_team,
            "created_at": game.created_at.isoformat(),
            "players": [{
                "user_id": str(p.user_id),
                "team": p.team,
                "user": {
                    "id": str(p.user.id),
                    "display_name": p.user.display_name,
                    "email": p.user.email
                } if p.user else None
            } for p in game.players]
        })
    
    return games_list

@router.delete("/games/{game_id}")
async def delete_game(
    game_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a game"""
    # Delete associated players first
    await db.execute(delete(GamePlayer).where(GamePlayer.game_id == uuid.UUID(game_id)))
    # Delete the game
    await db.execute(delete(CustomGame).where(CustomGame.id == uuid.UUID(game_id)))
    await db.commit()
    return {"message": "Game deleted successfully"}

@router.post("/games/{game_id}/verify")
async def verify_game_winner(
    game_id: str,
    verify_data: GameVerify,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator)
):
    """Verify game winner and distribute SP (moderator/admin only)"""
    # Get the game
    result = await db.execute(select(CustomGame).where(CustomGame.id == uuid.UUID(game_id)))
    game = result.scalars().first()
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if game.status == 'COMPLETED':
        raise HTTPException(status_code=400, detail="Game already completed")
    
    # Get all players
    players_result = await db.execute(
        select(GamePlayer).where(GamePlayer.game_id == game.id)
    )
    players = players_result.scalars().all()
    
    # Calculate winnings
    winner_team = verify_data.winner_team
    winners = [p for p in players if p.team == winner_team]
    losers = [p for p in players if p.team != winner_team]
    
    total_pot = game.wager_amount * len(players)
    winnings_per_winner = total_pot // len(winners) if winners else 0
    
    # Distribute SP to winners
    for winner in winners:
        user_result = await db.execute(select(User).where(User.id == winner.user_id))
        user = user_result.scalars().first()
        if user:
            user.sp_points += winnings_per_winner
            
            # Record transaction
            transaction = Transaction(
                user_id=user.id,
                amount=winnings_per_winner,
                type='WAGER_WIN',
                description=f"Won game {game_id}"
            )
            db.add(transaction)
    
    # Update game status
    game.status = 'COMPLETED'
    game.winner_team = winner_team
    
    await db.commit()
    
    return {
        "message": "Game verified successfully",
        "winner_team": winner_team,
        "winnings_per_winner": winnings_per_winner
    }

# ============= REDEMPTION MANAGEMENT =============

@router.get("/redemptions")
async def list_redemptions(
    pending_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all redemptions"""
    query = select(Redemption)
    if pending_only:
        query = query.where(Redemption.fulfilled == False)
    
    result = await db.execute(query)
    redemptions = result.scalars().all()
    
    redemption_list = []
    for redemption in redemptions:
        # Get user details
        user_result = await db.execute(select(User).where(User.id == redemption.user_id))
        user = user_result.scalars().first()
        
        # Get item details
        item_result = await db.execute(select(StoreItem).where(StoreItem.id == redemption.item_id))
        item = item_result.scalars().first()
        
        redemption_list.append({
            "id": str(redemption.id),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "display_name": user.display_name
            } if user else None,
            "item": {
                "id": str(item.id),
                "name": item.name,
                "description": item.description
            } if item else None,
            "email_sent": redemption.email_sent,
            "fulfilled": redemption.fulfilled,
            "created_at": redemption.created_at.isoformat()
        })
    
    return redemption_list

@router.post("/redemptions/{redemption_id}/send-email")
async def send_redemption_email(
    redemption_id: str,
    email_data: EmailRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Mark redemption email as sent (in production, this would actually send an email)"""
    result = await db.execute(select(Redemption).where(Redemption.id == uuid.UUID(redemption_id)))
    redemption = result.scalars().first()
    
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
    
    redemption.email_sent = True
    await db.commit()
    
    # TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    # For now, just mark as sent
    
    return {"message": "Email marked as sent", "redemption_id": redemption_id}

@router.patch("/redemptions/{redemption_id}/fulfill")
async def fulfill_redemption(
    redemption_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Mark redemption as fulfilled"""
    result = await db.execute(select(Redemption).where(Redemption.id == uuid.UUID(redemption_id)))
    redemption = result.scalars().first()
    
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
    
    redemption.fulfilled = True
    await db.commit()
    
    return {"message": "Redemption marked as fulfilled"}

# ============= STATISTICS =============

@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get platform statistics"""
    # Total users
    users_result = await db.execute(select(User))
    total_users = len(users_result.scalars().all())
    
    # Total games
    games_result = await db.execute(select(CustomGame))
    total_games = len(games_result.scalars().all())
    
    # Pending redemptions
    redemptions_result = await db.execute(
        select(Redemption).where(Redemption.fulfilled == False)
    )
    pending_redemptions = len(redemptions_result.scalars().all())
    
    # Total SP in circulation
    users_result = await db.execute(select(User))
    users = users_result.scalars().all()
    total_sp = sum(user.sp_points for user in users)
    
    return {
        "total_users": total_users,
        "total_games": total_games,
        "pending_redemptions": pending_redemptions,
        "total_sp_in_circulation": total_sp
    }
