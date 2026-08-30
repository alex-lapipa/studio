from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from dataclasses import dataclass
import json
from pathlib import Path


@dataclass(frozen=True, slots=True)
class MidiCCEvent:
    cc: int
    value: int


def parse_event(line: str) -> MidiCCEvent | None:
    try:
        payload = json.loads(line)
    except json.JSONDecodeError:
        return None
    if payload.get("type") != "cc":
        return None
    cc, value = payload.get("cc"), payload.get("value")
    if not isinstance(cc, int) or not isinstance(value, int):
        return None
    if not 0 <= cc <= 127 or not 0 <= value <= 127:
        return None
    return MidiCCEvent(cc=cc, value=value)


def helper_path() -> Path:
    return Path(__file__).resolve().parents[2] / "tools" / "macos" / "coremidi_receive.swift"
async def receive_cc(source_uid: int, channel: int) -> AsyncIterator[MidiCCEvent]:
    if not 1 <= channel <= 16:
        raise ValueError("MIDI channel must be 1..16")
    process = await asyncio.create_subprocess_exec(
        "xcrun", "swift", str(helper_path()),
        "--source-uid", str(source_uid), "--channel", str(channel),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    assert process.stdout is not None
    try:
        while True:
            line = await process.stdout.readline()
            if not line:
                code = await process.wait()
                stderr = b""
                if process.stderr is not None:
                    stderr = await process.stderr.read()
                detail = stderr.decode(errors="replace").strip()
                raise RuntimeError(f"CoreMIDI receiver exited {code}: {detail}")
            event = parse_event(line.decode(errors="replace"))
            if event is not None:
                yield event
    finally:
        if process.returncode is None:
            process.terminate()
            try:
                await asyncio.wait_for(process.wait(), timeout=2.0)
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
