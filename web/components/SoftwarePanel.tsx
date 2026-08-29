"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStudioState, type StudioState } from "../lib/studio";

export function SoftwarePanel({ client }: { client: SupabaseClient }) {
  const [state, setState] = useState<StudioState | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => { loadStudioState(client).then(setState); }, [client]);

  const plugins = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    return state.plugins.filter((p) => !q || `${p.vendor} ${p.name} ${p.version} ${p.format}`.toLowerCase().includes(q));
  }, [state, query]);

  if (!state) return <div className="card"><p className="tag">Loading software state…</p></div>;
  const computer = state.computers[0];
  const formats = ["AU", "VST3", "VST2"].map((format) => ({ format, count: state.plugins.filter((p) => p.format === format).length }));

  return <>
    <section className="hero-panel">
      <div><div className="eyebrow">MAC & SOFTWARE</div><h2>{computer?.name || "Studio computer"}</h2>
      <p>{computer?.hardware_model || "Hardware model unknown"} · {computer?.platform} {computer?.os_version}</p></div>
    </section>

    <div className="split-grid">
      <section className="card">
        <h3>Core applications</h3>
        {state.software.map((s) => <div className="state-row" key={s.id}><span>{s.name}</span><b>{s.version || "unknown"}</b></div>)}
      </section>
      <section className="card">
        <h3>Plugin formats</h3>
        <div className="metrics compact-metrics">
          {formats.map((f) => <div className="metric" key={f.format}><b>{f.count}</b><span>{f.format}</span></div>)}
        </div>
        <p className="note">Installed bundle presence only; this does not imply DAW validation or compatibility.</p>
      </section>
    </div>

    <section className="card">
      <div className="section-head"><h3>Installed plugins</h3><span className="tag">{plugins.length} shown / {state.plugins.length} total</span></div>
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plugin, vendor or format…" />
      <div className="plugin-grid">
        {plugins.slice(0,80).map((p) => <div className="plugin-row" key={p.id}>
          <div><strong>{p.name}</strong><span>{p.vendor || "vendor unknown"}</span></div>
          <div><span className="pill">{p.format}</span><small>{p.version || "version unknown"}</small></div>
        </div>)}
      </div>
      {plugins.length > 80 && <p className="note">Showing the first 80 matching plugins. Narrow the filter to inspect the rest.</p>}
    </section>
  </>;
}
