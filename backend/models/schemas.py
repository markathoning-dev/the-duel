from pydantic import BaseModel
from typing import List

class AssetData(BaseModel):
    id: str
    name: str
    type: str
    impurityRatio: float
    prices: List[float]
    complianceScores: List[float] = []

class Event(BaseModel):
    quarter: int
    type: str
    description: str
    impact_sector: str = ""
    impact_magnitude: float = 0.0

class GameData(BaseModel):
    seed: int
    quarters: int
    daysPerQuarter: int
    assets: List[AssetData]
    quarterBoundaries: List[int]
    events: List[dict] = []
