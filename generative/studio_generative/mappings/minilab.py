from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class MidiConfigMapping:
    cc: int
    field: str
    low: float
    high: float

    def map_value(self, midi_value: int) -> float:
        if not 0 <= midi_value <= 127:
            raise ValueError("MIDI CC value must be 0..127")
        return self.low + (self.high - self.low) * (midi_value / 127.0)


# Observed on the synchronized 2026-08-30 MiniLab capture.
# Keep this deliberately small until each control is independently identified.
SAFE_MINILAB_MAPPINGS = {
    74: MidiConfigMapping(cc=74, field="brightness", low=0.0, high=1.0),
    71: MidiConfigMapping(cc=71, field="density", low=0.0, high=1.0),
    76: MidiConfigMapping(cc=76, field="guidance", low=0.0, high=6.0),
    93: MidiConfigMapping(cc=93, field="temperature", low=0.0, high=3.0),
}


def map_cc(cc: int, value: int) -> tuple[str, float] | None:
    mapping = SAFE_MINILAB_MAPPINGS.get(cc)
    if mapping is None:
        return None
    return mapping.field, mapping.map_value(value)
