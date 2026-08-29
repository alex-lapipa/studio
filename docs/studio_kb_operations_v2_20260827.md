# Studio KB Operations v2 — 2026-08-27

## Manual ingestion

1. Prefer manufacturer PDFs. Store copyrighted binaries only in private Supabase Storage `USER MANUALS`.
2. Compute SHA-256 and check `documents.checksum` before registering; never duplicate an identical source.
3. Register `documents` additively with title, type, bucket/path or source URL, page count when known, checksum, and gear link only when the represented gear row exists.
4. Extract text page-aware. Use `pipeline/chunk_v2.py`; reject any emitted chunk over 1900 characters.
5. Ingest through the `kb` Edge Function in resumable batches. Confirm vectors and FTS are non-null.
6. Run `tests/benchmark_retrieval.py`; inspect failures for source quality/retrieval behavior rather than changing facts to satisfy tests.

## Live-state capture

Use `computers`, `software`, `plugins`, `endpoints`, `connections`, and `observations`. A connection is `observed` only when directly inspected; saved configs are not proof of present cabling. Record observer, timestamp, evidence type and source reference. Never infer electrical compatibility.

## Shared ChatGPT / Claude workflow

Pull the active branch before writes. Inspect current Supabase state. Make additive/reversible changes. Run unit tests, compile checks, retrieval regression, SQL integrity checks and `git diff --check`. Commit small verified changes to a branch/PR. Never place secrets or copyrighted manuals in git.

## Known migration-history discrepancy

The production migration versions for the original schema do not match the historical repo filenames. Do not run `migration repair` merely to make CLI history look tidy. The discrepancy is documented in `supabase/MIGRATIONS.md`; direct additive SQL was used for Source-of-Truth v2 until history can be normalized in a dedicated reviewed maintenance change.

## Current gates

Chat-uploaded manuals are available to the ChatGPT attachment runtime but not mounted on the authorized Mac. Do not substitute reconstructed text for the PDFs. When a supported byte-transfer path to the Mac/private Storage exists, upload/register/ingest them with the procedure above. Harmony-G XT remains lower-trust until replaced by a manufacturer original.
