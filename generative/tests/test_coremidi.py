from pathlib import Path

import pytest

from studio_generative.midi.coremidi import MidiCCEvent, helper_path, parse_event


def test_parse_cc_event() -> None:
    assert parse_event('{"type":"cc","cc":74,"value":127}') == MidiCCEvent(74, 127)


def test_parse_event_ignores_invalid_or_other_messages() -> None:
    assert parse_event("not-json") is None
    assert parse_event('{"type":"note","cc":74,"value":1}') is None
    assert parse_event('{"type":"cc","cc":128,"value":1}') is None
    assert parse_event('{"type":"cc","cc":74,"value":-1}') is None


def test_helper_is_receive_only() -> None:
    source = helper_path().read_text()
    assert "MIDIInputPortCreateWithProtocol" in source
    assert "MIDIPortConnectSource" in source
    forbidden = ("MIDIOutputPortCreate", "MIDISend", "MIDIReceived", "MIDISourceCreate")
    assert all(token not in source for token in forbidden)


def test_helper_path_exists() -> None:
    assert isinstance(helper_path(), Path)
    assert helper_path().exists()
