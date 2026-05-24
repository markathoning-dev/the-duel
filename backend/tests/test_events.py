import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine.events import EventGenerator

def test_event_generator_returns_1_to_3_events():
    gen = EventGenerator(seed=42, quarters=4)
    events = gen.generate()
    assert 1 <= len(events) <= 3

def test_events_have_required_fields():
    gen = EventGenerator(seed=42, quarters=4)
    for e in gen.generate():
        assert e.quarter in range(4)
        assert e.type in ("rate_decision", "sector_shock", "regulatory_change")
        assert isinstance(e.description, str)
        assert len(e.description) > 0

def test_event_generator_is_deterministic():
    e1 = EventGenerator(seed=42, quarters=4).generate()
    e2 = EventGenerator(seed=42, quarters=4).generate()
    assert e1 == e2
