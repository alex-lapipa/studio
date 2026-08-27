"use client";

import { useEffect, useRef, useState } from "react";
import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";
import { StudioOverview } from "../components/StudioOverview";
import { SystemPanel } from "../components/SystemPanel";

// Anon key is public-by-design (shipped in every client bundle); RLS + password gate protect the data.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://klbzvbwudekstddlgnjy.supabase.co";
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsYnp2Ynd1ZGVrc3RkZGxnbmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MTA5NTksImV4cCI6MjEwMDQ4Njk1OX0.RMmiWyiYA0f26JIcK8VgfD_gdJNesjC2UH3ero4TrEY";

const STUDIO_LOGIN_EMAIL = "alex@rmtv.io"; // fixed studio account; password is the shared gate

let _sb: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!_sb) _sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

// ——— Studio channel plan (mirrors the KB gear table; MRCC routes deliver these) ———
const DEVICES = [
  { name: "Tanzbär drums", ch: 3, note: 36, hint: "BD1=36 BD2=37 SD=38 … MA=49 (fixed ch 3)" },
  { name: "Tanzbär CV1 (lead)", ch: 1, note: 48, hint: "fixed ch 1" },
  { name: "Tanzbär CV2 (bass)", ch: 2, note: 36, hint: "fixed ch 2" },
  { name: "MAM MB33", ch: 4, note: 36, hint: "ch 4 · velocity ≥120 = accent" },
  { name: "Subsequent 37", ch: 5, note: 48, hint: "ch 5 (plan)" },
  { name: "Mother-32", ch: 6, note: 48, hint: "ch 6 (plan)" },
  { name: "Subharmonicon", ch: 7, note: 48, hint: "ch 7 (plan)" },
  { name: "TD-3-MO", ch: 9, note: 36, hint: "ch 9 (plan) · CC74 = cutoff" },
];

const TANZBAR_CCS = [
  { name: "BD1 Decay", cc: 64 }, { name: "BD1 Tune", cc: 3 }, { name: "BD1 Distortion", cc: 6 },
  { name: "SD Snappy", cc: 13 }, { name: "SD Tune", cc: 11 }, { name: "CY Decay", cc: 70 },
  { name: "OH Decay", cc: 72 }, { name: "HH Decay", cc: 74 },
];

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    sb().auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = sb().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="shell"><p className="tag">loading…</p></div>;
  if (!session) return <Login />;
  return <Studio />;
}

function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await sb().auth.signInWithPassword({ email: STUDIO_LOGIN_EMAIL, password: pw });
    if (error) setErr("Wrong password.");
    setBusy(false);
  }
  return (
    <div className="login-box">
      <h1 className="logo" style={{ marginBottom: 18 }}>ANTAINE<span>·</span>STUDIO</h1>
      <form onSubmit={go} className="card">
        <h3>Studio password</h3>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus placeholder="••••••••••" />
        <div style={{ marginTop: 12 }} className="row">
          <button className="primary" disabled={busy}>{busy ? "…" : "Enter studio"}</button>
          {err && <span className="err">{err}</span>}
        </div>
        <p className="note">Private corpus — purchased manuals inside. One shared password.</p>
      </form>
    </div>
  );
}

function Studio() {
  const [tab, setTab] = useState<"overview" | "brain" | "midi" | "docs" | "system">("overview");
  return (
    <div className="shell">
      <header className="top">
        <h1 className="logo">ANTAINE<span>·</span>STUDIO</h1>
        <span className="tag">MRCC-centred · KB {new Date().getFullYear()} · <a style={{cursor:"pointer"}} onClick={() => sb().auth.signOut()}>log out</a></span>
      </header>
      <nav className="tabs">
        <button className={tab === "overview" ? "on" : ""} onClick={() => setTab("overview")}>Studio Overview</button>
        <button className={tab === "brain" ? "on" : ""} onClick={() => setTab("brain")}>Studio Brain</button>
        <button className={tab === "midi" ? "on" : ""} onClick={() => setTab("midi")}>MIDI Console</button>
        <button className={tab === "docs" ? "on" : ""} onClick={() => setTab("docs")}>Docs</button>
        <button className={tab === "system" ? "on" : ""} onClick={() => setTab("system")}>System</button>
      </nav>
      {tab === "overview" && <StudioOverview client={sb()} />}
      {tab === "brain" && <Brain />}
      {tab === "midi" && <MidiConsole />}
      {tab === "docs" && <Docs />}
      {tab === "system" && <SystemPanel client={sb()} />}
    </div>
  );
}

