from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from models import RoleEnum, TransactionType, GameType, GameStatus

class UserBase(BaseModel):
    email: str
    display_name: str

class UserCreate(UserBase):
    google_id: str

class User(UserBase):
    id: UUID
    sp_points: int
    role: str
    is_verified: bool
    riot_summoner_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TournamentBase(BaseModel):
    name: str
    role: RoleEnum
    max_players: int
    registration_open: bool = True

class TournamentCreate(TournamentBase):
    pass

class Tournament(TournamentBase):
    id: UUID
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class RegistrationBase(BaseModel):
    champion: str

class RegistrationCreate(RegistrationBase):
    pass

class Registration(RegistrationBase):
    id: UUID
    tournament_id: UUID
    user_id: UUID
    created_at: datetime
    user: Optional[User] = None

    class Config:
        from_attributes = True

class MatchBase(BaseModel):
    round: int
    player1_registration_id: Optional[UUID]
    player2_registration_id: Optional[UUID]

class Match(MatchBase):
    id: UUID
    tournament_id: UUID
    winner_registration_id: Optional[UUID]
    riot_match_id: Optional[str]
    verified: bool
    created_at: datetime
    player1: Optional[Registration] = None
    player2: Optional[Registration] = None
    winner: Optional[Registration] = None

    class Config:
        from_attributes = True

class MatchSubmit(BaseModel):
    riot_match_id: str

class BracketGenerationRequest(BaseModel):
    pass # No body needed, just trigger

class TransactionBase(BaseModel):
    amount: int
    type: TransactionType
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    user_id: UUID

class Transaction(TransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class StoreItemBase(BaseModel):
    name: str
    sp_cost: int
    description: str
    image_url: Optional[str] = None

class StoreItemCreate(StoreItemBase):
    pass

class StoreItem(StoreItemBase):
    id: UUID
    
    class Config:
        from_attributes = True

class GamePlayerBase(BaseModel):
    team: int

class GamePlayerCreate(GamePlayerBase):
    pass

class GamePlayer(GamePlayerBase):
    id: UUID
    game_id: UUID
    user_id: UUID
    joined_at: datetime
    user: Optional[User] = None

    class Config:
        from_attributes = True

class CustomGameBase(BaseModel):
    type: GameType
    wager_amount: int

class CustomGameCreate(CustomGameBase):
    pass

class CustomGame(CustomGameBase):
    id: UUID
    status: GameStatus
    creator_id: UUID
    winner_team: Optional[int] = None
    created_at: datetime
    players: List[GamePlayer] = []
    
    class Config:
        from_attributes = True
