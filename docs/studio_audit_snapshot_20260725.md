# ALEX & ANTAINE STUDIO — Full Stack Audit & Snapshot

**Date:** 2026-07-25 · **Mode:** read-only (zero writes, zero deploys, zero deletes)
**Scope:** Supabase backend, edge functions, GitHub, Vercel, all org connectors/MCPs, device bridge, corpus ↔ bucket ↔ project parity
**Method:** every claim below is from a live tool call this session. Where I could not verify, it is marked **UNVERIFIED** rather than assumed.

---

## 1. Verdict

The **backend is in genuinely good shape** — clean corpus, correct RLS, all three edge functions live and behaving exactly as designed, hybrid RAG returning cited results in ~1.3 s. Zero integrity defects.

The problems are **not in the database**. They are:

1. **The project instructions are stale by one working session.** Infrastructure changed between 01:05 and 01:45 UTC on 2026-07-25 (after the instructions were written at 2026-07-24 21:26). Five documented facts are now wrong.
2. **The session has no hands.** 6 of 35 connectors are enabled in this chat. Notion (workspace system of record), SharePoint (rights-docs of record), Drive and Slack are all off. Dropbox — the canonical home for source assets under Workspace §2 — **is not installed at all**. Zero folders are granted on the Mac.
3. **Vercel is effectively unauditable.** The connector exposes 7 tools this session, all of them purchase/analytics. There is no `list_projects`, no `list_deployments`, no `get_project`. I could not confirm that `prj_qhdWNQ96bitwujT7iK3O6ksdQKy5` exists.
4. **Repo sync has measurable drift.** `kb` v3 was deployed 5 min 35 s *after* the last push to `alex-lapipa/studio`.

---

## 2. Backend — Supabase `klbzvbwudekstddlgnjy` · [certain]

| Property | Value | Status |
|---|---|---|
| Project | ALEX ANTAINE STUDIO, org `oqhewhyzsnmrojwajxde` | `ACTIVE_HEALTHY` |
| Engine | Postgres **17.6.1.147**, eu-west-1 | ✅ |
| Extensions | `vector` 0.8.2, `supabase_vault` 0.3.1, `pgcrypto`, `uuid-ossp`, `pg_stat_statements` | ✅ |
| Migrations | `20260724165503 studio_kb_schema`, `20260724205301 vault_secret_accessor_for_edge` | ✅ 2, matches |
| Auth users | 1 — `alex@rmtv.io`, created 07-25 01:06, confirmed 01:08, last sign-in 01:41 | ⚠️ undocumented |
| Vault secrets | `github_pat_studio_kb` (07-24 20:50), **`github_app_studio_key` (07-25 01:19)** | ⚠️ 2nd undocumented |
| Branches | `main` (default, persistent=false, `FUNCTIONS_DEPLOYED`) — branch record **created 2026-07-25 05:13 UTC** | ⚠️ verify intent |

### Health check — all clean, at or below baseline

```
chunks_no_embedding   0        docs_zero_chunks   0
chunks_no_fts         0        gear_no_docs       5   ← documented baseline (§2 exceptions)
docs_not_ingested     0        gear_incomplete    0
gear 18 · documents 21 · chunks 677
```

`documents` is **21, not 20** as documented — the extra row is *Studio Mac ↔ MRCC MIDI Configuration* (ingested 07-24 21:57, i.e. after the instructions were written).

### Schema, RLS, indexes — correct

- RLS enabled on `gear`, `documents`, `chunks`; exactly three policies, all `SELECT` for `authenticated`, `qual = true`. **No anon-readable policy.** ✅ rights-compliant.
- Both buckets `public = false`. **No `storage.objects` policies at all** → bucket reads only via service role / `kb.sign`. ✅
- Indexes all present: HNSW `vector_cosine_ops` on `chunks.embedding`, GIN on `chunks.fts`, unique `(document_id, chunk_index)`, unique `(source_bucket, source_path)`, unique `(make, model)`.
- `search_knowledge` is `STABLE`, `SET search_path = public, extensions`, RRF k=60 over pgvector cosine + `websearch_to_tsquery('english')`. Implementation matches the documented contract exactly.
- `internal_get_secret` is `SECURITY DEFINER`, SQL. ✅

### Bucket ↔ table parity — 16 / 16, zero orphans either direction

Every object in `USER MANUALS` (12) and `PATCHES AND PRESETS` (4) has a `documents` row on the exact `source_path`. No document row points at a missing object.

