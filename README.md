# studio — ALEX & ANTAINE MUSIC STUDIO

Evidence-first knowledge base, hybrid RAG, studio-state graph and read-only production dashboard for a hardware/electronic-music studio. Personal project: experiment, enjoy, make music.

## The studio

**Technical centre:** Conductive Labs MRCC (11×17 physical routable ports; 39×34 total ports; 4× USB host).
**Signature sound:** MFB Tanzbär analog drum computer (Manfred Fricke Berlin, 2013).
**Core sound instruments:** Moog Subsequent 37 · Moog DFAM · Moog Mother-32 · Moog Subharmonicon · MAM MB33 + Behringer TD-3-MO (acid pair).
**Also:** Moog Theremini · Korg Electribe 2/2S · Arturia MiniLab 3 · Allen & Heath Xone:92 LE (mix hub).

## Architecture

```
Supabase project klbzvbwudekstddlgnjy
├── Storage (private buckets)
│   ├── USER MANUALS          ← official PDFs (copyrighted — never committed here)
│   └── PATCHES AND PRESETS   ← patch sheets, sync guides
├── Postgres + pgvector
│   ├── gear                  ← 12 devices, roles, sync/IO profiles
│   ├── documents             ← 18+ sources (manuals, patch sheets, research dossiers)
│   ├── chunks                ← 600+ embedded chunks (gte-small 384-d, HNSW + FTS)
│   └── search_knowledge()    ← hybrid retrieval (semantic + keyword, RRF)
├── Edge Functions
│   ├── kb                    ← search / ingest_chunks / sign  (embeds with Supabase.ai gte-small)
│   └── gh-sync               ← GitHub sync; reads PAT from Vault server-side (token never leaves Supabase)
└── Vault
    ├── github_app_studio_key ← GitHub App private key (primary auth for gh-sync)
    └── github_pat_studio_kb  ← fine-grained PAT (fallback)
```

## GitHub App (registered 2026-07-24)

| Field | Value |
|---|---|
| Owner | @alex-lapipa |
| App ID | 4388277 |
| Client ID | Iv23lifsIPuKgg3AkIIb |
| Purpose | successor to the vault PAT for `gh-sync` — short-lived installation tokens instead of a long-lived PAT |
| Status | **ACTIVE** (2026-07-25) — installation 148845330; `gh-sync` mints short-lived installation tokens; vault PAT retained as automatic fallback |

## Deployment

**Vercel project:** `studio` under the `la-pipa-is-la-pipa` scope. Production domain: `https://www.zetazeta.xyz`. The web dashboard is deployed from `web/`; verify the linked project and production deployment after each release.

## Query the knowledge base

```bash
curl -X POST "$SUPABASE_URL/functions/v1/kb" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"search","query":"sync DFAM to Mother-32","match_count":5}'
```

Returns chunks with document title, gear, page numbers and fused relevance score. Optional `filter_gear` (gear UUID) restricts to one device.

## Repo layout

| Path | What |
|---|---|
| `supabase/migrations/` | Schema: gear/documents/chunks, hybrid search fn, vault accessor |
| `supabase/functions/kb/` | RAG edge function (search, ingest, signed URLs) |
| `supabase/functions/gh-sync/` | Vault-backed GitHub sync edge function |
| `pipeline/` | Ingestion: sign+download PDFs → extract → chunk → embed+upsert |
| `docs/` | Operations guide + research dossiers (integration, Tanzbär, TD-3-MO) |

## Ingestion pipeline (repeatable)

1. Drop a PDF into a Storage bucket.
2. Insert a `documents` row (see `docs/studio_kb_operations_20260724.md`).
3. `pipeline/dl_batch.py "<bucket>" "<file.pdf>"` → `pdftotext -layout` → `pipeline/chunk.py` → `pipeline/ingest.py` (resumable; handles edge-function CPU 546s with backoff).

Auth: set `SUPABASE_ANON_KEY` in the environment (see `.env.example`).

## Principles

- **Additive only** — documents and chunks are superseded, not destroyed.
- **Secrets stay in the Vault** — the GitHub PAT is read server-side by `gh-sync`; it never appears in code, env files, or client context.
- **No copyrighted PDFs in git** — manuals live in private Storage buckets; this repo carries only original code and research.
- **Confidence-flagged research** — dossiers mark every claim [certain]/[reported]/[community-sourced]; unverifiable facts are listed as unverified, never guessed.
- **Evidence is the rulebook** — RAG evidence, structured observations and graph edges remain distinct. The production web surface is read-only with respect to studio hardware; hardware control belongs in explicit local workflows after routes are observed.

## Companion repos (forks under alex-lapipa)

- **[supercollider](https://github.com/alex-lapipa/supercollider)** — fork of the SuperCollider audio synthesis language. Runs on the studio Mac; the fork exists for pinning/patching, not for installation (install the release app from supercollider.github.io).
- **[Modality-toolkit](https://github.com/alex-lapipa/Modality-toolkit)** — fork of the SuperCollider Quark for mapping MIDI/HID controllers to synthesis parameters. Install inside SuperCollider with `Quarks.install("Modality-toolkit")`. This fork is where studio-specific controller descriptions (MiniLab 3, MRCC-routed gear) will live when we customise mappings.

Both are public upstream; the forks give this project a writable copy via the vault-backed `gh-sync` function.

## Roadmap

- [ ] English TD-3-MO QSG + Devil Fish manual into USER MANUALS bucket
- [ ] Tanzbär pattern-bank SysEx backups into Storage
- [ ] Studio MCP server v0 (Mac-side: list_midi_ports, send_cc/sysex, clock) — MRCC-first
- [ ] `patches` table: own patches as structured data (knobs jsonb, patchbay routes, audio refs)
- [ ] Live search artifact / dashboard
- [ ] SuperCollider + Modality: generative sessions driving the rig via MRCC (SC MIDI out -> MRCC routes); studio controller descriptions committed to the Modality-toolkit fork
- [ ] Optional: swap embeddings to OpenAI text-embedding-3-small if retrieval fuzzes at scale
