import os
import json
import httpx
from typing import List, Dict, Any

LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_API_URL = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions") # Default to OpenAI for example

async def generate_bracket(players: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generates a bracket using an LLM.
    players: List of dicts with id, name, champion
    """
    
    prompt = f"""
You are a tournament bracket generator for a League of Legends 1v1 event.

Goal: Create the fairest possible first-round pairings based on the champions players have chosen.
Avoid known hard-counter matchups in early rounds if possible.
If perfect fairness is impossible, choose the pairing set with the lowest overall counter impact.

Rules:
- Each player has registered with exactly one champion.
- Early rounds (Round 1 only) must avoid hard counters (e.g. assassin vs immobile mage, ranged poke vs melee).
- Return JSON with "pairs": [{{ "player1": "<id>", "player2": "<id>" }}, ...] and optional "bye": "<id or null>".

Here is the player list:
{json.dumps(players, indent=2)}
"""

    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4-turbo", # Or gemini-1.5-pro
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that generates JSON."},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"}
    }

    # Mock response if no API key is present
    if not LLM_API_KEY:
        print("WARNING: No LLM_API_KEY found. using mock response.")
        pairs = []
        ids = [p['id'] for p in players]
        import random
        random.shuffle(ids)
        
        bye = None
        if len(ids) % 2 != 0:
            bye = ids.pop()
        
        for i in range(0, len(ids), 2):
            pairs.append({"player1": ids[i], "player2": ids[i+1]})
            
        return {"pairs": pairs, "bye": bye}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(LLM_API_URL, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            content = data['choices'][0]['message']['content']
            return json.loads(content)
        except Exception as e:
            print(f"Error calling LLM: {e}")
            # Fallback to random pairing on error
            pairs = []
            ids = [p['id'] for p in players]
            bye = None
            if len(ids) % 2 != 0:
                bye = ids.pop()
            for i in range(0, len(ids), 2):
                pairs.append({"player1": ids[i], "player2": ids[i+1]})
            return {"pairs": pairs, "bye": bye}
