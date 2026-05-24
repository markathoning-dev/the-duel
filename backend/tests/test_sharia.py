import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine.sharia import ShariaEngine

def test_compliance_starts_at_base_ratio():
    engine = ShariaEngine(base_ratio=0.95, seed=42, quarters=4)
    scores = engine.get_all_scores()
    assert scores[0] == 0.95

def test_compliance_fluctuates_over_time():
    engine = ShariaEngine(base_ratio=0.95, seed=42, quarters=4)
    scores = engine.get_all_scores()
    assert len(set(scores)) > 1

def test_sharia_is_deterministic():
    e1 = ShariaEngine(base_ratio=0.95, seed=42, quarters=4)
    e2 = ShariaEngine(base_ratio=0.95, seed=42, quarters=4)
    assert e1.get_all_scores() == e2.get_all_scores()
