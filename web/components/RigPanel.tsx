"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStudioState, type StudioState } from "../lib/studio";

export function RigPanel({ client }: { client: SupabaseClient }) {
  const [state, setState] = useState<StudioState | null>(null);
  const [filter, setFilter] = useState("");
  useEffect(() => { loadStudioState(client).then(setState); }, [client]);

  const gear = useMemo(() => {
    if (!state) return [];
    const q = filter.trim().toLowerCase();
    return state.gear.filter((g) => !q || `${g.make} ${g.model} ${g.category} ${g.role_in_studio}`.toLowerCase().includes(q));
  }, [state, filter]);

  if (!state) return <div className="card"><p className="tag">Loading rig…</p></div>;

  return <>
    <section className="hero-panel">
      <div><div className="eyebrow">THE RIG</div><h2>{state.gear.length} devices, one evidence-backed studio map.</h2>
      <p>Device capability comes from documentation; current connection state comes from observations and endpoints.</p></div>
    </section>
    <section className="card">
      <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter gear, role or category…" />
    </section>
    <div className="rig-grid">
      {gear.map((g) => {
        const docs = state.documents.filter((d) => d.gear_id === g.id);
        const obs = state.observations.filter((o) => o.entity_type === "gear" && o.entity_id === g.id);
        const endpoint = state.endpoints.find((e) => e.gear_id === g.id);
        return <article className="card rig-card" key={g.id}>
          <div className="rig-card-head">
            <div><span className="cat">{g.category}</span><h3>{g.make} {g.model}</h3></div>
            <span className={`status ${endpoint ? "status-observed" : "status-unknown"}`}>{endpoint ? "observed endpoint" : "connection unknown"}</span>
          </div>
          {g.role_in_studio && <p className="rig-role">{g.role_in_studio}</p>}
          <div className="rig-facts">
            <div><span>MIDI</span><b>{g.midi_channels || "not recorded"}</b></div>
            <div><span>Sync</span><b>{g.sync_capabilities || "not recorded"}</b></div>
            <div><span>Evidence</span><b>{docs.length} docs · {obs.length} observations</b></div>
          </div>
          {docs.length > 0 && <div className="source-strip">{docs.slice(0,3).map((d) => <span className="pill" key={d.id}>{d.title}</span>)}</div>}
        </article>;
      })}
    </div>
  </>;
}