### Advisors

| Level | Finding |
|---|---|
| WARN (security) | Leaked-password protection disabled — *not applicable*: single user, no public signup. Enable anyway, it's free. |
| INFO (perf) | `documents.gear_id` FK unindexed |
| INFO (perf) | `chunks_embedding_idx` (HNSW) never used — at 677 rows Postgres prefers seq scan. Not a defect; means index behaviour is **untested at scale**. |
| INFO (perf) | Auth DB connections fixed at 10, not percentage-based |

---

## 3. Edge functions — all three live-tested · [certain]

| Function | Ver | verify_jwt | Deployed (UTC) | Live test result |
|---|---|---|---|---|
| `kb` | 3 | true | 2026-07-25 **01:44:42** | `search` → **HTTP 200, 1.31 s**, returned MRCC Manual **p13** verbatim (virtual-cables passage). `{"action":"nope"}` → 400. No auth header → **401**. ✅ |
| `gh-sync` | 4 | true | 2026-07-25 01:13:58 | `auth_status` → **200, `auth_mode: github_app`**, PEM found (27 lines), JWT signed, `/app/installations` 200, install `148845330` = `alex-lapipa`, token minted 201. ✅ |
| `admin-once` | 4 | true | 2026-07-25 01:09:00 | → **410 `{"error":"disabled"}`**. Source is a 2-line neutralised stub. ✅ correctly retired. |

**`gh-sync` has been rewritten and the instructions don't reflect it.** It is now a GitHub **App** flow (`APP_ID 4388277`), signing an RS256 JWT from the Vault PEM, minting an installation token, with the old PAT as **fallback** — plus a new `auth_status` action and PEM newline repair. Documented as "reads PAT from Vault; actions whoami/get_repo/put_files".

24 h edge logs: all 200s except my own deliberate 400/401/410 probes. Two historical `OPTIONS | 500` on `kb` v2 — fixed in v3 (CORS preflight now returns 204). No errors since.

---

## 4. GitHub · [certain]

| Check | Result |
|---|---|
| MCP connector auth | ✅ authenticated as **`alex-lapipa`** (Alex Lawton) — *instructions say "unauthenticated"; that is now wrong* |
| MCP private-repo access | ❌ `GET /repos/alex-lapipa/studio` → **404**. `user:alex-lapipa` search returns **6 public repos of 16**. Scope, not auth. |
| `gh-sync` App scope | ✅ exactly 3 repos: `alex-lapipa/studio` (private), `supercollider`, `Modality-toolkit` |
| `alex-lapipa/studio` | private, `main`, **94 KB**, created 07-24 20:26, **last push 2026-07-25 01:39:07 UTC** |

**Repo drift — concrete:** `kb` v3 was deployed at **01:44:42**, the last push to the repo was **01:39:07**. The currently-running `kb` source is **5 min 35 s newer than anything in git**. `gh-sync` v4 (01:13:58) and `admin-once` v4 (01:09:00) predate the push and are probably in.

**Audit blind spot — declared:** I could not read the repo tree. `gh-sync` has **no read/list action** (`whoami`, `get_repo`, `put_files`, `auth_status` only) and the GitHub MCP 404s on private repos. Everything about repo *contents* is **UNVERIFIED**.

---

## 5. Vercel — cannot audit · [certain about the limitation]

The Vercel connector is org-connected and enabled in this chat, but exposes **7 tools, all commercial**: `buy_addon`, `buy_credits`, `buy_domain`, `buy_pro`, `get_purchase_quote`, `get_domain_order`, `get_web_analytics`.

There is **no** `list_projects`, `list_deployments`, `get_project`, `get_deployment_build_logs`, or `list_teams`.

- `get_web_analytics(prj_qhdWNQ96bitwujT7iK3O6ksdQKy5)` → **404 "Web Analytics not found."**
- Existence of the project ID, its domains, env vars, build status and deployment history: **UNVERIFIED**.

Net: in this session Vercel can spend money but cannot ship or report. That is backwards.

---

## 6. Connectors & MCPs — 35 installed, 6 usable

**Enabled in this chat (6):** GitHub · GitLab · Gmail · Hugging Face (✅ auth `alexlawton`) · Supabase (✅) · Vercel (crippled, §5)

**Connected at org level but OFF in this chat (14+):**

