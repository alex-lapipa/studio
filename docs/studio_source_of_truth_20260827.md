# Studio Source of Truth — 2026-08-27

This is the dated operational baseline for the internal Alex + Antaine studio KB. Manufacturer documentation and live observations outrank older research notes when they conflict.

## Technical centre

- Conductive Labs MRCC is the studio MIDI hub.
- Authoritative FW v1.1.020 specification: **11 inputs × 17 outputs physical routable; 39 inputs × 34 outputs total** including USB virtual cables.
- Four USB host ports support class-compliant USB MIDI devices; the USB device/PC connection exposes virtual MIDI cables.
- MRCC power: USB-PD supply, minimum 5 V / 3 A; manual specifies included supply at 5.2 V / 3 A. Do not substitute an under-rated supply.
- MRCC CV clock output supports +5 V or +12 V settings. Verify destination voltage requirements before connecting CV/clock.

## Evidence policy

1. Live observed state is authoritative for what is physically connected/configured now.
2. Manufacturer manuals are authoritative for capabilities, electrical limits and supported workflows.
3. Saved configuration is authoritative only for the dated state it represents.
4. Research/community sources are supporting evidence, not a substitute for manufacturer safety/electrical documentation.
5. Conflicts are preserved as observations and resolved by provenance/date; do not silently overwrite history.

## Current corpus work

High-priority manuals reconciled on 2026-08-27 include Soundcraft Signature 10/12, TD-3-MO QSG, Logic Pro, Eventide Space, EHX 720, ADAM T Series/T10S, Polyend Seq and NI Controller Editor. Harmony-G XT is available only as a third-party/watermarked copy and should be replaced by a manufacturer original before treating it as preferred evidence.

## Minimum structured state

The additive v2 schema models computers, software, plugins, endpoints, connections, observations and document/entity links. Populate only observed or documented facts; unknown cabling/routing remains unknown rather than inferred.

## Update workflow

1. Put copyrighted manuals in private Supabase Storage, never git.
2. Register a `documents` row with checksum/provenance before ingestion.
3. Extract and chunk with the bounded v2 chunker; ingest resumably through the supported KB edge path.
4. Run retrieval regression/benchmark queries and inspect provenance/page references.
5. Record live changes as dated observations; update this baseline only when a new verified state supersedes it.
6. Commit code/docs/migrations on a branch and merge through review; keep database changes additive/reversible.
