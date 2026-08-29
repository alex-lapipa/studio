"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatWhen, loadStudioState, type StudioState } from "../lib/studio";

const EMPTY: StudioState = {
  computers: [], software: [], plugins: [], endpoints: [],
  connections: [], observations: [], gear: [], documents: [],
};

function Status({ children, kind = "unknown" }: { children: React.ReactNode; kind?: string }) {
  return <span className={`status status-${kind}`}>{children}</span>;
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return <div className="metric"><b>{value}</b><span>{label}</span></div>;
}

export function StudioOverview({ client }: { client: SupabaseClient }) {
  const [state, setState] = useState<StudioState>(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudioState(client).then(setState).catch((e) => setError(String(e.message || e))).finally(() => setLoading(false));
  }, [client]);
  const latestObservation = useMemo(() => {
    return [...state.observations].sort((a, b) => String(b.observed_at).localeCompare(String(a.observed_at)))[0];
  }, [state.observations]);

  const defaultIn = state.endpoints.find((e) => e.is_default_input);
  const defaultOut = state.endpoints.find((e) => e.is_default_output);
  const rateSplit = defaultIn?.sample_rate_hz && defaultOut?.sample_rate_hz && defaultIn.sample_rate_hz !== defaultOut.sample_rate_hz;

  if (loading) return <div className="card"><p className="tag">Loading observed studio state…</p></div>;
  if (error) return <div className="card"><p className="err">Could not load studio state: {error}</p></div>;

  return <>
    <section className="hero-panel">
      <div>
        <div className="eyebrow">STUDIO SOURCE OF TRUTH</div>
        <h2>See the rig before you touch the rig.</h2>
        <p>Observed state is shown as fact. Planned or unknown routing stays separate until the studio is inspected.</p>
      </div>
      <Status kind="observed">last observation · {formatWhen(latestObservation?.observed_at)}</Status>
    </section>

    <div className="metrics">
      <Metric value={state.gear.length} label="gear records" />
      <Metric value={state.endpoints.length} label="observed endpoints" />
      <Metric value={state.connections.length} label="recorded routes" />
      <Metric value={state.documents.length} label="knowledge sources" />
    </div>
    <section className="card topology-card">
      <div className="section-head">
        <div><div className="eyebrow">LIVE TOPOLOGY</div><h3>Computer → endpoints → studio gear</h3></div>
        <Status kind={state.connections.length ? "configured" : "unknown"}>
          {state.connections.length ? `${state.connections.length} recorded routes` : "downstream routes unknown"}
        </Status>
      </div>
      <div className="topology-grid">
        <div className="topology-lane">
          <span className="lane-label">COMPUTERS</span>
          {state.computers.map((c) => <div className="node node-computer" key={c.id}>
            <strong>{c.name}</strong><span>{c.hardware_model}</span><small>{c.platform} {c.os_version}</small>
          </div>)}
        </div>
        <div className="topology-arrow">→</div>
        <div className="topology-lane">
          <span className="lane-label">OBSERVED ENDPOINTS</span>
          {state.endpoints.map((e) => <div className="node node-endpoint" key={e.id}>
            <strong>{e.name}</strong><span>{e.endpoint_type} · {e.transport}</span>
            <small>{e.sample_rate_hz ? `${Number(e.sample_rate_hz) / 1000} kHz` : e.direction || "observed"}</small>
          </div>)}
        </div>
        <div className="topology-arrow topology-unknown">{state.connections.length ? "→" : "?"}</div>
        <div className="topology-lane">
          <span className="lane-label">{state.connections.length ? "ROUTED GEAR" : "GEAR INVENTORY · ROUTES NOT MAPPED"}</span>
          {state.gear.slice(0, 8).map((g) => <div className="node node-gear" key={g.id}>
            <strong>{g.make} {g.model}</strong><span>{g.category}</span>
          </div>)}
          {state.gear.length > 8 && <small className="tag">+ {state.gear.length - 8} more in Rig</small>}
        </div>
      </div>
    </section>
    <div className="split-grid">
      <section className="card">
        <div className="section-head"><h3>Studio state</h3><Status kind="observed">observed</Status></div>
        {state.software.map((s) => <div className="state-row" key={s.id}>
          <span>{s.name}</span><b>{s.version || "version unknown"}</b>
        </div>)}
        {defaultIn && <div className="state-row"><span>Default input</span><b>{defaultIn.name} · {Number(defaultIn.sample_rate_hz) / 1000} kHz</b></div>}
        {defaultOut && <div className="state-row"><span>Default output</span><b>{defaultOut.name} · {Number(defaultOut.sample_rate_hz) / 1000} kHz</b></div>}
        {rateSplit && <div className="callout warn-callout">Input/output sample rates differ. Review before a critical recording session.</div>}
      </section>

      <section className="card">
        <div className="section-head"><h3>Evidence state</h3><Status kind="documented">documented</Status></div>
        <div className="state-row"><span>Documents</span><b>{state.documents.length} ingested</b></div>
        <div className="state-row"><span>Observations</span><b>{state.observations.length}</b></div>
        <div className="state-row"><span>Connections</span><b>{state.connections.length || "none observed"}</b></div>
        <div className="state-row"><span>Plugin records</span><b>{state.plugins.length || "inventory count only"}</b></div>
        <p className="note">Unknown physical routing is intentionally left blank rather than reconstructed from plans or manuals.</p>
      </section>
    </div>

    <section className="card">
      <div className="section-head"><h3>Recent observations</h3><span className="tag">newest first</span></div>
      <div className="observation-list">
        {[...state.observations].sort((a,b) => String(b.observed_at).localeCompare(String(a.observed_at))).slice(0,6).map((o) =>
          <div className="observation" key={o.id}>
            <Status kind={o.evidence_type === "live_observation" ? "observed" : "documented"}>{o.evidence_type}</Status>
            <div><strong>{o.fact_key.replaceAll("_", " ")}</strong><p>{o.source_ref || o.notes || "source recorded"}</p></div>
            <time>{formatWhen(o.observed_at)}</time>
          </div>)}
      </div>
    </section>
  </>;
}
