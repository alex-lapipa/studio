"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStudioState, type StudioState } from "../lib/studio";

type Hit = {
  chunk_id: number; document_id: string; document_title: string;
  doc_type?: string; gear?: string; section?: string; page_start?: number;
  content: string; score?: number;
};

export function EvidenceBrain({ client, url, anon }: { client: SupabaseClient; url: string; anon: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<StudioState | null>(null);
  useEffect(() => { loadStudioState(client).then(setState).catch(() => undefined); }, [client]);

  const sources = useMemo(() => [...new Set(results.map((r) => r.document_title))], [results]);

  const structured = useMemo(() => {
    if (!state || !q.trim()) return [];
    const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const rows: Array<{type:string; title:string; detail:string}> = [];
    const add = (type:string, title:string, detail:string) => {
      const hay = `${title} ${detail}`.toLowerCase();
      if (terms.some((t) => hay.includes(t))) rows.push({ type, title, detail });
    };
    state.gear.forEach((g) => add("gear", `${g.make} ${g.model}`, `${g.role_in_studio || ""} ${g.midi_channels || ""} ${g.sync_capabilities || ""}`));
    state.software.forEach((s) => add("software", s.name, `${s.version || ""} ${s.category || ""}`));
    state.plugins.forEach((p) => add("plugin", p.name, `${p.vendor || ""} ${p.version || ""} ${p.format || ""}`));
    state.endpoints.forEach((e) => add("endpoint", e.name, `${e.endpoint_type || ""} ${e.transport || ""} ${e.sample_rate_hz || ""}`));
    state.observations.forEach((o) => add("observation", o.fact_key, `${o.source_ref || ""} ${JSON.stringify(o.fact_value || {})}`));
    return rows.slice(0, 12);
  }, [state, q]);

  async function search(e: React.FormEvent) {
    e.preventDefault(); if (!q.trim()) return;
    setBusy(true); setError("");
    try {
      const r = await fetch(`${url}/functions/v1/kb`, {
        method: "POST",
        headers: { Authorization: `Bearer ${(await client.auth.getSession()).data.session?.access_token || anon}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", query: q, match_count: 10 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `Search failed (${r.status})`);
      setResults(j.results || []);
    } catch (e: any) {
      setResults([]); setError(String(e.message || e));
    } finally { setBusy(false); }
  }

  return <>
    <section className="hero-panel">
      <div><div className="eyebrow">STUDIO BRAIN</div><h2>Ask the studio, then inspect the evidence.</h2>
      <p>The current engine retrieves hybrid semantic + keyword evidence. It does not invent an answer when the corpus is silent.</p></div>
    </section>

    <section className="card">
      <form onSubmit={search} className="row">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder='e.g. "How do I sync DFAM to Mother-32?"' style={{ flex: 1 }} />
        <button className="primary" disabled={busy}>{busy ? "Searching…" : "Search evidence"}</button>
      </form>
      {error && <div className="callout warn-callout">{error}</div>}
      {!busy && q && !error && results.length === 0 && <div className="callout">No supporting evidence found for this query.</div>}
    </section>
    {structured.length > 0 && <section className="card">
      <div className="section-head"><div><div className="eyebrow">STRUCTURED STATE</div><h3>{structured.length} direct matches</h3></div><span className="tag">live tables</span></div>
      <div className="structured-list">{structured.map((m, i) => <div className="structured-row" key={`${m.type}-${m.title}-${i}`}><span className="pill">{m.type}</span><div><strong>{m.title}</strong><p>{m.detail}</p></div></div>)}</div>
    </section>}

    {results.length > 0 && <section className="card">
      <div className="section-head">
        <div><div className="eyebrow">EVIDENCE BUNDLE</div><h3>{results.length} chunks from {sources.length} sources</h3></div>
        <span className="tag">query: {q}</span>
      </div>
      <div className="source-strip">{sources.map((s) => <span className="pill" key={s}>{s}</span>)}</div>
    </section>}

    {results.map((r, i) => <article className="result" key={r.chunk_id}>
      <div className="meta">#{i + 1} · {r.gear || "general"} · {r.document_title}{r.page_start ? ` · p${r.page_start}` : ""}{r.section ? ` · ${r.section}` : ""}</div>
      <p>{r.content.length > 950 ? r.content.slice(0, 950) + "…" : r.content}</p>
      {typeof r.score === "number" && <div className="score">retrieval score {r.score.toFixed(4)}</div>}
    </article>)}
  </>;
}
