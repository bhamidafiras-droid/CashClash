from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid

from database import get_db
from models import Tournament, User, Registration, Match
from schemas import TournamentCreate, Tournament as TournamentSchema, RegistrationCreate, Registration as RegistrationSchema, Match as MatchSchema
from auth import get_current_user
from services.bracket_generator import generate_bracket

router = APIRouter(
    prefix="/tournaments",
    tags=["tournaments"]
)

@router.post("/", response_model=TournamentSchema)
async def create_tournament(tournament: TournamentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # In a real app, check if user is admin. For MVP, anyone can create.
    new_tournament = Tournament(**tournament.dict(), created_by=current_user.id)
    db.add(new_tournament)
    await db.commit()
    await db.refresh(new_tournament)
    return new_tournament

@router.get("/")
async def list_tournaments(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    
    result = await db.execute(select(Tournament))
    tournaments = result.scalars().all()
    
    tournaments_with_count = []
    for tournament in tournaments:
        # Count registrations
        count_result = await db.execute(
            select(func.count(Registration.id)).where(Registration.tournament_id == tournament.id)
        )
        registration_count = count_result.scalar()
        
        tournaments_with_count.append({
            "id": str(tournament.id),
            "name": tournament.name,
            "role": tournament.role,
            "max_players": tournament.max_players,
            "registration_open": tournament.registration_open,
            "created_by": str(tournament.created_by),
            "created_at": tournament.created_at.isoformat(),
            "registration_count": registration_count,
            "spots_available": tournament.max_players - registration_count
        })
    
    return tournaments_with_count

@router.get("/{tournament_id}", response_model=TournamentSchema)
async def get_tournament(tournament_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tournament).where(Tournament.id == tournament_id))
    tournament = result.scalars().first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament

@router.post("/{tournament_id}/register", response_model=RegistrationSchema)
async def register_player(tournament_id: uuid.UUID, registration: RegistrationCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if tournament exists
    result = await db.execute(select(Tournament).where(Tournament.id == tournament_id))
    tournament = result.scalars().first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    if not tournament.registration_open:
        raise HTTPException(status_code=400, detail="Registration is closed")

    # Check if already registered
    result = await db.execute(select(Registration).where(Registration.tournament_id == tournament_id, Registration.user_id == current_user.id))
    existing_reg = result.scalars().first()
    if existing_reg:
        raise HTTPException(status_code=400, detail="Already registered")

    new_reg = Registration(
        tournament_id=tournament_id,
        user_id=current_user.id,
        champion=registration.champion
    )
    db.add(new_reg)
    await db.commit()
    await db.refresh(new_reg)
    return new_reg

@router.post("/{tournament_id}/generate-bracket")
async def generate_bracket_route(tournament_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Fetch registrations
    result = await db.execute(select(Registration).where(Registration.tournament_id == tournament_id).options(selectinload(Registration.user)))
    registrations = result.scalars().all()
    
    if len(registrations) < 2:
        raise HTTPException(status_code=400, detail="Not enough players to generate bracket")

    # Prepare data for LLM
    players_data = [{"id": str(r.id), "name": r.user.display_name, "champion": r.champion} for r in registrations]
    
    # Call LLM service
    bracket_data = await generate_bracket(players_data)
    
    # Create matches in DB
    pairs = bracket_data.get("pairs", [])
    bye_id = bracket_data.get("bye")
    
    created_matches = []
    
    for pair in pairs:
        p1_id = uuid.UUID(pair["player1"])
        p2_id = uuid.UUID(pair["player2"])
        
        match = Match(
            tournament_id=tournament_id,
            round=1,
            player1_registration_id=p1_id,
            player2_registration_id=p2_id
        )
        db.add(match)
        created_matches.append(match)
        
    if bye_id:
        # Handle bye (auto-win or wait for next round)
        # For simplicity, create a match with no opponent and auto-set winner
        bye_reg_id = uuid.UUID(bye_id)
        match = Match(
            tournament_id=tournament_id,
            round=1,
            player1_registration_id=bye_reg_id,
            player2_registration_id=None,
            winner_registration_id=bye_reg_id,
            verified=True
        )
        db.add(match)
        created_matches.append(match)

    # Close registration
    result = await db.execute(select(Tournament).where(Tournament.id == tournament_id))
    tournament = result.scalars().first()
    tournament.registration_open = False
    
    await db.commit()
    
    return {"message": "Bracket generated", "matches": len(created_matches)}

@router.get("/{tournament_id}/matches", response_model=List[MatchSchema])
async def get_tournament_matches(tournament_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Match)
        .where(Match.tournament_id == tournament_id)
        .options(
            selectinload(Match.player1).selectinload(Registration.user),
            selectinload(Match.player2).selectinload(Registration.user),
            selectinload(Match.winner).selectinload(Registration.user)
        )
    )
    return result.scalars().all()
