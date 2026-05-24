import numpy as np
from dataclasses import dataclass
from typing import List

@dataclass
class MarketState:
    price: float
    prev_return: float
    volume: int

@dataclass
class AgentConfig:
    noise_traders: int
    trend_followers: int
    value_investors: int
    market_makers: int
    volatility: float
    drift: float
    base_price: float = 100.0
    seed: int = 42

class ABMEngine:
    def __init__(self, params: AgentConfig):
        self.params = params
        self.rng = np.random.default_rng(params.seed)
        self.state = MarketState(
            price=params.base_price,
            prev_return=0.0,
            volume=1000
        )
        self.agents = self._create_agents()

    def _create_agents(self):
        total = (self.params.noise_traders + self.params.trend_followers
                 + self.params.value_investors + self.params.market_makers)
        noise = int(self.params.noise_traders / total * 100)
        trend = int(self.params.trend_followers / total * 100)
        value = int(self.params.value_investors / total * 100)
        makers = max(0, 100 - noise - trend - value)
        return {
            'noise': [{'type': 'noise'} for _ in range(noise)],
            'trend': [{'type': 'trend', 'lookback': int(self.rng.integers(5, 20))}
                      for _ in range(trend)],
            'value': [{'type': 'value', 'mean': self.params.base_price,
                       'strength': float(self.rng.uniform(0.1, 0.5))}
                      for _ in range(value)],
            'maker': [{'type': 'maker'} for _ in range(makers)],
        }

    def step(self) -> float:
        order_imbalance = 0.0

        for _ in self.agents['noise']:
            order_imbalance += float(self.rng.normal(0, self.params.volatility * 0.5))

        for a in self.agents['trend']:
            if self.state.prev_return != 0:
                signal = self.state.prev_return * a['lookback']
                order_imbalance += np.clip(signal, -self.params.volatility, self.params.volatility)

        for a in self.agents['value']:
            deviation = (a['mean'] - self.state.price) / a['mean']
            order_imbalance += deviation * a['strength'] * self.params.volatility

        for _ in self.agents['maker']:
            order_imbalance -= self.state.prev_return * 0.1

        raw_return = (self.params.drift / 252
                      + order_imbalance * self.params.volatility)
        log_return = np.clip(raw_return, -0.15, 0.15)
        self.state.price *= np.exp(log_return)
        self.state.price = max(self.state.price, 0.01)
        self.state.prev_return = log_return
        self.state.volume = max(500 + int(order_imbalance * 1000), 1)
        return round(self.state.price, 4)

    def run(self, days: int = 252) -> List[float]:
        prices = []
        for _ in range(days):
            prices.append(self.step())
        return prices
