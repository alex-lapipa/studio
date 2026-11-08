#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

export async function runHosted(command='status',playlist,project='studio') {
 if(!/^[a-z][a-z0-9-]{1,47}$/.test(project))throw new Error('Invalid project');
 if(!['status','references','playlists','playlist'].includes(command))throw new Error('Hosted read-only command required');
 const c=JSON.parse(await readFile(join(homedir(),'.config','central-music',project+'.json'),'utf8'));
 const url=new URL(c.url);
 if(url.href!=='https://klbzvbwudekstddlgnjy.supabase.co/functions/v1/music-tidal'||c.project!==project)throw new Error('Untrusted music service configuration');
 async function call(body){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-music-key':c.token},body:JSON.stringify({project,...body}),signal:AbortSignal.timeout(75000)});
  const d=await r.json();
  if(!r.ok)throw new Error('Music service HTTP '+r.status+': '+String(d.error||'request_failed'));
  return d;
 }
 if(command!=='playlist')return await call({action:command});
 const tracks=[];let cursor,meta,more=false;
 for(let page=0;page<5;page++){
  const d=await call({action:'playlist',playlist,...(cursor?{cursor}:{})});
  meta=d.playlist;tracks.push(...d.tracks);more=Boolean(d.hasMore);cursor=d.nextCursor;
  if(!more)break;
 }
 return {project,host:'supabase',playlist:meta,readCount:tracks.length,truncated:more,tracks};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const args=process.argv.slice(2);const i=args.indexOf('--project');let project='studio';
 if(i>=0){project=args[i+1];args.splice(i,2);}
 runHosted(args[0]||'status',args[1],project).then(d=>console.log(JSON.stringify(d,null,2))).catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;});
}
