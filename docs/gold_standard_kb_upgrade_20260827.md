# Gold-Standard Studio KB Upgrade — 2026-08-27

Status: design/audit baseline; no production schema change in this commit.

## Collaboration contract

This repository and the Supabase project are shared state for work performed through ChatGPT, Claude, and the studio web application. Every agent should inspect current state before mutation, preserve additive history, use dated migrations/docs, and leave enough provenance for another agent to understand what changed and why.

## Live reconciliation

Verified against Supabase on 2026-08-27:

- `gear`: 21 rows
- `documents`: 24 rows
- `chunks`: 834 rows
- null embeddings: 0
- null FTS: 0
- original chunks over 4,000 characters: 6

These figures supersede the 2026-07-25 audit counts of 18 / 21 / 677.

## RAG findings

Production `kb` Edge Function is version 4 and uses Supabase.ai `gte-small` embeddings. `ingest_chunks` embeds only `content.slice(0, 4000)`. Version 4 adds an additive `fix_overflow` action for historic oversized chunks.

The local chunker targets 1,400 chars, MAXC 1,900 and overlap 180, but a single paragraph longer than MAXC can still pass through unsplit. The six current oversized originals include Analog Lab V, MiniLab 3, Electribe, Theremini and MRCC material.

### Required hardening

1. Hard-split any semantic unit/paragraph that exceeds the configured maximum.
2. Validate every generated chunk before ingestion; fail closed if the maximum is exceeded.
3. Keep historic overflow repair additive and idempotent.
4. Add regression queries before changing embedding models.
5. Do not migrate away from `gte-small` without benchmark evidence.

## Source-of-Truth model v2 direction

Keep `gear` backward-compatible for the existing UI and search filters while introducing normalized structured state additively:

- `computers` — studio computers and stable hardware/OS identity
- `software` — installed applications and versions
- `plugins` — plugin products/formats/versions
- `endpoints` — observed MIDI/audio/USB endpoints
- `connections` — intended or verified physical/logical routes
- `observations` — timestamped live-state evidence with provenance/confidence
- `document_entities` — future many-to-many linkage from documents to structured entities

Static/manual knowledge belongs in document RAG. Changing operational state belongs primarily in structured tables. Retrieval should eventually combine both.

## Evidence model

Recommended evidence precedence:

1. live observation
2. manufacturer/manual documentation
3. saved configuration/history
4. explicitly labelled inference

A device being documented is not proof that it is currently connected. A saved MIDI configuration is not proof that the endpoint is live.

## Current studio facts to ingest/reconcile

- Core Mac: Apple M4 Pro, 64 GiB, macOS 26.2 build 25C56, host `Alexs-Mac-mini.local`.
- MRCC is the designated MIDI centre; live serial observed as `010821` and active in Core MIDI.
- Scarlett 2i2 observed as default system/output at 44.1 kHz.
- M-AUDIO Uber Mic observed as default input at 48 kHz; sample-rate split is an explicit finding, not yet a remediation decision.
- Current Mac application inventory includes Logic Pro 12.3.1, Bitwig Studio 6.0.11, SuperCollider 3.13.0 and the broader audited music/video/creative toolset.
- Plugin audit: 37 AU, 36 VST3, 29 VST2 at observation time.

The complete dated Studio Source of Truth should be committed as original studio research and ingested as its own provenance-bearing document.

## Manual reconciliation

Already represented in Supabase include MRCC, DFAM, Mother-32, Subharmonicon, Electribe, Tanzbär, Xone:92, Unitor8/AMT8, MB33, Subsequent 37, Theremini, Nektar Impact LX88+, Orchid, MiniLab 3 and Analog Lab V, plus several research/patch documents.

Candidate missing corpus items from the expanded attached-manual set include Soundcraft Signature 10/12, Eventide Space, TC Helicon Harmony-G XT, EHX 720, ADAM T-Series/T10S, Polyend Seq, current Logic documentation, NI Controller Editor and the TD-3-MO manufacturer QSG. Reconcile checksums/identity before any upload. Copyrighted manuals remain in private Supabase Storage, not Git.

## Retrieval quality gate

Create 50–100 canonical questions covering manual facts, cross-device integration, MIDI routing, live Mac state, software inventory and source conflicts. Record expected source/entity and key facts. Measure retrieval recall, source correctness, latency and failure modes before/after RAG changes.

## Safe execution order

1. Snapshot and reconcile live state.
2. Harden chunking and add tests.
3. Verify historic overflow coverage.
4. Add retrieval regression fixtures.
5. Design/review additive schema migration.
6. Commit the full dated Studio Source of Truth.
7. Reconcile/upload only missing manuals to private Storage.
8. Ingest through the supported embedding path.
9. Verify zero null vectors/FTS, duplicate checksums, RLS and retrieval quality.
10. Apply production schema/data changes only after branch/PR review and repo/database parity checks.

## Rollback principle

Schema evolution should be additive. Existing `gear`, `documents`, `chunks` and `search_knowledge()` consumers must remain functional during migration. No destructive normalization is required for the first v2 phase.