// ————————————————— STUDIO BRAIN —————————————————
function Brain() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [gear, setGear] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb().from("gear").select("*").order("make").then(({ data }) => setGear(data || []));
  }, []);

  async function search(e: React.FormEvent) {
    e.preventDefault(); if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/kb`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPABASE_ANON}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", query: q, match_count: 8 }),
      });
      const j = await r.json();
      setResults(j.results || []);
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="card">
        <h3>Ask the corpus — evidence from manuals, research and studio state</h3>
        <form onSubmit={search} className="row">
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder='e.g. "sync DFAM to Mother-32" · "Tanzbär CC channel" · "TD-3-MO accent velocity"' style={{ flex: 1 }} />
          <button className="primary" disabled={busy}>{busy ? "…" : "Search"}</button>
        </form>
        <div style={{ marginTop: 14 }}>
          {results.map((r) => (
            <div className="result" key={r.chunk_id}>
              <div className="meta">{r.gear} · {r.document_title}{r.page_start ? ` · p${r.page_start}` : ""}{r.section ? ` · ${r.section}` : ""}</div>
              <p>{r.content.length > 700 ? r.content.slice(0, 700) + "…" : r.content}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>The rig — {gear.length} instruments</h3>
        <div className="grid">
          {gear.map((g) => (
            <div className="card gear-card" key={g.id} style={{ margin: 0 }}>
              <span className="cat">{g.category}</span>
              <h4>{g.make} {g.model}</h4>
              {g.role_in_studio && <div className="field"><b>Role:</b> {g.role_in_studio}</div>}
              {g.midi_channels && <div className="field"><b>MIDI:</b> {g.midi_channels}</div>}
              {g.sync_capabilities && <div className="field"><b>Sync:</b> {g.sync_capabilities}</div>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ————————————————— MIDI CONSOLE —————————————————
function MidiConsole() {
  const [access, setAccess] = useState<any>(null);
  const [outs, setOuts] = useState<any[]>([]);
  const [outId, setOutId] = useState<string>("");
  const [log, setLog] = useState<string[]>([]);
  const [bpm, setBpm] = useState(130);
  const clockRef = useRef<any>(null);
  const [running, setRunning] = useState(false);

  function addLog(s: string) { setLog((l) => [s, ...l].slice(0, 12)); }

  async function connect() {
    try {
      const a = await (navigator as any).requestMIDIAccess({ sysex: false });
      setAccess(a);
      const o = [...a.outputs.values()];
      setOuts(o);
      const mrcc = o.find((p: any) => /mrcc/i.test(p.name));
      setOutId(mrcc ? mrcc.id : o[0]?.id || "");
      addLog(`connected — ${o.length} output port(s)${mrcc ? " · MRCC detected: " + mrcc.name : ""}`);
      a.onstatechange = () => { const oo = [...a.outputs.values()]; setOuts(oo); };
    } catch (e: any) {
      addLog("WebMIDI refused: " + e.message + " (Chrome only; click Allow)");
    }
  }

  function out(): any { return outs.find((p) => p.id === outId); }

  function noteOn(ch: number, note: number, vel = 100, ms = 180) {
    const p = out(); if (!p) return addLog("no output port");
    p.send([0x90 + (ch - 1), note, vel]);
    setTimeout(() => p.send([0x80 + (ch - 1), note, 0]), ms);
  }
  function cc(ch: number, ccNum: number, val: number) {
    const p = out(); if (!p) return;
    p.send([0xb0 + (ch - 1), ccNum, val]);
  }
  function panic() {
    const p = out(); if (!p) return;
    for (let ch = 0; ch < 16; ch++) { p.send([0xb0 + ch, 123, 0]); p.send([0xb0 + ch, 120, 0]); }
    addLog("panic — all notes off, all channels");
  }
  function toggleClock() {
    const p = out(); if (!p) return;
    if (running) {
      clearInterval(clockRef.current); p.send([0xfc]); setRunning(false); addLog("clock stop (FC)");
    } else {
      p.send([0xfa]);
      const interval = 60000 / (bpm * 24);
      clockRef.current = setInterval(() => p.send([0xf8]), interval);
      setRunning(true); addLog(`clock start (FA) @ ${bpm} BPM — 24 PPQN`);
    }
  }

  return (
    <>
      <div className="card">
        <h3>Connection — Mac → MRCC PC port (WebMIDI, Chrome)</h3>
        <div className="row">
          {!access && <button className="primary" onClick={connect}>Connect to MIDI</button>}
          {access && (
            <select value={outId} onChange={(e) => setOutId(e.target.value)}
              style={{ background: "var(--panel2)", color: "var(--text)", border: "1px solid var(--border)", padding: 9, borderRadius: 8 }}>
              {outs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <button className="danger" onClick={panic}>MIDI PANIC</button>
        </div>
        <div style={{ marginTop: 10 }}>
          {log.map((l, i) => <div key={i} className="mono" style={{ opacity: i === 0 ? 1 : 0.5 }}>{l}</div>)}
        </div>
      </div>

      <div className="card">
        <h3>Test notes — per the studio channel plan</h3>
        <div className="row">
          {DEVICES.map((d) => (
            <button key={d.name} className="ghost" title={d.hint}
              onClick={() => { noteOn(d.ch, d.note, d.ch === 4 ? 127 : 100); }}>
              {d.name} <span className="tag">ch{d.ch}</span>
            </button>
          ))}
        </div>
        <p className="note">MB33 fires at velocity 127 = accent test. Tanzbär drums: BD1 on note 36, ch 3. DFAM has no MIDI — clock it from the Mother-32 ASSIGN out.</p>
      </div>

      <div className="card">
        <h3>Tanzbär sound CCs — sent on ch 10 (MIDI In 1 only)</h3>
        {TANZBAR_CCS.map((t) => (
          <SliderCC key={t.cc} label={`${t.name} (CC${t.cc})`} onChange={(v) => cc(10, t.cc, v)} />
        ))}
        <h3 style={{ marginTop: 16 }}>TD-3-MO — the only CC it has</h3>
        <SliderCC label="Cutoff (CC74, ch 9)" onChange={(v) => cc(9, 74, v)} />
      </div>

      <div className="card">
        <h3>Master clock</h3>
        <div className="row">
          <input className="bpm" type="number" min={60} max={180} value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value || "130"))} disabled={running} />
          <span className="tag">BPM</span>
          <button className={running ? "danger" : "primary"} onClick={toggleClock}>
            {running ? "STOP" : "START"} clock
          </button>
        </div>
        <p className="note">Sends MIDI Start/Stop + 24 PPQN clock to the selected port. Route it in the MRCC's clock page to the devices that should follow. Browser timing is good enough for jamming; for recording, clock from Bitwig/Logic or the Electribe.</p>
      </div>
    </>
  );
}

function SliderCC({ label, onChange }: { label: string; onChange: (v: number) => void }) {
  const [v, setV] = useState(64);
  return (
    <div className="slider-row">
      <span>{label}</span>
      <input type="range" min={0} max={127} value={v}
        onChange={(e) => { const n = parseInt(e.target.value); setV(n); onChange(n); }} />
      <span className="mono">{v}</span>
    </div>
  );
}

// ————————————————— DOCS —————————————————
function Docs() {
  const [docs, setDocs] = useState<any[]>([]);
  useEffect(() => {
    sb().from("documents").select("*, gear(make, model)").order("doc_type").then(({ data }) => setDocs(data || []));
  }, []);

  async function open(d: any) {
    if (!d.source_bucket) return;
    const r = await fetch(`${SUPABASE_URL}/functions/v1/kb`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPABASE_ANON}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sign", bucket: d.source_bucket, paths: [d.source_path], expires_in: 600 }),
    });
    const j = await r.json();
    const url = j.urls?.[0]?.signedUrl;
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="card">
      <h3>Corpus — {docs.length} documents</h3>
      <table className="docs">
        <thead><tr><th>Title</th><th>Type</th><th>Gear</th><th>Pages</th><th></th></tr></thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td><span className="pill">{d.doc_type}</span></td>
              <td className="tag">{d.gear ? `${d.gear.make} ${d.gear.model}` : "multi"}</td>
              <td className="tag">{d.pages || "—"}</td>
              <td>{d.source_bucket ? <button className="ghost" onClick={() => open(d)}>open PDF</button> : <span className="tag">research</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
