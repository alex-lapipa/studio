# Studio KB handoff — 2026-08-27

## Known-good checkpoint

- Public GitHub repo: `alex-lapipa/studio`
- Active branch: `chatgpt/gold-standard-kb-20260827`
- Latest studio-facing implementation commit before handoff: `69f64fe`
- Draft PR: #1, open and mergeable against `main`
- Vercel project: `studio`, root `web`
- Supabase project: `klbzvbwudekstddlgnjy`

## Verified frontend

Current views: Studio Overview, Rig, Mac & Software, Studio Brain, MIDI Console, Knowledge, System.
Studio Overview is the default and does not infer missing physical routes.
Studio Brain searches structured state plus hybrid RAG evidence and shows provenance.
MIDI planned-channel tests come from structured gear state and remain labelled as plans.

## Verified structured state

- Gear: 21
- Documents: 25
- Chunks: 836
- Computers: 1
- Software: 3
- Plugins: 102
- Endpoints: 3
- Connections: 0
- Observations: 7
## Verified quality

- Chunker unit tests: 5/5 PASS
- Python compile checks: PASS
- Frontend TypeScript: PASS
- Next.js 16.3.3 production build: PASS
- GitHub Actions latest push + PR runs: PASS
- Null embeddings: 0
- Null FTS: 0
- Legacy chunks over 1900 chars: 73
- Retrieval benchmark baseline: 13/15 expected-source recall@8

## Mac / studio observations

Mac mini M4 Pro, 64 GB, macOS 26.2.
Logic Pro 12.3.1, Bitwig Studio 6.0.11, SuperCollider 3.13.0.
102 observed plugin bundles: 37 AU, 36 VST3, 29 VST2.
M-AUDIO Uber Mic observed at 48 kHz as default input; Scarlett 2i2 at 44.1 kHz as default output.
MRCC present on USB/MIDIServer. Downstream physical MIDI/audio/CV topology remains unknown until directly observed.
## Supabase migration note

Source-of-Truth v2 tables are live and verified. Migration `20260827003000_studio_source_of_truth_v2.sql` was applied directly by SQL because existing remote migration timestamps do not match repo filenames. `supabase migration list` still shows only the three older remote versions. Do not repair or rewrite migration history casually; reconcile deliberately later.

## Next highest-value work

1. Observe and record the real physical MIDI/audio/CV topology into `endpoints` + `connections`.
2. Add concise synthesis/coverage checking above Studio Brain's structured + RAG evidence bundle.
3. Transfer and ingest remaining manufacturer manuals when source bytes are accessible.
4. Re-ingest the 73 legacy oversized chunks with bounded v2 chunking and benchmark before/after.
5. Grow practical retrieval tests around routing, sync, CV, audio, DAW integration and troubleshooting.

## Lyria RealTime update — 2026-08-30

- **Observed:** `GEMINI_API_KEY` was present in the user's interactive Terminal shell.
- **Observed:** `google-genai` 2.20.0 using `models/lyria-realtime-exp` with API version `v1beta` reached the Live Music WebSocket path but the handshake returned HTTP 404.
- **Observed:** a direct official-SDK connectivity test using API version `v1alpha` printed `LYRIA_CONNECTED`.
- **Configured:** the local `generative/` Lyria provider now selects `v1alpha`; this is based on observed connectivity, while preserving Google's current `v1beta` vs `v1alpha` documentation inconsistency.
- **Observed:** after the `v1alpha` change, 10/10 local tests passed; `uv lock --check`, CLI help, and Core Audio device enumeration also passed. The remote control process did not inherit the interactive Terminal API key, so end-to-end streamed PCM playback remains unobserved from this channel.
- **Planned:** from the authenticated interactive Terminal shell, run the full CLI against explicit Scarlett 2i2 output to verify streamed PCM, transport, buffering and clean shutdown.
- **Unknown:** downstream MRCC routes remain unobserved; no MIDI route is to be inferred from USB visibility alone.

## PR #1 readiness review — 2026-08-30

- **Observed:** PR #1 remained open, draft, mergeable, with no submitted reviews or unresolved review threads; GitHub Actions `studio-ci` run #12 passed and the Vercel preview reported Ready.
- **Observed:** a clean local verification passed Python chunker tests (5/5), Python compile checks, Lyria tests (10/10), `uv lock --check`, frontend typecheck, and production build.
- **Observed:** `npm audit` on Next.js 15.5.21 reported 3 high-severity transitive vulnerabilities.
- **Configured:** frontend upgraded to Next.js 16.3.3, which brought patched PostCSS 8.5.23 and Sharp 0.35.4; local `npm audit --audit-level=high` then reported 0 vulnerabilities.
- **Configured:** CI now runs `npm audit --audit-level=high` after `npm ci` so high-severity dependency regressions block future merges.
- **Observed:** Next.js 16.3.3 typecheck and production build pass on the studio Mac after the upgrade.
