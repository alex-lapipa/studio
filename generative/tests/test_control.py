import asyncio

import pytest

from studio_generative.control import apply_config_value, parse_bool
from studio_generative.model import MusicConfig


class FakeProvider:
    def __init__(self) -> None:
        self.calls: list[tuple[str, object | None]] = []

    async def set_config(self, config: MusicConfig) -> None:
        self.calls.append(("config", config))

    async def reset_context(self) -> None:
        self.calls.append(("reset", None))


def test_parse_bool_is_strict() -> None:
    assert parse_bool("yes") is True
    assert parse_bool("OFF") is False
    with pytest.raises(ValueError, match="boolean"):
        parse_bool("maybe")


def test_bpm_update_sends_full_config_then_resets() -> None:
    provider = FakeProvider()
    initial = MusicConfig(density=0.25, brightness=0.75)
    updated = asyncio.run(apply_config_value(provider, initial, "bpm", "128"))
    assert updated.bpm == 128
    assert updated.density == 0.25
    assert [name for name, _ in provider.calls] == ["config", "reset"]


def test_density_update_does_not_reset_context() -> None:
    provider = FakeProvider()
    asyncio.run(apply_config_value(provider, MusicConfig(), "density", "0.5"))
    assert [name for name, _ in provider.calls] == ["config"]


def test_serialized_updates_start_from_latest_provider_config() -> None:
    from studio_generative.cli import _set_config_serialized

    class StatefulFakeProvider(FakeProvider):
        def __init__(self) -> None:
            super().__init__()
            self.config = MusicConfig()

        async def set_config(self, config: MusicConfig) -> None:
            await super().set_config(config)
            self.config = config

    async def scenario() -> None:
        provider = StatefulFakeProvider()
        lock = asyncio.Lock()
        first = await _set_config_serialized(provider, lock, "brightness", "0.75")
        second = await _set_config_serialized(provider, lock, "density", "0.25")
        assert first.brightness == 0.75
        assert second.brightness == 0.75
        assert second.density == 0.25
        assert provider.config == second

    asyncio.run(scenario())
