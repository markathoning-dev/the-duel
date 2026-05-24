from dataclasses import dataclass

@dataclass
class AssetParams:
    id: str
    name: str
    type: str
    impurity_ratio: float
    volatility: float
    drift: float
    sector: str
    base_price: float = 100.0
    noise_traders: int = 60
    trend_followers: int = 20
    value_investors: int = 15
    market_makers: int = 5

ASSET_CONFIGS = [
    AssetParams("sukuk-01", "Saudi Sukuk Fund", "sukuk", 0.0, 0.08, 0.04, "government", 100.0),
    AssetParams("equity-01", "Islamic Equity Fund", "equity", 0.05, 0.20, 0.08, "technology", 100.0),
    AssetParams("commodity-01", "Halal Commodities Fund", "commodity", 0.02, 0.15, 0.05, "commodity", 100.0),
    AssetParams("realestate-01", "Sharia Real Estate Fund", "realestate", 0.01, 0.10, 0.05, "real_estate", 100.0),
    AssetParams("tech-01", "Islamic Tech Index", "equity", 0.08, 0.25, 0.10, "technology", 100.0),
    AssetParams("green-sukuk-01", "Green Sukuk Bond", "sukuk", 0.0, 0.06, 0.03, "government", 100.0),
]
