#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
const c=JSON.parse(await readFile(join(homedir(),'.config/central-music/youtube-sync.json'),'utf8'));
if(c.url!=='https://rccobdhbcjkosszgqwou.supabase.co/functions/v1/music-youtube-sync')throw new Error('Unexpected sync service');
async function call(b){const r=await fetch(c.url,{method:'POST',headers:{'Content-Type':'application/json','x-music-operator':c.operatorKey},body:JSON.stringify(b),signal:AbortSignal.timeout(75000)});const d=await r.json();if(!r.ok)throw new Error('Sync HTTP '+r.status+': '+d.error);return d;}
async function auth(){
 let expected;
 const server=createServer(async(req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1:8768');
  if(req.method!=='GET'||u.pathname!=='/callback'){res.writeHead(404);res.end();return;}
  if(!expected||u.searchParams.get('state')!==expected){res.writeHead(400);res.end('Invalid state');return;}
  try{
   if(u.searchParams.has('error'))throw new Error('Google consent was declined');
   const result=await call({action:'oauth_exchange',state:expected,code:u.searchParams.get('code')});
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end('<!doctype html><title>Bubbles connected</title><p>Bubbles Sheep YouTube connected. You can close this page. Nothing has been published.</p>');
   console.log(JSON.stringify(result));server.close();
  }catch(e){res.writeHead(400,{'Cache-Control':'no-store'});res.end('Connection failed. Return to ChatGPT.');console.error(e.message);server.close();process.exitCode=1;}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(8768,'127.0.0.1',resolve);});
 const timer=setTimeout(()=>{console.error('Google consent timed out; restart authorisation when ready.');server.close();process.exitCode=1;},600000);
 server.on('close',()=>clearTimeout(timer));
 try{const d=await call({action:'oauth_start'});expected=d.state;console.log('AUTHORIZE_URL '+d.url);console.log('Select the Bubbles Sheep channel. Nothing will be published.');spawn('open',[d.url],{stdio:'ignore'}).on('error',()=>{});}catch(e){server.close();throw e;}
}
const command=process.argv[2]||'status';
try{
 if(command==='auth')await auth();
 else if(command==='status')console.log(JSON.stringify(await call({action:'status'}),null,2));
 else if(command==='match'){const q=JSON.parse(await readFile(process.argv[3],'utf8'));console.log(JSON.stringify(await call({action:'match',...q}),null,2));}
 else if(command==='plan'){const p=JSON.parse(await readFile(process.argv[3],'utf8'));console.log(JSON.stringify(await call({action:'save_plan',entries:p.entries}),null,2));}
 else if(command==='approve'){if(process.argv[4]!=='--confirm-reviewed')throw new Error('Explicit reviewed-plan confirmation required');console.log(JSON.stringify(await call({action:'approve_plan',planHash:process.argv[3],confirm:true}),null,2));}
 else if(command==='apply')console.log(JSON.stringify(await call({action:'apply_batch',planHash:process.argv[3]}),null,2));
 else throw new Error('Unknown command');
}catch(e){console.error(e.message);process.exitCode=1;}
