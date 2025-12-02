import random

async def verify_match(riot_match_id: str, player_champion: str) -> bool:
    """
    Mocks the Riot API verification.
    In a real app, this would call GET /lol/match/v5/matches/{matchId}
    and check if the participant played the correct champion and won.
    """
    print(f"Verifying match {riot_match_id} for champion {player_champion}...")
    
    # Simulate API call latency
    import asyncio
    await asyncio.sleep(1)
    
    # Mock logic: If match ID starts with "WIN", return True. Else False.
    if riot_match_id.upper().startswith("WIN"):
        return True
    
    # Randomly fail for other IDs to simulate loss or wrong champion
    return False

async def get_match_winner(riot_match_id: str, player1_champ: str, player2_champ: str) -> str:
    """
    Returns 'player1' or 'player2' based on who won.
    """
    # Mock logic
    if riot_match_id.upper().endswith("P1"):
        return "player1"
    elif riot_match_id.upper().endswith("P2"):
        return "player2"
    
    return "player1" # Default
