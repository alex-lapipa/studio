#!/usr/bin/env node
import {runHosted} from './music-client.mjs';
import {readFile} from 'node:fs/promises';import {homedir} from 'node:os';import {join} from 'node:path';
const c=JSON.parse(await readFile(join(homedir(),'.config/central-music/youtube-sync.json'),'utf8'));
if(c.url!=='https://rccobdhbcjkosszgqwou.supabase.co/functions/v1/music-youtube-sync')throw new Error('Unexpected sync service');
const source='cd605171-0e84-423c-ab7e-59aaa6568191';
const playlist=await runHosted('playlist',source,'bubbles');
if(playlist.truncated)throw new Error('Source playlist is truncated; do not create a partial plan');
const cache=new Map();let matched=0,review=0;
for(const [position,track] of playlist.tracks.entries()){
 if(!cache.has(track.id)){
  const r=await fetch(c.url,{method:'POST',headers:{'Content-Type':'application/json','x-music-operator':c.operatorKey},body:JSON.stringify({action:'match',title:track.title,artists:track.artists}),signal:AbortSignal.timeout(75000)});
  const d=await r.json();if(!r.ok)throw new Error('Matching HTTP '+r.status+': '+d.error);cache.set(track.id,d.candidates);
 }
 const candidates=cache.get(track.id);if(candidates[0]?.score>=95)matched++;else review++;
 console.log(JSON.stringify({position,trackId:track.id,title:track.title,artists:track.artists,candidates:candidates.slice(0,3),requiresReview:true}));
}
console.log(JSON.stringify({summary:true,sourcePlaylist:source,channelId:'UCLVXedWkGtD3C5VZQyQWTdg',entries:playlist.tracks.length,distinctTracks:cache.size,strongCandidates:matched,ambiguousOrMissing:review,published:false}));
