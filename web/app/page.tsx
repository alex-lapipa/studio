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
  const [tab, setTab] = useState<"overview" | "rig" | "software" | "brain" | "midi" | "docs" | "system">("overview");
  return (
    <div className="shell">
      <header className="top">
        <h1 className="logo">ANTAINE<span>·</span>STUDIO</h1>
        <span className="tag">MRCC-centred · KB {new Date().getFullYear()} · <a style={{cursor:"pointer"}} onClick={() => sb().auth.signOut()}>log out</a></span>
      </header>
      <nav className="tabs">
        <button className={tab === "overview" ? "on" : ""} onClick={() => setTab("overview")}>Studio Overview</button>
        <button className={tab === "rig" ? "on" : ""} onClick={() => setTab("rig")}>Rig</button>
        <button className={tab === "software" ? "on" : ""} onClick={() => setTab("software")}>Mac & Software</button>
        <button className={tab === "brain" ? "on" : ""} onClick={() => setTab("brain")}>Studio Brain</button>
        <button className={tab === "midi" ? "on" : ""} onClick={() => setTab("midi")}>MIDI Console</button>
        <button className={tab === "docs" ? "on" : ""} onClick={() => setTab("docs")}>Docs</button>
        <button className={tab === "system" ? "on" : ""} onClick={() => setTab("system")}>System</button>
      </nav>
      {tab === "overview" && <StudioOverview client={sb()} />}
      {tab === "rig" && <RigPanel client={sb()} />}
      {tab === "software" && <SoftwarePanel client={sb()} />}
      {tab === "brain" && <EvidenceBrain client={sb()} url={SUPABASE_URL} anon={SUPABASE_ANON} />}
      {tab === "midi" && <MidiPanel client={sb()} />}
      {tab === "docs" && <KnowledgePanel client={sb()} url={SUPABASE_URL} anon={SUPABASE_ANON} />}
      {tab === "system" && <SystemPanel client={sb()} />}
    </div>
  );
}
