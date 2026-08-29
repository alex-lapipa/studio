from __future__ import annotations

from dataclasses import dataclass, replace
from enum import Enum
from typing import Callable, Protocol

PCM_SAMPLE_RATE = 48_000
PCM_CHANNELS = 2
PCM_SAMPLE_WIDTH_BYTES = 2


class Transport(str, Enum):
    STOPPED = "stopped"
    PLAYING = "playing"
    PAUSED = "paused"


@dataclass(frozen=True, slots=True)
class WeightedPrompt:
    text: str
    weight: float = 1.0

    def __post_init__(self) -> None:
        if not self.text.strip():
            raise ValueError("prompt text must not be empty")
        if self.weight == 0:
            raise ValueError("Lyria prompt weight must be non-zero")


@dataclass(frozen=True, slots=True)
class MusicConfig:
    guidance: float | None = 4.0
    bpm: int | None = None
    density: float | None = None
    brightness: float | None = None
    scale: str | None = None
    temperature: float | None = 1.1
    top_k: int | None = 40
    seed: int | None = None
    mute_bass: bool = False
    mute_drums: bool = False
    only_bass_and_drums: bool = False
    music_generation_mode: str = "QUALITY"

    def updated(self, **changes: object) -> "MusicConfig":
        return replace(self, **changes)

    def validate(self) -> None:
        checks = (
            (self.guidance, 0.0, 6.0, "guidance"),
            (self.density, 0.0, 1.0, "density"),
            (self.brightness, 0.0, 1.0, "brightness"),
            (self.temperature, 0.0, 3.0, "temperature"),
        )
        for value, low, high, name in checks:
            if value is not None and not low <= value <= high:
                raise ValueError(f"{name} must be {low}..{high}")
        if self.bpm is not None and not 60 <= self.bpm <= 200:
            raise ValueError("bpm must be 60..200")
        if self.top_k is not None and not 1 <= self.top_k <= 1000:
            raise ValueError("top_k must be 1..1000")
        if self.seed is not None and not 0 <= self.seed <= 2_147_483_647:
            raise ValueError("seed must be 0..2147483647")

AudioCallback = Callable[[bytes], None]
StatusCallback = Callable[[str], None]


class GenerativeProvider(Protocol):
    async def connect(self, on_audio: AudioCallback, on_status: StatusCallback) -> None: ...
    async def close(self) -> None: ...
    async def play(self) -> None: ...
    async def pause(self) -> None: ...
    async def stop(self) -> None: ...
    async def reset_context(self) -> None: ...
    async def set_prompts(self, prompts: list[WeightedPrompt]) -> None: ...
    async def set_config(self, config: MusicConfig) -> None: ...
