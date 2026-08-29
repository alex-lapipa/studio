# `search_knowledge()` Production Audit — 2026-08-27

## Current signature

```sql
search_knowledge(
  query_text text,
  query_embedding vector,
  match_count integer default 8,
  filter_gear uuid default null
)
```

Returns: `chunk_id`, `document_id`, `document_title`, `doc_type`, `gear`, `section`, `page_start`, `content`, `score`.

## Retrieval algorithm

### Semantic branch

- searches chunks with non-null embeddings
- optional filter via `documents.gear_id = filter_gear`
- ranks by cosine distance (`embedding <=> query_embedding`)
- candidate depth: `match_count * 4`

### Lexical branch

- English `websearch_to_tsquery`
- requires `chunks.fts` match
- optional same `documents.gear_id` filter
- ranks by `ts_rank_cd`
- candidate depth: `match_count * 4`

### Fusion

Reciprocal-rank fusion over chunk IDs:

`1/(60 + semantic_rank) + 1/(60 + keyword_rank)`

A chunk appearing in both branches receives both contributions. Final result is ordered by fused score and limited to `match_count`.

## Verified strengths

- Semantic and exact/lexical retrieval are both represented.
- Fusion is rank-based, avoiding incomparable raw vector/FTS score scales.
- Gear filtering is applied consistently to both candidate branches.
- Returned rows include document identity, document type, gear label, section and page start.
- Function is `STABLE` and has an explicit search path.

## Professional-grade gaps

1. **Single-gear filter only.** Cross-device engineering requests cannot express multiple gear/entity filters in one call.
2. **Document model dependency.** Filtering relies on one `documents.gear_id`; this cannot represent documents about several devices/apps without the planned `document_entities` layer.
3. **No document/version/revision applicability filter.** DAW/API/firmware-version-specific retrieval is not enforceable here.
4. **No page-end in result.** `chunks.page_end` is not returned even though page-range provenance matters.
5. **No chunk index in result.** Neighbor expansion cannot be implemented cleanly from this response alone.
6. **No retrieval diagnostics.** Semantic rank, lexical rank, vector distance and lexical score are not exposed, making benchmark analysis less precise.
7. **Fixed candidate depth.** `4 × match_count` is not benchmark-derived and may reduce recall for broad/cross-device queries.
8. **English-only FTS configuration.** Appropriate for current English manuals, but multilingual sources would need explicit treatment.
9. **No context/neighbor expansion.** Returned chunks are isolated; surrounding chunks/section context require a second retrieval mechanism.
10. **No evidence coverage logic.** The SQL ranks chunks but does not determine whether all required technical claims are supported.
11. **Overflow compatibility rows are ordinary chunks.** Search can return them, but lineage to the oversized source chunk is encoded only indirectly by high chunk indexes.
12. **RRF score is not a confidence score.** It must never be presented as probability/certainty.

## Required v2 direction

Do not destructively replace this function while the current web client depends on it. Preserve it as the compatibility search API and add a separate evidence-oriented retrieval API/function that can:

- filter multiple entities/documents/types/versions
- return chunk index + page range + source/version metadata
- expose retrieval diagnostics for benchmarking
- fetch neighboring chunks deterministically
- deduplicate/merge context
- support query decomposition and evidence bundles
- identify missing evidence before synthesis

The existing function remains a useful baseline against which v2 retrieval should be measured.

## Benchmark implication

The first benchmark runner should target the current production search behavior exactly, record top-k document/chunk hits, and score expected-source recall. A second benchmark mode can later target the evidence-oriented v2 API. This prevents improving generation while unknowingly regressing retrieval.