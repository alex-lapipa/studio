# MRCC Connectivity v2 — Read-only receive monitor

Status: **Partially observed** on 2026-08-30. The Mac can enumerate and connect a read-only CoreMIDI input monitor to an explicitly selected MRCC source. No incoming MIDI event has yet been observed in this phase.

## What this phase adds

`tools/macos/mrcc_receive_monitor.swift` is a receive-only monitor for the Mac-facing Conductive Labs MRCC CoreMIDI sources.

- Selects one source explicitly with `--port 1...12` or `--unique-id INT32`.
- `--list` reports the currently visible MRCC sources and host-specific CoreMIDI unique IDs.
- Emits newline-delimited JSON with ISO-8601 observation timestamps.
- Classifies MIDI 1.0 channel-voice and system messages delivered through CoreMIDI's MIDI 1.0 UMP protocol.
- Does not create a MIDI output port or destination and contains no MIDI send call.
- Does not expose SysEx payload bytes. Unsupported UMP message types are reported only by message type and word count.

## Reproducible checks

```bash
xcrun swiftc -typecheck tools/macos/mrcc_receive_monitor.swift
xcrun swift tools/macos/mrcc_receive_monitor.swift --list
xcrun swift tools/macos/mrcc_receive_monitor.swift --port 1 --duration 10
```

The first live smoke run connected to MRCC `Port 1` for two seconds and exited cleanly with `received_event_count: 0`. That proves the monitor can attach to the selected CoreMIDI source; it does **not** prove an active physical input route.

## Evidence state

- MRCC sources 1–12 visible to CoreMIDI: **Observed**
- Monitor type-checks on the studio Mac: **Observed**
- Read-only monitor attaches to selected MRCC Port 1 and exits cleanly: **Observed**
- Incoming MIDI event on any MRCC source: **Unknown / not yet observed**
- Physical controller → MRCC source mapping: **Unknown**
- MRCC internal routing/preset: **Unknown**
- Downstream physical routing: **Unknown**
- End-to-end MIDI transmission: **Unknown and intentionally not tested in this phase**

## Safety boundary

This phase remains receive-only. Do not add `MIDISend`, `MIDISendEventList`, virtual destinations, MIDI clock output, SysEx transmission, program changes, CC, or note output. A later transmit test requires an independently identified downstream route and a deliberately bounded test plan.

## Next observation needed

Run the monitor against the MRCC source port that receives a known physical controller, then perform a deliberate controller action while the monitor is active. Record only what is actually observed; do not infer the physical device identity from message content alone.
