"use client";

import { useEffect, useState } from "react";
import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";
import { StudioOverview } from "../components/StudioOverview";
import { SystemPanel } from "../components/SystemPanel";
import { RigPanel } from "../components/RigPanel";
import { EvidenceBrain } from "../components/EvidenceBrain";
import { SoftwarePanel } from "../components/SoftwarePanel";
import { KnowledgePanel } from "../components/KnowledgePanel";
import { MidiPanel } from "../components/MidiPanel";

// Supabase anon keys are public client configuration; RLS and authenticated sessions protect studio data.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://klbzvbwudekstddlgnjy.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsYnp2Ynd1ZGVrc3RkZGxnbmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MTA5NTksImV4cCI6MjEwMDQ4Njk1OX0.RMmiWyiYA0f26JIcK8VgfD_gdJNesjC2UH3ero4TrEY";
const STUDIO_LOGIN_EMAIL = process.env.NEXT_PUBLIC_STUDIO_LOGIN_EMAIL || "alex@rmtv.io";

let _sb: SupabaseClient | null = null;
function sb(): SupabaseClient { if (!_sb) _sb = createClient(SUPABASE_URL, SUPABASE_ANON); return _sb; }
export default function Page() {
  const [session, setSession] = useState<Session | null>(null); const [ready, setReady] = useState(false);
  useEffect(() => { sb().auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); }); const { data: sub } = sb().auth.onAuthStateChange((_e, s) => setSession(s)); return () => sub.subscription.unsubscribe(); }, []);
  if (!ready) return <div className="shell"><p className="tag">loading…</p></div>; if (!session) return <Login />; return <Studio session={session} />;
}
function Login() {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr(""); const { error } = await sb().auth.signInWithPassword({ email: STUDIO_LOGIN_EMAIL, password: pw }); if (error) setErr("Studio access denied."); setBusy(false); }
  return <div className="login-box"><h1 className="logo" style={{ marginBottom: 18 }}>ANTAINE<span>·</span>STUDIO</h1><form onSubmit={go} className="card"><div className="eyebrow">PRIVATE STUDIO SYSTEM</div><h3>Authenticated access</h3><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus placeholder="Studio password" /><div style={{ marginTop: 12 }} className="row"><button className="primary" disabled={busy}>{busy ? "…" : "Enter studio"}</button>{err && <span className="err">{err}</span>}</div><p className="note">Private evidence corpus. Hardware control remains outside the production browser.</p></form></div>;
}
type Mode = "studio" | "brain" | "system"; type View = "overview" | "rig" | "brain" | "docs" | "software" | "midi" | "system";
const MODE_VIEWS: Record<Mode, Array<{ id: View; label: string }>> = { studio: [{ id: "overview", label: "Cockpit" }, { id: "rig", label: "Rig" }], brain: [{ id: "brain", label: "Ask" }, { id: "docs", label: "Sources" }], system: [{ id: "software", label: "Mac & Software" }, { id: "midi", label: "MIDI State" }, { id: "system", label: "Diagnostics" }] };
function Studio({ session }: { session: Session }) {
  const [mode, setMode] = useState<Mode>("studio"); const [view, setView] = useState<View>("overview"); function chooseMode(next: Mode) { setMode(next); setView(MODE_VIEWS[next][0].id); }
  return <div className="shell"><header className="top"><div><h1 className="logo">ANTAINE<span>·</span>STUDIO</h1><p className="header-sub">Evidence-backed operating view for the physical studio.</p></div><div className="session-block"><span className="status status-observed">authenticated</span><button className="link-button" onClick={() => sb().auth.signOut()}>log out</button></div></header><nav className="mode-nav" aria-label="Studio modes">{(["studio", "brain", "system"] as Mode[]).map((m) => <button key={m} className={mode === m ? "on" : ""} onClick={() => chooseMode(m)}>{m}</button>)}</nav><div className="workspace-bar"><nav className="view-nav" aria-label={`${mode} views`}>{MODE_VIEWS[mode].map((item) => <button key={item.id} className={view === item.id ? "on" : ""} onClick={() => setView(item.id)}>{item.label}</button>)}</nav><div className="health-strip"><span><i className="health-dot" /> session live</span><span>browser control · read-only</span><span>{session.user.email ? "identity verified" : "session verified"}</span></div></div>{view === "overview" && <StudioOverview client={sb()} />}{view === "rig" && <RigPanel client={sb()} />}{view === "brain" && <EvidenceBrain client={sb()} url={SUPABASE_URL} />}{view === "docs" && <KnowledgePanel client={sb()} url={SUPABASE_URL} />}{view === "software" && <SoftwarePanel client={sb()} />}{view === "midi" && <MidiPanel client={sb()} />}{view === "system" && <SystemPanel client={sb()} />}</div>;
}
