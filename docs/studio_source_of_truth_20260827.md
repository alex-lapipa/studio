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


## Verified live Mac state — 2026-08-27

- Core computer: Mac mini Mac16,11, Apple M4 Pro, 64 GB, macOS 26.2 (25C56).
- Logic Pro 12.3.1 and Bitwig Studio 6.0.11 were observed from installed application bundles.
- Installed plugin bundle counts: 37 AU components, 36 VST3 bundles, 29 VST2 bundles. Counts do not imply successful validation.
- Default audio input observed: M-AUDIO Uber Mic at 48 kHz. Default/system output: Scarlett 2i2 USB at 44.1 kHz. This rate split should be reconciled before a critical recording session; no automatic change was made.
- MRCC is physically present on USB and owned by macOS MIDIServer. This proves USB presence, not the downstream physical MIDI routing.
- Physical synth/mixer/CV cabling remains deliberately unknown until directly observed.

## Corpus integrity note

New ingestion must use `pipeline/chunk_v2.py` and remain <=1900 characters per chunk. The 2026-08-27 Source-of-Truth ingestion satisfies this (2 chunks, max 1717). The legacy corpus still contains 73 pre-v2 chunks over 1900 characters across 14 documents; they remain readable and vectorized but should be superseded by bounded re-ingestion when source PDFs are available, not destructively rewritten.

## Retrieval baseline

After Source-of-Truth ingestion, the practical regression suite returned 13/15 expected-source recall@8 (86.7%). Failures were TD-3-MO cutoff and studio-MRCC-role queries. Treat these as targeted retrieval/source-ingestion work, not reasons to loosen evidence requirements.
