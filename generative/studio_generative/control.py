from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from .model import MusicConfig

RESET_FIELDS = frozenset({"bpm", "scale"})


def parse_bool(value: str) -> bool:
    normalized = value.strip().lower()
    if normalized in {"1", "true", "on", "yes"}:
        return True
    if normalized in {"0", "false", "off", "no"}:
        return False
    raise ValueError(f"expected boolean value, got {value!r}")


CONFIG_PARSERS: dict[str, Callable[[str], Any]] = {
    "guidance": float,
    "bpm": int,
    "density": float,
    "brightness": float,
    "temperature": float,
    "top_k": int,
    "seed": int,
    "scale": str,
    "music_generation_mode": str,
    "mute_bass": parse_bool,
    "mute_drums": parse_bool,
    "only_bass_and_drums": parse_bool,
}


async def apply_config_value(provider: Any, config: MusicConfig, name: str, raw: str) -> MusicConfig:
    parser = CONFIG_PARSERS.get(name)
    if parser is None:
        raise ValueError(f"Unsupported config field: {name}")
    updated = config.updated(**{name: parser(raw)})
    updated.validate()
    await provider.set_config(updated)
    if name in RESET_FIELDS:
        await provider.reset_context()
    return updated
