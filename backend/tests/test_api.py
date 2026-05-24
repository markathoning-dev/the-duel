from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

client = TestClient(app)

def test_generate_game_returns_valid_json():
    response = client.get("/generate-game?seed=42")
    assert response.status_code == 200
    data = response.json()
    assert data["seed"] == 42
    assert data["quarters"] == 4
    assert data["daysPerQuarter"] == 63
    assert len(data["assets"]) == 6
    assert len(data["quarterBoundaries"]) == 5
    for asset in data["assets"]:
        assert len(asset["prices"]) == 252
        assert all(isinstance(p, float) for p in asset["prices"])

def test_generate_game_is_deterministic():
    r1 = client.get("/generate-game?seed=42")
    r2 = client.get("/generate-game?seed=42")
    assert r1.json() == r2.json()

def test_different_seed_different_data():
    r1 = client.get("/generate-game?seed=42")
    r2 = client.get("/generate-game?seed=99")
    assert r1.json() != r2.json()
