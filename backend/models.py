from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import datetime
from database import Base
import enum

class RoleEnum(str, enum.Enum):
    mid = "mid"
    top = "top"
    jungle = "jungle"
    adc = "adc"
    support = "support"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    google_id = Column(String, unique=True, nullable=True, index=True)
    email = Column(String, unique=True, index=True)
    display_name = Column(String)
    hashed_password = Column(String, nullable=True)
    sp_points = Column(Integer, default=1)
    role = Column(String, default='user')  # 'admin', 'moderator', 'user'
    riot_summoner_name = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    registrations = relationship("Registration", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    games_created = relationship("CustomGame", back_populates="creator")

class Tournament(Base):
    __tablename__ = "tournaments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    role = Column(Enum(RoleEnum))
    max_players = Column(Integer)
    registration_open = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    registrations = relationship("Registration", back_populates="tournament")
    matches = relationship("Match", back_populates="tournament")

class Registration(Base):
    __tablename__ = "registrations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tournament_id = Column(UUID(as_uuid=True), ForeignKey("tournaments.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    champion = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tournament = relationship("Tournament", back_populates="registrations")
    user = relationship("User", back_populates="registrations")

class Match(Base):
    __tablename__ = "matches"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tournament_id = Column(UUID(as_uuid=True), ForeignKey("tournaments.id"))
    round = Column(Integer)
    player1_registration_id = Column(UUID(as_uuid=True), ForeignKey("registrations.id"), nullable=True)
    player2_registration_id = Column(UUID(as_uuid=True), ForeignKey("registrations.id"), nullable=True)
    winner_registration_id = Column(UUID(as_uuid=True), ForeignKey("registrations.id"), nullable=True)
    riot_match_id = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tournament = relationship("Tournament", back_populates="matches")
    player1 = relationship("Registration", foreign_keys=[player1_registration_id])
    player2 = relationship("Registration", foreign_keys=[player2_registration_id])
    winner = relationship("Registration", foreign_keys=[winner_registration_id])

class TransactionType(str, enum.Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    WAGER_WIN = "WAGER_WIN"
    WAGER_LOSS = "WAGER_LOSS"
    PURCHASE = "PURCHASE"

class GameType(str, enum.Enum):
    ONE_VS_ONE = "1v1"
    FIVE_VS_FIVE = "5v5"

class GameStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    amount = Column(Integer)
    type = Column(Enum(TransactionType))
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="transactions")

class CustomGame(Base):
    __tablename__ = "custom_games"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Enum(GameType))
    wager_amount = Column(Integer)
    status = Column(Enum(GameStatus), default=GameStatus.OPEN)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    winner_team = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    creator = relationship("User", back_populates="games_created")
    players = relationship("GamePlayer", back_populates="game")

class GamePlayer(Base):
    __tablename__ = "game_players"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_id = Column(UUID(as_uuid=True), ForeignKey("custom_games.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    team = Column(Integer)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    game = relationship("CustomGame", back_populates="players")
    user = relationship("User")

class StoreItem(Base):
    __tablename__ = "store_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    description = Column(String)
    sp_cost = Column(Integer)
    item_type = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Redemption(Base):
    __tablename__ = "redemptions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    item_id = Column(UUID(as_uuid=True), ForeignKey('store_items.id'))
    email_sent = Column(Boolean, default=False)
    fulfilled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
