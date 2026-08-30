"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStudioState, type StudioState } from "../lib/studio";

export function MidiPanel({ client }: { client: SupabaseClient }) {
  const [state, setState] = useState<StudioState | null>(null);
  useEffect(() => { loadStudioState(client).then(setState); }, [client]);
  const plans = useMemo(() => (state?.gear || []).filter((g) => /plan/i.test(String(g.midi_channels || ""))), [state]);
  if (!state) return <div className="card"><p className="tag">Loading MIDI state…</p></div>;
  return <>
    <section className="hero-panel">
      <div><div className="eyebrow">MIDI STATE</div><h2>Routing evidence without browser-side transmission.</h2>
      <p>This production surface is read-only. It shows recorded endpoints, observations and plans; it does not send notes, clock, CC or SysEx.</p></div>
      <span className={`status ${state.connections.length ? "status-configured" : "status-unknown"}`}>
        {state.connections.length ? `${state.connections.length} recorded routes` : "physical routes unknown"}
      </span>
    </section>
    <div className="split-grid">
      <section className="card"><h3>Observed MIDI endpoints</h3>
        {state.endpoints.filter((e) => e.endpoint_type === "midi").map((e) => <div className="state-row" key={e.id}><span>{e.name}</span><b>{e.direction || "direction unknown"}</b></div>)}
        {!state.endpoints.some((e) => e.endpoint_type === "midi") && <p className="note">No MIDI endpoint is currently recorded in the database.</p>}
      </section>
      <section className="card"><h3>Planned channel notes</h3>
        {plans.map((g) => <div className="state-row" key={g.id}><span>{g.make} {g.model}</span><b>{g.midi_channels}</b></div>)}
        {!plans.length && <p className="note">No channel plans are recorded.</p>}
      </section>
    </div>
    <section className="card"><h3>Safety boundary</h3><p className="note">Hardware transmission belongs in an explicitly selected local studio workflow after the downstream route is observed. The deployed web UI intentionally has no WebMIDI send path.</p></section>
  </>;
}
