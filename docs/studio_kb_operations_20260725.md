# Studio Knowledge Base — Architecture & Operations (v2)

**Supabase project:** `klbzvbwudekstddlgnjy` · **Audited & verified 2026-07-25**
**Supersedes:** `docs/studio_kb_operations_20260724.md` (kept, not deleted — additive-only repo).
The 2026-07-24 doc states 11 gear rows and 16 documents. Both figures are now stale. This file is authoritative.

---

## Live state — every figure verified by query on 2026-07-25

| Object | Count | Notes |
|---|---|---|
| `gear` | **18** | `midi_channels` and `role_in_studio` populated on all 18 |
| `documents` | **21** | all `status = 'ingested'`; 16 with bucket objects, 5 `web_research` with none |
| `chunks` | **677** | 0 null embeddings, 0 null fts |
| Bucket objects | **16** | `USER MANUALS` 12 · `PATCHES AND PRESETS` 4 |
| Bucket ↔ table parity | **16 / 16** | zero orphans in either direction |
| Distinct checksums | **16** | no duplicate content across buckets |

Engine: Postgres 17.6.1.147, eu-west-1, `vector` 0.8.2, `supabase_vault` 0.3.1.

## Schema

- `gear` (uuid, make, model, category, synthesis_type, role_in_studio, midi_channels, sync_capabilities, io_summary, notes, created_at) — unique on `(make, model)`
- `documents` (uuid, gear_id→gear, title, doc_type, source_bucket, source_path, source_url, pages, status, ingested_at, created_at, **checksum**) — unique on `(source_bucket, source_path)`
- `chunks` (bigint identity, document_id→documents, chunk_index, content, section, page_start, page_end, embedding vector(384), fts tsvector generated) — unique on `(document_id, chunk_index)`

**`documents.checksum` added 2026-07-25** — sha256 hex of the bucket object. Null for `web_research` rows that have no object. Backfilled for all 16 objects. This is the duplicate-upload guard.

### Indexes
`chunks_embedding_idx` HNSW `vector_cosine_ops` · `chunks_fts_idx` GIN · `chunks_document_idx` · `chunks_document_id_chunk_index_key` unique · `documents_source_bucket_source_path_key` unique · **`documents_gear_id_idx`** (added 2026-07-25) · **`documents_checksum_idx`** (added 2026-07-25) · `gear_make_model_key` unique

### RLS
Enabled on all three public tables. Exactly three policies, all `SELECT` for `authenticated`, `qual = true`. No anon-readable policy. Both buckets `public = false` with **no** `storage.objects` policies — bucket reads happen only via service role or `kb.sign`.

## Edge functions

| Slug | Ver | verify_jwt | Actions |
|---|---|---|---|
| `kb` | 3 | true | `search`, `ingest_chunks`, `sign` (+ CORS preflight → 204) |
| `gh-sync` | **5** | true | `auth_status`, `whoami`, `get_repo`, `put_files`, **`list_tree`**, **`get_files`** |
| `admin-once` | 4 | true | none — neutralised stub, returns HTTP 410. Retired 2026-07-24, kept for audit trail. |

**`gh-sync` auth is a GitHub App**, not a PAT. `APP_ID 4388277`, RS256 JWT signed from the Vault PEM
`github_app_studio_key`, exchanged for an installation token. Installation `148845330` (`alex-lapipa`),
scoped to exactly 3 repos: `studio` (private), `supercollider`, `Modality-toolkit`. The old PAT
`github_pat_studio_kb` remains in Vault as an automatic fallback.

**`list_tree` / `get_files` added v5, 2026-07-25** — before this the repo was write-only from any
session (the GitHub MCP connector 404s on private repos for lack of scope), which made repo state
unauditable. These are read-only additions; all pre-existing actions are byte-identical to v4.

## Retrieval

`search_knowledge(query_text, query_embedding, match_count, filter_gear)` — SQL, `STABLE`,
`SET search_path = public, extensions`. Hybrid RRF, k=60: pgvector cosine ranked against
`websearch_to_tsquery('english')` over `chunks.fts`, full outer joined, scored
`1/(60+rank_semantic) + 1/(60+rank_keyword)`.

Embeddings: `gte-small` (384-dim) via `Supabase.ai.Session`, mean-pooled + normalised.

**Known ceiling:** `kb.ingest_chunks` embeds `content.slice(0, 4000)` while storing the full text.
Six chunks currently exceed 4000 chars (worst: 11,316 in the Analog Lab V manual), so the tail of
those chunks is reachable by keyword but not by vector. FTS covers the full text, so hybrid RRF
partially compensates. Tracked as an open item.

## Operating rules

- **Additive only.** Supersede with a new dated file; never delete or rename. This doc supersedes the 07-24 one; that one stays.
- **Never insert chunks by direct SQL** — the embedding would be null and the row invisible to semantic search. Always go through `kb.ingest_chunks`, which upserts on `(document_id, chunk_index)` and is therefore idempotent.
- **Bulk ingest is one chunk per request.** The edge CPU ceiling returns HTTP 546 on batches; the pipeline scripts handle retry/backoff.
- **Rights.** The corpus contains purchased third-party manuals. Buckets stay private, RLS stays authenticated-only, no manual text reaches any public surface, and this repo stays private while it references the corpus.

## Open items as of 2026-07-25

See `docs/studio_audit_snapshot_20260725.md` for the full findings table. Highest priority:
front-end auth model (`web/app/page.tsx` sends the anon key to `kb`, so the client-side password
gate does not actually protect `kb.sign`), Orchid gear row missing, Tanzbär SysEx never backed up.
