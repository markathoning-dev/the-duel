import numpy as np
from typing import List
from models.schemas import Event

EVENT_TEMPLATES = [
    {
        "type": "rate_decision",
        "magnitude_range": (-2.0, 2.0)
    },
    {
        "type": "sector_shock",
        "magnitude_range": (-5.0, 5.0)
    },
    {
        "type": "regulatory_change",
        "magnitude_range": (0.01, 0.15)
    },
]

SECTORS = ["technology", "healthcare", "real_estate", "commodity", "government", "corporate"]
CAUSES = ["regulatory news", "earnings surprise", "geopolitical events", "commodity price shift"]

class EventGenerator:
    def __init__(self, seed: int, quarters: int):
        self.rng = np.random.default_rng(seed + 999)
        self.quarters = quarters

    def generate(self) -> List[Event]:
        num_events = int(self.rng.integers(1, 4))
        chosen = self.rng.choice(len(EVENT_TEMPLATES), size=num_events, replace=False)
        events = []
        for idx in chosen:
            template = EVENT_TEMPLATES[idx]
            quarter = int(self.rng.integers(0, self.quarters))
            magnitude = round(float(self.rng.uniform(*template["magnitude_range"])), 2)
            direction = "rise" if magnitude >= 0 else "fall"

            if template["type"] == "rate_decision":
                desc = f"Central bank announces {self.rng.choice(['an unexpected', 'a moderate', 'a significant'])} rate change of {abs(magnitude)}%"
                sector = "all"
            elif template["type"] == "sector_shock":
                sector = str(self.rng.choice(SECTORS))
                cause = str(self.rng.choice(CAUSES))
                desc = f"{sector.capitalize()} sector {direction}s {abs(magnitude)}% on {cause}"
            elif template["type"] == "regulatory_change":
                sector = "all"
                desc = f"Sharia compliance threshold adjusted by {abs(magnitude)*100:.0f}%"
            else:
                sector = "all"
                desc = "Unknown event"

            events.append(Event(
                quarter=quarter,
                type=template["type"],
                description=desc,
                impact_sector=sector,
                impact_magnitude=magnitude
            ))
        return events
