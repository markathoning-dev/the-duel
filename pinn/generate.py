"""PINN-based market data generator.

Generates synthetic daily price data for Sharia-compliant assets
using a physics-informed random walk that can be replaced with a
full PINN (Physics-Informed Neural Network) later.

Usage:
    python pinn/generate.py --seed 42 --output src/data/game-seed.json
"""

import argparse
import json
import math
import os
import sys

ASSET_DEFS = [
    {"id": "sukuk-01",       "name": "Saudi Sukuk Fund",         "type": "sukuk",      "impurityRatio": 0.0,  "start": 100, "mu": 0.04, "sigma": 0.05, "meanReversion": 0.01},
    {"id": "equity-01",      "name": "Islamic Equity Fund",      "type": "equity",     "impurityRatio": 0.05, "start": 100, "mu": 0.10, "sigma": 0.18, "meanReversion": 0.0},
    {"id": "commodity-01",   "name": "Halal Commodities Fund",   "type": "commodity",  "impurityRatio": 0.02, "start": 100, "mu": 0.07, "sigma": 0.22, "meanReversion": 0.0},
    {"id": "realestate-01",  "name": "Sharia Real Estate Fund",  "type": "realestate", "impurityRatio": 0.01, "start": 100, "mu": 0.06, "sigma": 0.08, "meanReversion": 0.005},
    {"id": "tech-01",        "name": "Islamic Tech Index",       "type": "equity",     "impurityRatio": 0.08, "start": 100, "mu": 0.15, "sigma": 0.28, "meanReversion": 0.0},
    {"id": "green-sukuk-01", "name": "Green Sukuk Bond",         "type": "sukuk",      "impurityRatio": 0.0,  "start": 100, "mu": 0.03, "sigma": 0.03, "meanReversion": 0.02},
]


class PRNG:
    """Simple pseudorandom number generator (LCG) for reproducibility."""

    def __init__(self, seed):
        self.state = seed

    def next(self):
        self.state = (self.state * 16807) % 2147483647
        return self.state / 2147483647

    def normal(self):
        """Box-Muller transform."""
        u1 = self.next()
        u2 = self.next()
        return math.sqrt(-2 * math.log(u1 + 1e-10)) * math.cos(2 * math.pi * u2)


def generate_prices(asset, days, rng):
    """Generate daily prices using GBM + mean reversion for sukuk-like assets."""
    dt = 1.0 / 252
    daily_mu = asset["mu"] * dt
    daily_sigma = asset["sigma"] * math.sqrt(dt)
    mr = asset["meanReversion"]
    prices = [asset["start"]]

    for i in range(1, days):
        prev = prices[-1]
        drift = daily_mu * prev
        noise = daily_sigma * prev * rng.normal()
        reversion = mr * (asset["start"] - prev) * dt if mr > 0 else 0
        price = prev + drift + noise + reversion
        prices.append(round(max(price, 0.01), 2))

    return prices


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic market data")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--output", type=str, default="src/data/game-seed.json", help="Output JSON path")
    parser.add_argument("--days", type=int, default=252, help="Number of trading days")
    args = parser.parse_args()

    rng = PRNG(args.seed)
    days = args.days
    quarter_size = days // 4

    assets = []
    for ad in ASSET_DEFS:
        prices = generate_prices(ad, days, rng)
        assets.append({
            "id": ad["id"],
            "name": ad["name"],
            "type": ad["type"],
            "impurityRatio": ad["impurityRatio"],
            "prices": prices,
        })

    data = {
        "seed": args.seed,
        "quarterBoundaries": [0, quarter_size, quarter_size * 2, quarter_size * 3, days],
        "assets": assets,
    }

    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), args.output)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Generated {len(assets)} assets over {days} days -> {output_path}")
    print(f"Seed: {args.seed}")


if __name__ == "__main__":
    main()
