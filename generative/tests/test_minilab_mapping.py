import pytest

from studio_generative.mappings.minilab import map_cc


def test_cc74_maps_to_brightness_range() -> None:
    assert map_cc(74, 0) == ("brightness", 0.0)
    assert map_cc(74, 127) == ("brightness", 1.0)
    name, value = map_cc(74, 64)
    assert name == "brightness"
    assert value == pytest.approx(64 / 127)


def test_observed_conservative_ccs_map_to_documented_ranges() -> None:
    assert map_cc(71, 127) == ("density", 1.0)
    assert map_cc(76, 127) == ("guidance", 6.0)
    assert map_cc(93, 127) == ("temperature", 3.0)


def test_unproven_cc_is_ignored() -> None:
    assert map_cc(77, 64) is None


def test_invalid_cc_value_is_rejected() -> None:
    with pytest.raises(ValueError, match="0..127"):
        map_cc(74, 128)
