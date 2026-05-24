import pytest
from engine.abm import ABMEngine, AgentConfig

def test_abm_generates_correct_number_of_prices():
    params = AgentConfig(
        noise_traders=60, trend_followers=20,
        value_investors=15, market_makers=5,
        volatility=0.2, drift=0.0, seed=42
    )
    engine = ABMEngine(params)
    prices = engine.run(days=252)
    assert len(prices) == 252
    assert all(isinstance(p, float) for p in prices)
    assert all(p > 0 for p in prices)

def test_abm_is_deterministic():
    params = AgentConfig(
        noise_traders=60, trend_followers=20,
        value_investors=15, market_makers=5,
        volatility=0.2, drift=0.0, seed=42
    )
    engine1 = ABMEngine(params)
    engine2 = ABMEngine(params)
    assert engine1.run(252) == engine2.run(252)

def test_different_seeds_produce_different_prices():
    params1 = AgentConfig(
        noise_traders=60, trend_followers=20,
        value_investors=15, market_makers=5,
        volatility=0.2, drift=0.0, seed=42
    )
    params2 = AgentConfig(
        noise_traders=60, trend_followers=20,
        value_investors=15, market_makers=5,
        volatility=0.2, drift=0.0, seed=99
    )
    p1 = ABMEngine(params1).run(252)
    p2 = ABMEngine(params2).run(252)
    assert p1 != p2
