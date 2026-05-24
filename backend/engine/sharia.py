import numpy as np
from typing import List

CORPORATE_ACTIONS = ["debt_issuance", "interest_income", "business_mix", "none"]

class ShariaEngine:
    def __init__(self, base_ratio: float, seed: int, quarters: int = 4):
        self.base_ratio = base_ratio
        self.rng = np.random.default_rng(seed + 1000)
        self.quarters = quarters

    def get_score(self, quarter: int) -> float:
        if quarter == 0:
            return self.base_ratio
        score = self.base_ratio
        for q in range(1, quarter + 1):
            action = str(self.rng.choice(CORPORATE_ACTIONS))
            if action == "debt_issuance":
                score -= float(self.rng.uniform(0.01, 0.08))
            elif action == "interest_income":
                score -= float(self.rng.uniform(0.02, 0.12))
            elif action == "business_mix":
                score += float(self.rng.uniform(0.01, 0.05))
            score = float(np.clip(score, 0.3, 1.0))
        return round(score, 4)

    def get_all_scores(self) -> List[float]:
        return [self.get_score(q) for q in range(self.quarters)]
