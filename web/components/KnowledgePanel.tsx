"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStudioState, type StudioState } from "../lib/studio";

export function KnowledgePanel({ client, url }: { client: SupabaseClient; url: string }) {
  const [state, setState] = useState<StudioState | null>(null); const [filter, setFilter] = useState(""); const [error, setError] = useState("");
  useEffect(() => { loadStudioState(client).then(setState).catch((e) => setError(String(e.message || e))); }, [client]);
  const docs = useMemo(() => { if (!state) return []; const q = filter.trim().toLowerCase(); return state.documents.filter((d) => !q || `${d.title} ${d.doc_type} ${d.status}`.toLowerCase().includes(q)); }, [state, filter]);
  if (error) return <div className="card"><p className="err">Could not load knowledge base: {error}</p></div>;
  if (!state) return <div className="card"><p className="tag">Loading knowledge base…</p></div>;
  const covered = new Set(state.documents.filter((d) => d.gear_id).map((d) => d.gear_id)); const uncovered = state.gear.filter((g) => !covered.has(g.id)); const types = [...new Set(state.documents.map((d) => d.doc_type || "unknown"))];
  async function openDoc(d: any) {
    setError(""); if (!d.source_bucket || !d.source_path) return;
    const session = (await client.auth.getSession()).data.session; if (!session?.access_token) { setError("Authenticated studio session required. Sign in again and retry."); return; }
    const r = await fetch(`${url}/functions/v1/kb`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "sign", bucket: d.source_bucket, paths: [d.source_path], expires_in: 600 }) });
    const j = await r.json(); if (!r.ok) { setError(j.error || `Could not open source (${r.status})`); return; } const signed = j.urls?.[0]?.signedUrl; if (signed) window.open(signed, "_blank", "noopener,noreferrer");
  }
  return <><section className="hero-panel"><div><div className="eyebrow">KNOWLEDGE SOURCES</div><h2>{state.documents.length} sources. Capability is not live state.</h2><p>Manuals and research document what equipment can do. Observations and accepted configuration describe the studio itself.</p></div><span className="status status-documented">documented</span></section><div className="metrics"><div className="metric"><b>{state.documents.length}</b><span>documents</span></div><div className="metric"><b>{covered.size}</b><span>gear with linked docs</span></div><div className="metric"><b>{uncovered.length}</b><span>linked-doc gaps</span></div><div className="metric"><b>{types.length}</b><span>document types</span></div></div>{error && <div className="callout warn-callout">{error}</div>}{uncovered.length > 0 && <section className="card"><div className="section-head"><h3>Coverage gaps</h3><span className="tag">not proof that no source exists</span></div><div className="source-strip">{uncovered.map((g) => <span className="pill" key={g.id}>{g.make} {g.model}</span>)}</div></section>}<section className="card"><div className="section-head"><h3>Sources</h3><span className="tag">{docs.length} shown</span></div><input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter source title or type…" /><div className="knowledge-list">{docs.map((d) => { const gear = state.gear.find((g) => g.id === d.gear_id); return <div className="knowledge-row" key={d.id}><div><strong>{d.title}</strong><span>{gear ? `${gear.make} ${gear.model}` : "general / multi-device"}</span></div><div className="knowledge-meta"><span className="pill">{d.doc_type || "unknown"}</span><span>{d.pages ? `${d.pages} pp` : "pages n/a"}</span><span>{d.status || "status n/a"}</span></div><div>{d.source_bucket ? <button className="ghost" onClick={() => openDoc(d)}>open source</button> : <span className="tag">repo / research</span>}</div></div>; })}</div></section></>;
}
