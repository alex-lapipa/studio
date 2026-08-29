# Overflow Vector Coverage Verification — 2026-08-27

## Purpose

Verify, without modifying production data, that every character beyond the original 4,000-character embedding boundary of the six historic oversized chunks is represented by additive overflow rows created by `kb` v4.

## Production state

- Total chunks: 834
- Original chunks (`chunk_index < 100000`): 826
- Overflow chunks (`chunk_index >= 100000`): 8
- Null embeddings: 0
- Null FTS: 0

`kb` v4 uses `limit=4000`, `overlap=200`, `window=3800`. Overflow starts at character 3800, intentionally overlapping the original embedding by 200 characters. Each subsequent overflow window advances by 3800 characters.

## Coverage proof

For each oversized source, the exact tail requiring an overflow representation is `source_chars - 3800`. The sum of persisted overflow-row character counts equals that required tail exactly:

| Source | Source index | Source chars | Overflow rows | Overflow chars | Required from char 3800 | Result |
|---|---:|---:|---:|---:|---:|---|
| Arturia Analog Lab V Manual (EN) | 3 | 11,316 | 2 | 7,516 | 7,516 | PASS |
| Arturia MiniLab 3 Manual | 4 | 8,926 | 2 | 5,126 | 5,126 | PASS |
| Conductive Labs MRCC Manual | 4 | 4,704 | 1 | 904 | 904 | PASS |
| Korg Electribe 2 / 2S Owner's Manual (EN) | 33 | 5,041 | 1 | 1,241 | 1,241 | PASS |
| Korg Electribe 2 / 2S Owner's Manual (EN) | 41 | 4,266 | 1 | 466 | 466 | PASS |
| Moog Theremini Manual | 1 | 4,752 | 1 | 952 | 952 | PASS |

All eight overflow rows have non-null embeddings and non-null FTS vectors.

## Conclusion

Historic semantic coverage for these six oversized originals is complete under the v4 additive overflow strategy: the original vector covers characters 0–3999, and overflow begins at character 3800, creating a 200-character overlap with no gap. The persisted overflow lengths account for the complete remaining source text.

This is a compatibility repair, not the preferred future ingestion design. New ingestion must use the bounded chunker and MUST NOT create source chunks that require `content.slice(0,4000)` truncation during embedding.

## Guardrail

Do not delete the overflow rows while the oversized originals remain. Future re-ingestion/rechunking should occur as a separately reviewed migration with retrieval regression tests and explicit document/chunk lineage.