# MRCC Connectivity v1 — Mac Inventory

Status: **Observed** on 2026-08-30. This phase is intentionally read-only: it enumerates the Mac-facing MRCC CoreMIDI endpoints and sends no MIDI data.

## Observed hardware identity

- USB product: `MRCC`
- Manufacturer: `Conductive Labs`
- USB serial: `000021`
- USB vendor/product IDs: `5824` / `1168`
- Host: `Alexs-Mac-mini.local`

The USB identity proves physical USB presence only. It does not prove downstream DIN/TRS/USB-host routing.

## Observed CoreMIDI inventory

A direct CoreMIDI enumeration on the Mac returned **12 MRCC sources and 12 MRCC destinations**, named `Port 1` through `Port 12`. Each endpoint reported manufacturer `Conductive Labs` and model `MRCC`.

This matches the MRCC manual's documented PC/device-port virtual-cable model, but the live enumeration—not the manual—is the evidence for current Mac-visible endpoint presence.

## Reproducible probe

Run from macOS with Xcode Command Line Tools installed:

```bash
xcrun swift tools/macos/mrcc_inventory.swift
```

The probe emits JSON with a timestamp, MRCC source/destination counts, endpoint names, and CoreMIDI unique IDs. It is read-only and must remain read-only.

## Safety gate before MIDI transmission

Do not send clock, SysEx, program changes, CC, or notes until a downstream route is independently identified. Next phase should monitor receive activity first, then establish one deliberately chosen destination and verify a minimal signal end-to-end.

## Evidence model

- Physical USB presence: **Observed**
- Mac-visible MRCC sources 1–12: **Observed**
- Mac-visible MRCC destinations 1–12: **Observed**
- Saved MRCC routing/preset intent: **Unknown** until inspected independently
- Downstream physical routing: **Unknown**
- End-to-end MIDI signal flow: **Unknown**
