# Studio Brain Retrieval & Evidence Contract v1

Status: normative design contract for Studio Brain v2.

## Principle

No substantive studio recommendation may be generated from model memory alone. The system must first collect an evidence bundle covering every relevant device, application/API and technical dimension required by the request.

A manual being present in Storage is not sufficient. Every meaningful technical section must have retrievable semantic and lexical coverage, source identity, page/section provenance, and version/revision metadata where available.

## Request pipeline

1. **Classify intent** — fact lookup, configuration, troubleshooting, connection design, optimization, safety/electrical, or creative workflow.
2. **Resolve entities** — physical gear, computers, DAWs/software, plugins, APIs, endpoints and current routes.
3. **Decompose technical dimensions** — MIDI, clock/transport, CV/gate, audio, USB/network, sample rate, power/grounding, firmware/software/API version.
4. **Retrieve per entity + dimension** — hybrid semantic + lexical search; do not rely on a single global top-k.
5. **Expand context** — adjacent chunks and same section/page context when a result is incomplete.
6. **Coverage check** — every fact required to make the recommendation must be supported, or explicitly marked unverified.
7. **Conflict resolution** — prefer live observation for current state and manufacturer documentation for technical/electrical limits; surface unresolved conflicts.
8. **Synthesize** — only after evidence coverage passes.
9. **Cite** — return source/document/page/section references wherever the client permits.
10. **Verify** — for configuration work, provide an observable success test and rollback.

## No-source / no-recommendation gate

The system MUST NOT invent or extrapolate missing electrical or safety-critical values. This includes:

- power-supply voltage/current/polarity
- mains/power requirements
- CV voltage ranges and polarity
- gate/trigger thresholds
- audio level/impedance constraints when material to safe operation
- connector pinouts
- firmware/API semantics that determine compatibility

If evidence is absent or contradictory, answer that the point is unverified and request/retrieve authoritative documentation before prescribing the connection.

## Evidence bundle shape

An implementation should track at least:

```json
{
  "request": "...",
  "entities": ["..."],
  "dimensions": ["midi", "audio", "power"],
  "claims": [
    {
      "claim": "...",
      "status": "supported|conflicted|unverified|inferred",
      "evidence": [
        {
          "document_id": "uuid",
          "source": "manufacturer manual",
          "revision": "...",
          "page_start": 1,
          "page_end": 2,
          "section": "...",
          "chunk_ids": [1, 2]
        }
      ]
    }
  ],
  "live_state_observations": [],
  "missing_evidence": []
}
```

## Retrieval requirements

- Query decomposition by entity and technical dimension.
- Multiple candidates per subquery.
- Hybrid vector + FTS retrieval.
- Metadata/entity filtering.
- Neighbor expansion (`chunk_index ± N`) where appropriate.
- Page/section context expansion.
- Deduplication by document/chunk/checksum.
- Version/revision applicability checks for DAWs, firmware and APIs.
- Iterative retrieval when the coverage checker reports missing evidence.
- Optional reranking only after baseline retrieval metrics exist.

## Ingestion requirements

Each source must preserve, when available:

- manufacturer/publisher
- product/application/API identity
- document title and type
- source checksum
- document revision/version/date
- firmware/software/API applicability
- page number/range
- section/heading hierarchy
- copyright/storage provenance

Chunks must be bounded and validated before embedding. No chunk may be silently truncated for vectorization. If the embedding provider has an input limit, ingestion must split before embedding and store the exact embedded text relationship explicitly.

## Structured technical facts

High-value deterministic specifications should also be represented structurally, with provenance, rather than existing only as prose vectors. Candidate domains:

- MIDI ports/channels/messages/CC/NRPN/SysEx/clock/transport
- CV/gate/trigger ranges, polarity and thresholds
- audio connector type, nominal/max level, balanced state, impedance
- USB host/device roles and port behavior
- supported sample rates/bit depths
- power voltage/current/polarity/connector
- firmware/software/API versions and compatibility

Structured extraction does not replace manuals. Every extracted fact must link back to source evidence.

## Recommendation coverage matrix

For a cross-device setup, create a matrix before synthesis:

| Entity | MIDI/clock | CV | Audio | Power | Version/current state |
|---|---|---|---|---|---|
| Device/app A | supported? | supported? | supported? | supported? | supported? |
| Router/interface | supported? | n/a | supported? | supported? | observed? |
| Device/app B | supported? | supported? | supported? | supported? | supported? |

A required cell that is unsupported blocks prescriptive advice for that dimension.

## Quality gates

A production release should demonstrate:

- 100% of stored chunks have embeddings and FTS vectors.
- 0 silently truncated embedding inputs.
- 100% of corpus documents have checksums and provenance.
- regression queries cover factual, cross-device, conflicting-source, version-specific and safety/electrical scenarios.
- retrieval recall/source correctness meets an agreed threshold before generation quality is judged.
- deliberate missing-evidence tests cause abstention rather than guessing.
- RLS/private Storage policies prevent public manual leakage.

## Agent interoperability

ChatGPT, Claude, the Vercel application and future Studio MCP clients must consume the same authoritative Supabase state. Agent-specific memory may improve interaction but must not become an alternative technical source of truth.