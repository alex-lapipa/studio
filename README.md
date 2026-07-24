# studio — ALEX & ANTAINE MUSIC STUDIO

Knowledge base, RAG pipeline and (soon) intelligent management tooling for a hardware electronic-music studio. Personal project: experiment, enjoy, make music.

## The studio

**Technical centre:** Conductive Labs MRCC (6-in/12-out MIDI router, 4× USB host).
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
    └── github_pat_studio_kb  ← fine-grained PAT, this repo only
```

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
- **Corpus is the rulebook** — the KB grounds every configuration answer; next tier is a Studio MCP server that uses it to operate the rig (MIDI routing, SysEx backup, generative sessions via the MRCC).

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