| Connector | Why it matters here |
|---|---|
| **Notion** | Ops Hub `30c425866bb581d4` is the workspace system of record. Decisions from this session have **no append-only log**. Known gap, now confirmed live. |
| **Microsoft 365 / SharePoint** | Rights-docs-of-record under Workspace §2. Manuals are third-party copyright — **no rights records reachable**. |
| Google Drive · Slack · Shopify · Webflow · Figma · Canva · Resend · Semrush · Asana · Google Calendar | Off; not blocking studio work today |

**Not installed at all:**

| Gap | Severity |
|---|---|
| **Dropbox** — Workspace §2 names `Dropbox /‹project›/Masters` as the *canonical home for source assets*. Not in the registry as installed. A `LA PIPA Studios Dropbox` folder exists on the Mac. **The canonical masters home is unreachable from any session.** | High |
| **Splice** — installed, `installState: unknown`, not enabled. Two Splice folders on the Mac. Directly studio-relevant (sample library, `prompt_to_stack`, `download_asset`). | Medium |

---

## 7. Device bridge — reachable, but zero access · [certain]

| Property | Value |
|---|---|
| Device | `alexs-mac-mini-local`, darwin/arm64, Claude 1.24012.9, Node 24.18.0 |
| **Connected folders** | **none** |
| Filesystem MCP allowed dirs | session uploads dir only |
| Local MCPs proxied | Filesystem, Control Chrome, Brave AppleScript, ElevenLabs Agents, pdf-viewer |
| Computer use | available (two-phase grant) |

Studio-relevant folders visible in `$HOME` but ungranted: **`LA PIPA Studios Dropbox`**, **`Splice`**, `Splice - user-8684550322`, `OneDrive - Remotive Media`, `supabase`, `.supabase`.

**Consequence:** the two highest-severity backlog items are *structurally blocked*, not merely pending. The Tanzbär SysEx backup needs a Mac-side MIDI path **and** a writable folder. Neither exists today.

---

## 8. Corpus reconciliation — backlog re-audited

| Backlog item (from §5 of project instructions) | Verified status today |
|---|---|
| Telepathic Instruments **Orchid** — no gear row, not in bucket | **CONFIRMED.** `Orchid Manual – Telepathic Instruments.pdf` is in project files. No `gear` row for Orchid among the 18. Not in either bucket. |
| `Mother32ExplorationPatchbookFirmwarev2.0.pdf` not in bucket | **CONFIRMED.** In project files, absent from `PATCHES AND PRESETS`. |
| English TD-3-MO QSG not in bucket | **CONFIRMED** absent |
| Devil Fish User Manual not in bucket | **CONFIRMED** absent |
| Tanzbär pattern banks never backed up | **CONFIRMED** absent — and now **blocked** (§7) |
| No `patches` table | **CONFIRMED** — `public` schema holds only `gear`, `documents`, `chunks` |
| No `documents.checksum` | **CONFIRMED** |
| No corpus backup outside Supabase | **CONFIRMED** |
| *`download_210442.pdf` — unidentified* | **RESOLVED.** It is the **MFB Tanzbär User Manual**, byte-identical in content to `MFB TANZBAR.pdf` already in `USER MANUALS` and ingested (32 chunks). Working copy. **No action — close this.** |

### New findings not previously on the backlog

| # | Finding | System | Sev | Evidence |
|---|---|---|---|---|
| N1 | **6 chunks exceed 4000 chars**, so their embeddings cover only the first 4000. Worst: Analog Lab V chunk at **11,316 chars** (~65 % semantically invisible). FTS still indexes the full text, so hybrid RRF partially compensates. | Supabase / `kb` | Med | `kb` embeds `c.content.slice(0,4000)`; SQL length audit |
| N2 | Sibling Supabase project **`ANTAINE`** (`lxeuxyieicluzgikflzx`, eu-west-1, created 2026-07-18) exists alongside the studio project. Potential surface overlap / duplicated corpus. | Supabase | Med | `list_projects` |
| N3 | **`pg_cron` and `pg_net` are NOT installed.** No in-database scheduling is possible; any Quick Sweep must run via Claude scheduled tasks. | Supabase | Info | `list_extensions` |
| N4 | `gh-sync` has **no read action** — the repo is a write-only black box from any session. | Edge fn | Med | source inspection |
| N5 | Supabase **branch record created 2026-07-25 05:13 UTC**, minutes before this audit. If branching was just enabled, it carries cost on paid plans. Not created by this session (read-only). | Supabase | Info | `list_branches` |

