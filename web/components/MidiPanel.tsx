"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStudioState, type StudioState } from "../lib/studio";

export function MidiPanel({ client }: { client: SupabaseClient }) {
  const [state, setState] = useState<StudioState | null>(null);
  const [access, setAccess] = useState<any>(null);
  const [outs, setOuts] = useState<any[]>([]);
  const [outId, setOutId] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [bpm, setBpm] = useState(130);
  const [running, setRunning] = useState(false);
  const clockRef = useRef<any>(null);

  useEffect(() => { loadStudioState(client).then(setState); }, [client]);
  const plans = useMemo(() => (state?.gear || []).map((g) => {
    const m = String(g.midi_channels || "").match(/ch\s*(\d+)\s*\(plan/i);
    return m ? { ...g, plannedChannel: Number(m[1]) } : null;
  }).filter(Boolean) as any[], [state]);

  function addLog(s: string) { setLog((l) => [s, ...l].slice(0, 12)); }
  function out() { return outs.find((p) => p.id === outId); }

  async function connect() {
    try {
      const a = await (navigator as any).requestMIDIAccess({ sysex: false });
      setAccess(a);
      const ports = [...a.outputs.values()];
      setOuts(ports);
      const mrcc = ports.find((p: any) => /mrcc/i.test(p.name));
      setOutId(mrcc?.id || ports[0]?.id || "");
      addLog(`connected · ${ports.length} MIDI outputs${mrcc ? ` · MRCC: ${mrcc.name}` : ""}`);
      a.onstatechange = () => setOuts([...a.outputs.values()]);
    } catch (e: any) { addLog(`WebMIDI unavailable: ${e.message || e}`); }
  }

  function note(ch: number, n = 48, vel = 100) {
    const p = out(); if (!p) return addLog("no MIDI output selected");
    p.send([0x90 + ch - 1, n, vel]);
    setTimeout(() => p.send([0x80 + ch - 1, n, 0]), 180);
    addLog(`test note · ch${ch} · note ${n}`);
  }

  function panic() {
    const p = out(); if (!p) return;
    for (let ch = 0; ch < 16; ch++) { p.send([0xb0 + ch, 123, 0]); p.send([0xb0 + ch, 120, 0]); }
    addLog("panic · all notes off");
  }

  function toggleClock() {
    const p = out(); if (!p) return addLog("no MIDI output selected");
    if (running) { clearInterval(clockRef.current); p.send([0xfc]); setRunning(false); addLog("clock stop"); return; }
    p.send([0xfa]);
    clockRef.current = setInterval(() => p.send([0xf8]), 60000 / (bpm * 24));
    setRunning(true); addLog(`clock start · ${bpm} BPM · 24 PPQN`);
  }
  return <>
    <section className="hero-panel">
      <div><div className="eyebrow">MIDI CONSOLE</div><h2>Test the routing plan without pretending it is observed.</h2>
      <p>Planned channel tests come from structured gear state. Live cable routing stays unknown until observed.</p></div>
      <span className={`status ${state?.connections.length ? "status-configured" : "status-unknown"}`}>
        {state?.connections.length ? `${state.connections.length} recorded routes` : "physical routes unknown"}
      </span>
    </section>

    <section className="card">
      <div className="section-head"><h3>WebMIDI connection</h3><span className="tag">browser → selected MIDI output</span></div>
      <div className="row">
        {!access && <button className="primary" onClick={connect}>Connect MIDI</button>}
        {access && <select value={outId} onChange={(e) => setOutId(e.target.value)} className="select-control">
          {outs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>}
        <button className="danger" onClick={panic}>PANIC</button>
      </div>
      <div className="midi-log">{log.map((l, i) => <div className="mono" key={`${l}-${i}`} style={{opacity: i ? .5 : 1}}>{l}</div>)}</div>
    </section>
    <section className="card">
      <div className="section-head"><h3>Planned channel tests</h3><span className="status status-configured">plan, not observation</span></div>
      <div className="row">
        {plans.map((g) => <button className="ghost" key={g.id} onClick={() => note(g.plannedChannel)}>
          {g.make} {g.model} <span className="tag">ch{g.plannedChannel}</span>
        </button>)}
      </div>
      <p className="note">These buttons send a single test note using channels explicitly marked “plan” in the gear table. They do not prove MRCC downstream routing.</p>
    </section>

    <section className="card">
      <div className="section-head"><h3>Master MIDI clock</h3><span className="status status-configured">manual control</span></div>
      <div className="row">
        <input className="bpm" type="number" min={60} max={180} value={bpm} disabled={running}
          onChange={(e) => setBpm(Number(e.target.value || 130))} />
        <span className="tag">BPM</span>
        <button className={running ? "danger" : "primary"} onClick={toggleClock}>{running ? "STOP" : "START"} clock</button>
      </div>
      <p className="note">Sends MIDI Start/Stop and 24 PPQN clock to the selected browser MIDI output. Route selection still happens in the MRCC/DAW.</p>
    </section>
  </>;
}
