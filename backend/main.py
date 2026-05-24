from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from engine.generator import generate_game_data
from models.schemas import GameData

app = FastAPI(title="The Duel — Market Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/generate-game", response_model=GameData)
def generate_game(seed: int = Query(42, ge=0)):
    return generate_game_data(seed=seed)
