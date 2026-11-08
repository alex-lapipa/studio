"use client";

import {useCallback,useEffect,useState} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";

type Project={slug:string;display_name:string;enabled:boolean};
type Reference={entity_type:string;entity_id:string;notes:string};
type Track={id:string;title?:string|null;artists?:string[]};
type Playlist={playlist:{id:string;name:string|null};tracks:Track[];count:number;nextCursor:string|null;hasMore:boolean};
type TidalStatus={connected:boolean;readOnly:boolean;accountListingComplete:boolean};
type YouTubeStatus={connected:boolean;clientConfigured:boolean;channelId:string;publishingRequiresApprovedPlan:boolean};

export function MusicPanel({client}:{client:SupabaseClient}){
 const [projects,setProjects]=useState<Project[]>([]);
 const [project,setProject]=useState("studio");
 const [references,setReferences]=useState<Reference[]>([]);
 const [tidal,setTidal]=useState<TidalStatus|null>(null);
 const [youtube,setYoutube]=useState<YouTubeStatus|null>(null);
 const [input,setInput]=useState("");
 const [playlist,setPlaylist]=useState<Playlist|null>(null);
 const [loadedInput,setLoadedInput]=useState("");
 const [offset,setOffset]=useState(0);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const call=useCallback(async(payload:Record<string,unknown>,signal?:AbortSignal)=>{
  const {data,error:problem}=await client.functions.invoke("music-hub",{body:payload,signal});
  if(problem)throw new Error("Music service request failed. Refresh your session and try again.");
  if(data?.error)throw new Error(String(data.error));
  return data;
 },[client]);
 useEffect(()=>{
  let active=true;
  client.from("music_projects").select("slug,display_name,enabled").order("display_name").then(({data,error:problem})=>{
   if(!active)return;
   if(problem)setError("Could not load your music projects.");else setProjects((data||[]) as Project[]);
  });
  return()=>{active=false;};
 },[client]);
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  setLoading(true);setError("");setPlaylist(null);setLoadedInput("");setInput("");setOffset(0);setTidal(null);setReferences([]);setYoutube(null);
  Promise.allSettled([
   call({provider:"tidal",action:"status",project},controller.signal),
   call({provider:"tidal",action:"references",project},controller.signal),
   call({provider:"youtube",action:"status"},controller.signal),
  ]).then(results=>{
   if(!active)return;
   const [status,refs,video]=results;
   if(status.status==="fulfilled")setTidal(status.value);else setError(status.reason.message);
   if(refs.status==="fulfilled")setReferences(refs.value.references||[]);else setError(refs.reason.message);
   if(video.status==="fulfilled")setYoutube(video.value);
   setLoading(false);
  });
  return()=>{active=false;controller.abort();};
 },[project,call]);
 async function read(value:string,cursor?:string){
  setBusy(true);setError("");
  try{
   const result=await call({provider:"tidal",action:"playlist",project,playlist:value,...(cursor?{cursor}:{})}) as Playlist;
   setOffset(cursor?offset+(playlist?.count||0):0);setPlaylist(result);setLoadedInput(value);setInput(value);
  }catch(e){setError(e instanceof Error?e.message:"Could not read playlist.");}
  finally{setBusy(false);}
 }
 return <>
  <section className="hero-panel">
   <div><div className="eyebrow">MUSIC HUB</div><h2>Your references, connected.</h2><p>Browse TIDAL playlists across your projects. Review video matches before publishing to YouTube.</p></div>
   <span className={`status ${tidal?.connected?"status-observed":"status-unknown"}`}>{loading?"Checking connection":tidal?.connected?"TIDAL connected":"Connection unavailable"}</span>
  </section>
  <div className="card"><p className="note">The studio hardware was intentionally switched off for this setup, as confirmed by Alex on 8 November 2026. Music services work independently of the rig. MIDI and audio settings have not been changed.</p></div>
  <div className="split-grid">
   <section className="card">
    <div className="section-head"><h3>TIDAL</h3><span className="status status-documented">Read only</span></div>
    <label className="music-label" htmlFor="music-project">Project</label>
    <select id="music-project" className="select-control music-wide" value={project} disabled={busy} onChange={e=>setProject(e.target.value)}>
     {projects.length?projects.map(p=><option key={p.slug} value={p.slug} disabled={!p.enabled}>{p.display_name}{p.enabled?"":" (not enabled)"}</option>):<option value="studio">Studio</option>}
    </select>
    <p className="note">Playlist titles, artists and order are fetched live. No audio is downloaded or edited.</p>
    <p className="note">Account-wide playlist discovery is still incomplete. Use a saved reference or paste a playlist link below.</p>
   </section>
   <section className="card">
    <div className="section-head"><h3>Bubbles Sheep YouTube</h3><span className={`status ${youtube?.connected?"status-observed":"status-configured"}`}>{youtube?.connected?"Connected":youtube?"Authorisation pending":"Status unavailable"}</span></div>
    <p className="note">{youtube?.connected?"The channel is connected. Video matching and publication remain separate approval steps.":"Complete Google consent for the Bubbles Sheep channel on the Mac before creating a matching preview."}</p>
    <p className="note">Publication is additions only and requires approval of the exact playlist plan. No playlist changes run in the background.</p>
    <p className="note"><a href="https://www.youtube.com/channel/UCLVXedWkGtD3C5VZQyQWTdg" target="_blank" rel="noopener noreferrer">Open Bubbles Sheep channel ↗</a></p>
   </section>
  </div>
  <section className="card">
   <h3>Saved playlist references</h3>
   {loading?<p className="note">Loading references…</p>:references.length?<div className="structured-list">{references.map(r=><div className="music-reference" key={r.entity_id}>
    <div><a href={`https://tidal.com/playlist/${encodeURIComponent(r.entity_id)}`} target="_blank" rel="noopener noreferrer">Open on TIDAL ↗</a><p className="note">{r.notes||"Saved playlist"}</p></div>
    <button type="button" className="ghost" disabled={busy} onClick={()=>read(r.entity_id)}>Read playlist</button>
   </div>)}</div>:<p className="note">No playlist references saved for this project yet. You can read a playlist by its link.</p>}
  </section>
  <section className="card">
   <h3>Read a playlist</h3>
   <form onSubmit={e=>{e.preventDefault();if(input.trim())void read(input.trim());}}>
    <label className="music-label" htmlFor="tidal-playlist">TIDAL playlist link or ID</label>
    <input id="tidal-playlist" type="text" value={input} onChange={e=>setInput(e.target.value)} placeholder="https://tidal.com/playlist/…" disabled={busy} autoComplete="off" />
    <div className="row music-actions"><button type="submit" className="primary" disabled={busy||!input.trim()}>{busy?"Reading playlist…":"Read playlist"}</button></div>
   </form>
   <div role="status" aria-live="polite">{error&&<p className="err music-actions">{error}</p>}</div>
  </section>
  {playlist&&<section className="card">
   <div className="section-head"><div><h3>{playlist.playlist.name||"Playlist"}</h3><p className="note">Entries {offset+1}–{offset+playlist.count}. Repeated entries are preserved.</p></div><a href={`https://tidal.com/playlist/${encodeURIComponent(playlist.playlist.id)}`} target="_blank" rel="noopener noreferrer">TIDAL ↗</a></div>
   <ol className="music-tracks" start={offset+1}>{playlist.tracks.map((t,i)=><li key={`${t.id}-${offset+i}`}><strong>{t.title||"Track details unavailable"}</strong><span>{t.artists?.join(", ")||"Artist unavailable"}</span></li>)}</ol>
   {playlist.hasMore&&playlist.nextCursor?<button type="button" className="ghost music-actions" disabled={busy} onClick={()=>read(loadedInput,playlist.nextCursor!)}>{busy?"Loading…":"Next entries →"}</button>:<p className="note">End of playlist.</p>}
  </section>}
 </>;
}