---

## 9. Findings table — decisions first

| Finding | System | Severity | Action needed |
|---|---|---|---|
| Dropbox not connected — canonical masters home unreachable | Workspace | **High** | Install Dropbox connector (your call) |
| Tanzbär SysEx backup blocked: no folder grant, no MIDI path | Studio / device | **High** | Grant `LA PIPA Studios Dropbox` (+ a studio folder); then SysEx Librarian dump |
| Orchid: no gear row, no document, not in bucket | Supabase | **High** | Gear row + upload + ingest |
| Notion off in chat — decisions have no append-only log | Workspace | **High** | Enable Notion in this chat's connector settings |
| Project instructions stale on 5 verified points (§10) | Docs | **High** | Rewrite to v3 (I have the diff) |
| Repo drift: `kb` v3 is 5 m 35 s newer than last push | GitHub | Med | `gh-sync put_files` the current `kb`/`gh-sync`/`admin-once` sources |
| Vercel connector exposes only purchase tools | Vercel | Med | Re-auth / re-scope, or drop Vercel from this project's stack claim |
| SharePoint off — no rights records reachable for purchased manuals | M365 | Med | Enable in chat |
| Mother-32 Exploration Patchbook not in bucket | Supabase | Med | Upload + ingest |
| TD-3-MO EN QSG + Devil Fish manual absent | Supabase | Med | Download + upload + ingest |
| N1 — 6 chunks over the 4000-char embedding ceiling | Supabase | Med | Re-split those 6 chunks, re-ingest (idempotent upsert) |
| N2 — sibling `ANTAINE` Supabase project, possible overlap | Supabase | Med | Decide: merge, federate, or declare separate |
| N4 — `gh-sync` write-only, no read path | Edge fn | Med | Add `get_files` / `list_tree` action |
| No `patches` / `routing` / `sessions` tables | Supabase | Med | §7 next-tier build |
| Splice installed but disabled | Connectors | Med | Enable |
| No `documents.checksum` | Supabase | Low | Add sha256 + backfill |
| No corpus backup outside Supabase | Supabase | Low | Scheduled `pg_dump` + bucket copy |
| N5 — branch record created today | Supabase | Info | Confirm intent / cost |
| Leaked-password protection off | Supabase Auth | Info | Toggle on |
| `documents.gear_id` FK unindexed | Supabase | Info | One-line index |

---

## 10. Instruction corrections — the exact diff for v3

| # | Instructions say | Reality (verified 2026-07-25) |
|---|---|---|
| 1 | Two edge functions: `kb`, `gh-sync` | **Three.** `admin-once` v4 exists, neutralised → 410. Document it as retired rather than leaving it undocumented. |
| 2 | `gh-sync` reads PAT from Vault; actions `whoami`/`get_repo`/`put_files` | **GitHub App flow**, `APP_ID 4388277`, RS256 JWT from Vault PEM → installation token; PAT is now **fallback only**. Fourth action `auth_status`. |
| 3 | Vault secret: `github_pat_studio_kb` | **Two secrets.** `github_app_studio_key` added 07-25 01:19. |
| 4 | (silent on auth users) | Auth user **`alex@rmtv.io`** created 07-25 01:06 — this is what makes the `authenticated`-only RLS actually usable. Belongs in §1. |
| 5 | `documents` 20 rows | **21.** |
| 6 | "GitHub MCP connector unauthenticated in Cowork sessions" | **Authenticated** as `alex-lapipa`. The 404 is a **scope** artifact (no private-repo permission), not auth. Conclusion (`gh-sync` is canonical) still stands — the stated reason is wrong. |
| 7 | `gear_no_docs` baseline 5 | ✅ correct, holds today. |

---

## 11. Proposed plan — for approval

Nothing below has been executed. Read-only was respected throughout.

### Phase 0 — unblock (needs you, ~10 min, no code)

| # | Action | Why |
|---|---|---|
| 0.1 | Enable **Notion**, **Microsoft 365**, **Google Drive**, **Splice** in this chat's connector settings | Restores the workspace search order (§1) and the rights-docs-of-record path |
| 0.2 | Install the **Dropbox** connector | Canonical masters home is currently unreachable |
| 0.3 | Grant device folders: `~/LA PIPA Studios Dropbox` and (name it) your studio working folder | Unblocks SysEx backup, local corpus staging, masters↔derivative reconciliation |
| 0.4 | Confirm the Supabase branch record (N5) was intentional | Cost |
| 0.5 | Decide Vercel: re-auth for management tools, or drop it from this project's stack | It can only spend money today |

