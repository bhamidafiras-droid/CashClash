from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import uuid

from database import get_db
from models import Match, Registration, User
from schemas import MatchSubmit, Match as MatchSchema
from auth import get_current_user
from services.riot_api import verify_match, get_match_winner
from services.email_service import send_email

router = APIRouter(
    prefix="/matches",
    tags=["matches"]
)

@router.post("/{match_id}/submit", response_model=MatchSchema)
async def submit_match_result(match_id: uuid.UUID, submit_data: MatchSubmit, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Match)
        .where(Match.id == match_id)
        .options(
            selectinload(Match.player1).selectinload(Registration.user),
            selectinload(Match.player2).selectinload(Registration.user)
        )
    )
    match = result.scalars().first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.verified:
        raise HTTPException(status_code=400, detail="Match already verified")

    # Verify user is part of the match
    is_p1 = match.player1 and match.player1.user_id == current_user.id
    is_p2 = match.player2 and match.player2.user_id == current_user.id
    
    if not (is_p1 or is_p2):
        raise HTTPException(status_code=403, detail="You are not a participant in this match")

    # Call Riot API to verify
    # We need to know which champion the user played.
    user_reg = match.player1 if is_p1 else match.player2
    opponent_reg = match.player2 if is_p1 else match.player1
    
    # Mock verification
    # logic: verify_match(riot_match_id, champion_name)
    # In a real scenario, we'd check both players.
    
    is_valid = await verify_match(submit_data.riot_match_id, user_reg.champion)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Match verification failed. Ensure you played the correct champion and the match ID is valid.")
        
    # Determine winner
    # Mock logic: get_match_winner returns 'player1' or 'player2'
    winner_role = await get_match_winner(submit_data.riot_match_id, user_reg.champion, opponent_reg.champion if opponent_reg else "")
    
    winner_reg = match.player1 if winner_role == 'player1' else match.player2
    
    match.riot_match_id = submit_data.riot_match_id
    match.winner_registration_id = winner_reg.id
    match.verified = True
    
    db.add(match)
    await db.commit()
    await db.refresh(match)
    
    # Send email notification
    if winner_reg.user.email:
        await send_email(winner_reg.user.email, "Match Won!", f"Congratulations, you won match {match.id}!")
    
    return match
