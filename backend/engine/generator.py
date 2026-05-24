from engine.abm import ABMEngine, AgentConfig
from engine.events import EventGenerator
from engine.sharia import ShariaEngine
from models.schemas import GameData, AssetData
from models.asset_params import ASSET_CONFIGS

def generate_game_data(seed: int = 42, quarters: int = 4, days_per_quarter: int = 63) -> GameData:
    total_days = quarters * days_per_quarter
    quarter_boundaries = [d * days_per_quarter for d in range(0, quarters + 1)]

    assets = []
    for i, cfg in enumerate(ASSET_CONFIGS):
        params = AgentConfig(
            noise_traders=cfg.noise_traders,
            trend_followers=cfg.trend_followers,
            value_investors=cfg.value_investors,
            market_makers=cfg.market_makers,
            volatility=cfg.volatility,
            drift=cfg.drift,
            base_price=cfg.base_price,
            seed=seed + i
        )
        engine = ABMEngine(params)
        prices = engine.run(total_days)

        sharia = ShariaEngine(
            base_ratio=1.0 - cfg.impurity_ratio,
            seed=seed + i + 100,
            quarters=quarters
        )

        asset = AssetData(
            id=cfg.id,
            name=cfg.name,
            type=cfg.type,
            impurityRatio=cfg.impurity_ratio,
            prices=prices,
            complianceScores=sharia.get_all_scores()
        )
        assets.append(asset)

    event_gen = EventGenerator(seed=seed, quarters=quarters)
    events = event_gen.generate()

    return GameData(
        seed=seed,
        quarters=quarters,
        daysPerQuarter=days_per_quarter,
        assets=assets,
        quarterBoundaries=quarter_boundaries,
        events=[e.model_dump() for e in events]
    )
