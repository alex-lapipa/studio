# Studio Knowledge Base — Architecture & Operations
**Supabase project:** `klbzvbwudekstddlgnjy` · Built 2026-07-24

## What exists now

**Schema (public):**
- `gear` — 11 devices: Moog DFAM, Mother-32, Subharmonicon, Subsequent 37, Theremini; Korg Electribe 2/2S; MAM MB33; MFB Tanzbär; Arturia MiniLab 3; Conductive Labs MRCC; Allen & Heath Xone:92 LE. (The mystery `download_210442 (1).pdf` was identified as the MFB Tanzbär manual.)
- `documents` — 16 sources: 11 manuals, 2 blank patch sheets, Electronicus patch book, official DFAM↔Mother-32 sync guide, plus 1 web-research doc (clock/sync architecture, MRCC routing, Moog trio recipes, Xone:92 gain staging, Electribe limits, Theremini CV, MB33 quirks, Tanzbär MIDI/CV).
- `chunks` — 552 chunks, all embedded (gte-small, 384-dim), HNSW index + GIN full-text index.
- `search_knowledge()` — hybrid retrieval (semantic + keyword, reciprocal rank fusion), optional per-gear filter.

**Edge function `kb`** (verify_jwt, call with anon key):
- `{"action":"search","query":"...","match_count":8,"filter_gear":null}` — embeds the query and runs hybrid search. This is the endpoint any tool/agent uses.
- `{"action":"ingest_chunks","document_id":"...","chunks":[...]}` — embeds + upserts (idempotent on document_id+chunk_index).
- `{"action":"sign","bucket":"...","paths":[...]}` — signed download URLs for the private buckets.

**Query it:**
```bash
curl -X POST "https://klbzvbwudekstddlgnjy.supabase.co/functions/v1/kb" \
  -H "Authorization: Bearer <anon key>" -H "Content-Type: application/json" \
  -d '{"action":"search","query":"sync DFAM to Mother-32","match_count":5}'
```
Or just ask me in any Cowork/Claude session with the Supabase MCP connected — I can query it directly.

**Notes on ingestion decisions:**
- Electribe manual: English section only (pages 1–29 of the 112-page multi-language PDF).
- The two blank patch sheets and the Electronicus patch book are graphics-heavy; only their text was ingested. Their value is as printable templates — fetch via the `sign` action when needed.
- Language: English FTS config; embeddings are language-agnostic enough for EN queries.

## Verified retrieval (spot checks)
"Sync DFAM to Mother-32" → official sync guide p1 + DFAM manual p31. "Set MIDI channel on MB33" → MB33 manual p4 (Midi-Select) + research doc (rear DIP switches). "Import samples into Electribe sampler" → research doc workflow + Electribe manual p17.

## How to extend (the pattern is now repeatable)
1. Drop a new PDF into a bucket.
2. Insert a `documents` row, extract text (pdftotext), chunk ~1,500 chars page-aware, POST batches to `kb` `ingest_chunks`. All scripts are in `outputs/kb/` (`chunk.py`, `ingest.py`, `dl_batch.py`) — I can rerun the pipeline on request.
3. Web research goes in as `doc_type='web_research'` documents — same pipeline.

## Flags & recommended next steps
1. **Embedding quality (I think, not certain, it will matter at this corpus size: probably not):** gte-small/384 was chosen because it runs inside Supabase Edge Functions with zero external keys. If retrieval feels fuzzy as the corpus grows, swap to OpenAI `text-embedding-3-small` (1536-dim) — needs an OPENAI_API_KEY secret on the function, a new vector column, and one re-embed pass (~30 min, scripts already exist).
2. **Security:** the `sign` action means anyone holding the anon key can get download URLs for the private buckets. Acceptable for a personal KB; if this ever fronts anything shared, gate `sign` behind a Vault-stored secret header or strip it from the function.
3. **546 errors during bulk ingest** are the edge-function CPU ceiling on the free tier — the ingest script handles them with backoff; nothing to fix.
4. **Next tier — make it an interface, not an endpoint:**
   - A live Cowork artifact (search box → `kb` function → results with manual page refs) you can reopen anytime.
   - Register this KB as a tool in the Methodology MCP Server build — "studio-kb" is a clean first corpus and the ingest pattern (bucket → chunks → hybrid search fn → edge endpoint) is directly reusable as Platform IP for client corpora via miramonte.io.
   - Patch storage: add a `patches` table (name, gear_id, knob positions as jsonb, patchbay connections, audio ref) so your own patches become structured data, not PDFs.

**What this enables next:** the bucket→pgvector→edge-function pipeline is now a proven, reusable corpus factory — point it at any Surface's documents and you get a queryable KB with the same three calls.
