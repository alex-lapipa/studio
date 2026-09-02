"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStudioState, type StudioState } from "../lib/studio";

type Hit = { chunk_id: number; document_id: string; document_title: string; doc_type?: string; gear?: string; section?: string; page_start?: number; content: string; score?: number; };

export function EvidenceBrain({ client, url }: { client: SupabaseClient; url: string }) {
  const [q, setQ] = useState(""); const [results, setResults] = useState<Hit[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [state, setState] = useState<StudioState | null>(null);
  useEffect(() => { loadStudioState(client).then(setState).catch(() => undefined); }, [client]);
  const sources = useMemo(() => [...new Set(results.map((r) => r.document_title))], [results]);
  const structured = useMemo(() => {
    if (!state || !q.trim()) return [];
    const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2); const rows: Array<{type:string; title:string; detail:string}> = [];
    const add = (type:string, title:string, detail:string) => { const hay = `${title} ${detail}`.toLowerCase(); if (terms.some((t) => hay.includes(t))) rows.push({ type, title, detail }); };
    state.gear.forEach((g) => add("configured", `${g.make} ${g.model}`, `${g.role_in_studio || ""} ${g.midi_channels || ""} ${g.sync_capabilities || ""}`));
    state.software.forEach((s) => add("observed", s.name, `${s.version || ""} ${s.category || ""}`));
    state.plugins.forEach((p) => add("observed", p.name, `${p.vendor || ""} ${p.version || ""} ${p.format || ""}`));
    state.endpoints.forEach((e) => add("observed", e.name, `${e.endpoint_type || ""} ${e.transport || ""} ${e.sample_rate_hz || ""}`));
    state.observations.forEach((o) => add(o.evidence_type === "live_observation" ? "observed" : "documented", o.fact_key, `${o.source_ref || ""} ${JSON.stringify(o.fact_value || {})}`));
    return rows.slice(0, 12);
  }, [state, q]);

  async function search(e: React.FormEvent) {
    e.preventDefault(); if (!q.trim()) return; setBusy(true); setError("");
    try {
      const session = (await client.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Authenticated studio session required. Sign in again and retry.");
      const r = await fetch(`${url}/functions/v1/kb`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "search", query: q, match_count: 10 }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || `Search failed (${r.status})`); setResults(j.results || []);
    } catch (e: any) { setResults([]); setError(String(e.message || e)); } finally { setBusy(false); }
  }

  return <>
    <section className="hero-panel brain-hero"><div><div className="eyebrow">STUDIO BRAIN</div><h2>Ask. Inspect. Decide.</h2><p>Retrieval is evidence-first: structured studio state plus authenticated knowledge search. Silence stays silence.</p></div><span className="status status-documented">sources required</span></section>
    <section className="evidence-legend" aria-label="Evidence states"><span className="status status-observed">Observed</span><span className="status status-user-live">User-reported live</span><span className="status status-documented">Documented</span><span className="status status-configured">Configured</span><span className="status status-planned">Planned</span><span className="status status-unknown">Unknown</span></section>
    <section className="card search-card"><form onSubmit={search} className="brain-search"><input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder='Ask about a device, sync method, control, or documented studio fact…' /><button className="primary" disabled={busy}>{busy ? "Searching…" : "Search evidence"}</button></form>{error && <div className="callout warn-callout">{error}</div>}{!busy && q && !error && results.length === 0 && <div className="callout">No supporting evidence found. No answer has been inferred.</div>}</section>
    {structured.length > 0 && <section className="card"><div className="section-head"><div><div className="eyebrow">STRUCTURED STATE</div><h3>{structured.length} direct matches</h3></div><span className="tag">database reads</span></div><div className="structured-list">{structured.map((m, i) => <div className="structured-row" key={`${m.type}-${m.title}-${i}`}><span className={`status status-${m.type}`}>{m.type}</span><div><strong>{m.title}</strong><p>{m.detail}</p></div></div>)}</div></section>}
    {results.length > 0 && <section className="card evidence-bundle"><div className="section-head"><div><div className="eyebrow">RETRIEVED EVIDENCE</div><h3>{results.length} chunks · {sources.length} sources</h3></div><span className="status status-documented">documented</span></div><div className="source-strip">{sources.map((s) => <span className="pill" key={s}>{s}</span>)}</div></section>}
    {results.map((r, i) => <article className="result" key={r.chunk_id}><div className="meta">#{i + 1} · {r.gear || "general"} · {r.document_title}{r.page_start ? ` · p${r.page_start}` : ""}{r.section ? ` · ${r.section}` : ""}</div><p>{r.content.length > 950 ? r.content.slice(0, 950) + "…" : r.content}</p>{typeof r.score === "number" && <div className="score">retrieval score {r.score.toFixed(4)}</div>}</article>)}
  </>;
}
