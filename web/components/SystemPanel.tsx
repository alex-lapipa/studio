"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStudioState, type StudioState } from "../lib/studio";

export function SystemPanel({ client }: { client: SupabaseClient }) {
  const [state, setState] = useState<StudioState | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { loadStudioState(client).then(setState).catch((e) => setError(String(e.message || e))); }, [client]);
  if (error) return <div className="card"><p className="err">System state unavailable: {error}</p></div>;
  if (!state) return <div className="card"><p className="tag">Loading system state…</p></div>;

  const deployed = process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "unknown";
  const ref = process.env.NEXT_PUBLIC_GIT_REF || "unknown";
  const sha = (process.env.NEXT_PUBLIC_GIT_SHA || "unknown").slice(0, 8);

  return <>
    <section className="hero-panel"><div><div className="eyebrow">SYSTEM</div><h2>Know exactly what version of the studio brain you are looking at.</h2></div></section>
    <div className="split-grid">
      <section className="card"><h3>Deployment</h3>
        <div className="state-row"><span>Git ref</span><b>{ref}</b></div>
        <div className="state-row"><span>Git commit</span><b>{sha}</b></div>
        <div className="state-row"><span>Vercel deployment</span><b>{deployed}</b></div>
      </section>
      <section className="card"><h3>Knowledge state</h3>
        <div className="state-row"><span>Gear</span><b>{state.gear.length}</b></div>
        <div className="state-row"><span>Documents</span><b>{state.documents.length}</b></div>
        <div className="state-row"><span>Observed endpoints</span><b>{state.endpoints.length}</b></div>
        <div className="state-row"><span>Recorded connections</span><b>{state.connections.length}</b></div>
        <div className="state-row"><span>Observations</span><b>{state.observations.length}</b></div>
        <div className="state-row"><span>Document graph edges</span><b>{state.document_entities.length}</b></div>
      </section>
    </div>
    <section className="card">
      <h3>Retrieval baseline</h3>
      <div className="metrics">
        <div className="metric"><b>13/15</b><span>expected-source recall@8</span></div>
        <div className="metric"><b>836</b><span>verified chunks</span></div>
        <div className="metric"><b>0</b><span>null vectors / FTS</span></div>
        <div className="metric"><b>73</b><span>legacy oversized chunks</span></div>
      </div>
      <p className="note">Benchmark and corpus figures are the last verified 2026-08-27 baseline; deployment identity above is generated at build time.</p>
    </section>
  </>;
}
