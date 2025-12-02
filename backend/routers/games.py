from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from database import get_db
from models import User, CustomGame, GamePlayer, GameType, GameStatus, Transaction, TransactionType
from schemas import CustomGame as CustomGameSchema, CustomGameCreate
from auth import get_current_user
from typing import List
import uuid

router = APIRouter(
    prefix="/games",
    tags=["games"]
)

@router.post("/create", response_model=CustomGameSchema)
async def create_game(game_data: CustomGameCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Only moderators and admins can create games
    if current_user.role not in ['admin', 'moderator']:
        raise HTTPException(status_code=403, detail="Only moderators and admins can create games")
    
    # Admins/Moderators don't need SP to create games - they're just setting up games for users
    # Create game
    game = CustomGame(
        type=game_data.type,
        wager_amount=game_data.wager_amount,
        creator_id=current_user.id,
        status=GameStatus.OPEN
    )
    db.add(game)
    await db.commit()
    await db.refresh(game)
    
    # Reload game with players (empty at creation)
    result = await db.execute(
        select(CustomGame)
        .options(selectinload(CustomGame.players).selectinload(GamePlayer.user))
        .where(CustomGame.id == game.id)
    )
    return result.scalars().first()

@router.get("/", response_model=List[CustomGameSchema])
async def list_games(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CustomGame)
        .options(selectinload(CustomGame.players).selectinload(GamePlayer.user))
        .where(CustomGame.status == GameStatus.OPEN)
    )
    return result.scalars().all()

@router.post("/{game_id}/join", response_model=CustomGameSchema)
async def join_game(game_id: uuid.UUID, team: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Get game
    result = await db.execute(
        select(CustomGame)
        .options(selectinload(CustomGame.players))
        .where(CustomGame.id == game_id)
    )
    game = result.scalars().first()
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
        
    if game.status != GameStatus.OPEN:
        raise HTTPException(status_code=400, detail="Game is not open")
        
    # Check if user already joined
    for player in game.players:
        if player.user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Already joined this game")
            
    # Check team capacity
    team_players = [p for p in game.players if p.team == team]
    max_per_team = 1 if game.type == GameType.ONE_VS_ONE else 5
    
    if len(team_players) >= max_per_team:
        raise HTTPException(status_code=400, detail="Team is full")
        
    # Check funds
    if current_user.sp_points < game.wager_amount:
        raise HTTPException(status_code=400, detail="Insufficient SP points")
        
    # Add player
    player = GamePlayer(
        game_id=game.id,
        user_id=current_user.id,
        team=team
    )
    db.add(player)
    
    # Deduct wager
    transaction = Transaction(
        user_id=current_user.id,
        amount=-game.wager_amount,
        type=TransactionType.WAGER_LOSS,
        description=f"Wager for game {game.id}"
    )
    current_user.sp_points -= game.wager_amount
    db.add(transaction)
    
    # Check if game is full to start
    total_players = len(game.players) + 1
    required_players = 2 if game.type == GameType.ONE_VS_ONE else 10
    
    if total_players == required_players:
        game.status = GameStatus.IN_PROGRESS
        
    await db.commit()
    
    # Reload game
    result = await db.execute(
        select(CustomGame)
        .options(selectinload(CustomGame.players).selectinload(GamePlayer.user))
        .where(CustomGame.id == game.id)
    )
    return result.scalars().first()

@router.post("/{game_id}/verify", response_model=CustomGameSchema)
async def verify_game(game_id: uuid.UUID, winner_team: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Only moderators and admins can verify games
    if current_user.role not in ['admin', 'moderator']:
        raise HTTPException(status_code=403, detail="Only moderators and admins can verify games")
        
    result = await db.execute(
        select(CustomGame)
        .options(selectinload(CustomGame.players))
        .where(CustomGame.id == game_id)
    )
    game = result.scalars().first()
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
        
    if game.status == GameStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Game already completed")
        
    game.status = GameStatus.COMPLETED
    game.winner_team = winner_team
    
    # Distribute winnings
    # Total pot = wager * total players
    # Winners get: wager * 2 (their wager back + opponent's wager)
    # This assumes 1v1 or equal team sizes. For 5v5, each winner gets 2x wager.
    
    winning_players = [p for p in game.players if p.team == winner_team]
    
    for player in winning_players:
        # Get user to update balance
        user_result = await db.execute(select(User).where(User.id == player.user_id))
        user = user_result.scalars().first()
        
        winnings = game.wager_amount * 2
        
        transaction = Transaction(
            user_id=user.id,
            amount=winnings,
            type=TransactionType.WAGER_WIN,
            description=f"Won game {game.id}"
        )
        user.sp_points += winnings
        db.add(transaction)
        db.add(user)
        
    await db.commit()
    
    # Reload game
    result = await db.execute(
        select(CustomGame)
        .options(selectinload(CustomGame.players).selectinload(GamePlayer.user))
        .where(CustomGame.id == game.id)
    )
    return result.scalars().first()
