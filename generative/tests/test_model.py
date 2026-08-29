import pytest

from studio_generative.model import MusicConfig, WeightedPrompt


def test_prompt_rejects_zero_weight() -> None:
    with pytest.raises(ValueError, match="non-zero"):
        WeightedPrompt("techno", 0)


def test_config_validates_documented_ranges() -> None:
    MusicConfig(bpm=60, guidance=6.0, density=1.0, brightness=0.0, temperature=3.0).validate()
    with pytest.raises(ValueError, match="bpm"):
        MusicConfig(bpm=59).validate()
    with pytest.raises(ValueError, match="density"):
        MusicConfig(density=1.1).validate()


def test_config_update_preserves_other_fields() -> None:
    initial = MusicConfig(bpm=120, density=0.25, brightness=0.75)
    updated = initial.updated(density=0.5)
    assert updated.bpm == 120
    assert updated.brightness == 0.75
    assert updated.density == 0.5