### Phase 1 — truth repair (I execute, ~30 min, all additive, no irreversibles)

| # | Action |
|---|---|
| 1.1 | Rewrite project instructions to **v3** with the §10 diff; write to project as `claude/studio-project-instructions-v03.md`, keep v01 (additive) |
| 1.2 | `gh-sync put_files` current `kb` / `gh-sync` / `admin-once` sources + schema + this snapshot → closes the 5 m 35 s drift |
| 1.3 | Add `get_files` + `list_tree` actions to `gh-sync` → makes the repo auditable, kills the §4 blind spot |
| 1.4 | Add `documents.checksum` (sha256) + backfill; add index on `documents.gear_id`; enable leaked-password protection |
| 1.5 | Re-split the 6 over-4000-char chunks and re-ingest (idempotent upsert on `(document_id, chunk_index)`) |

### Phase 2 — close the corpus backlog (I execute, needs Phase 0.2/0.3 for the SysEx item)

| # | Action |
|---|---|
| 2.1 | **Orchid**: gear row + upload `Orchid Manual – Telepathic Instruments.pdf` to `USER MANUALS` + ingest |
| 2.2 | Upload + ingest `Mother32ExplorationPatchbookFirmwarev2.0.pdf` → `PATCHES AND PRESETS` |
| 2.3 | Fetch + upload + ingest TD-3-MO EN QSG and the Devil Fish User Manual |
| 2.4 | **Tanzbär SysEx pattern dump** — irreversible-adjacent; I will stage the exact SysEx Librarian steps and you run the dump. *Receiving* a dump overwrites the bank; we are only *sending from* the unit. One confirmation before anything touches hardware. |
| 2.5 | `pg_dump` of `public` + bucket copy → first corpus backup outside Supabase |

### Phase 3 — next tier (proposal, your call on order)

| # | Build | Why it's the 10x |
|---|---|---|
| 3.1 | **`patches` table + capture flow** — `patch(id, gear_id, name, bpm, key, knob_state jsonb, patch_cables jsonb, tags, audio_ref)` | Highest-leverage data build. Turns 4 static patch PDFs into a queryable, recallable patch library. |
| 3.2 | **`routing` table off MRCC ports** | The studio becomes a graph: *"what's on ch 5"*, *"what breaks if I move the Tanzbär"* become one-line queries instead of manual tracing. |
| 3.3 | **Studio MCP Server v0** (Mac-side, Node) — `list_midi_ports`, `send_note/cc/sysex`, `capture_dump`, `clock/transport` over the MRCC PC port's 12×12 virtual cables | The KB has the channel map; this gives it hands. Also the *only* clean path for automated SysEx backup, which converts a High recurring risk into a scheduled job. Requires Phase 0.3. |
| 3.4 | **Scheduled Quick Sweep** via `create_trigger` (weekday 08:00 CET) — health-check SQL + bucket parity + `documents.status` → findings pushed to Notion Ops Hub | `pg_cron` is not installed (N3), so this is the only route. Needs Phase 0.1. |
| 3.5 | Benchmark `text-embedding-3-small` vs `gte-small` | 677 chunks now; the documented review threshold is ~2k. Not urgent — but N1 shows the 384-dim/4000-char ceiling is already binding on 6 chunks. |
| 3.6 | Extract **ingest → chunk → hybrid-RRF** as a licensable methodology | Platform IP. This pipeline is clean enough to package; it is the same pattern every Surface corpus needs. |

---

## 12. Frontier note (unprompted, per §4.5)

The `gh-sync` GitHub App rewrite is the single most reusable thing in this stack and it isn't recognised as such. A Vault-backed, service-role-only edge function that mints short-lived installation tokens server-side is a **generic secret-broker pattern** — it works for any API, not just GitHub, and it removes long-lived PATs from every Surface at once. Worth extracting to `miramonte.io` as a template alongside the RAG pipeline.

---

**What this enables next:** with Phase 0 granted, the studio brain stops being read-only-in-the-cloud and becomes an operating system with hands on the Mac, an append-only decision log in Notion, and a corpus that can back itself up — which is the precondition for the `patches` table and the Studio MCP Server, and the point at which this project starts compounding instead of being maintained.
