import {CHANNEL,SOURCE,CLIENT,REDIRECT,SCOPE,SyncError,score,entries,prefixMatches,digest,limitedJson,playlistVideos} from './core.ts';
const env=(k:string)=>Deno.env.get(k)||'';
const base=env('SUPABASE_URL'),key=JSON.parse(env('SUPABASE_SECRET_KEYS')||'{}').default||env('SUPABASE_SERVICE_ROLE_KEY');
const dbheaders:Record<string,string>={apikey:key,'Content-Type':'application/json'};
if(key.startsWith('eyJ'))dbheaders.Authorization='Bearer '+key;
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function rpc(name:string,b:unknown){const r=await fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:dbheaders,body:JSON.stringify(b),signal:AbortSignal.timeout(10000)});if(!r.ok)throw new SyncError(503,'state_unavailable');return r.status===204?null:await r.json();}
const load=(k:string)=>rpc('music_youtube_load',{p_key:k});
const store=(k:string,v:unknown)=>rpc('music_youtube_store',{p_key:k,p_value:v});
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function token(b:Record<string,string>){
 const secret=env('YOUTUBE_CLIENT_SECRET');if(!secret)throw new SyncError(503,'google_client_not_configured');
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:CLIENT,client_secret:secret,...b}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new SyncError(409,'google_authorization_required');return await r.json();
}
Deno.serve(async(req:Request)=>{
 let lease:string|null=null;
 const deadline=AbortSignal.timeout(65000);
 try{
  if(req.method!=='POST'||req.headers.has('Origin'))return json({error:'server_post_required'},405);
  const configured=env('MUSIC_SYNC_OPERATOR_KEY');
  if(!configured||req.headers.get('x-music-operator')!==configured)return json({error:'unauthorized'},401);
  const b=await limitedJson(req);
  if(!b||typeof b!=='object'||typeof b.action!=='string')throw new SyncError(400,'invalid_request');
  const actions=['status','oauth_start','oauth_exchange','match','save_plan','approve_plan','inspect_plan','apply_batch'];
  if(!actions.includes(b.action))throw new SyncError(400,'invalid_action');
  if(b.action==='match'&&env('MUSIC_MATCHING_ENABLED')!=='true')throw new SyncError(403,'matching_metadata_consent_required');
  if(b.action==='status')return json({channelId:CHANNEL,sourcePlaylist:SOURCE,clientConfigured:Boolean(env('YOUTUBE_CLIENT_SECRET')),connected:Boolean(await load('youtube:bubbles')),publishingRequiresApprovedPlan:true,mode:'additions-only'});
  const id=crypto.randomUUID();if(await rpc('music_youtube_lock',{p_lease:id})!==true)throw new SyncError(429,'sync_busy');lease=id;
  if(b.action==='oauth_start'){
   const state=random(),verifier=random();
   const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
   const challenge=btoa(String.fromCharCode(...hash)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
   await store('oauth:'+state,{verifier,expires:Date.now()+600000,used:false});
   const u=new URL('https://accounts.google.com/o/oauth2/v2/auth');u.search=new URLSearchParams({client_id:CLIENT,redirect_uri:REDIRECT,response_type:'code',scope:SCOPE,access_type:'offline',prompt:'consent select_account',include_granted_scopes:'false',state,code_challenge:challenge,code_challenge_method:'S256'}).toString();
   return json({url:u.href,state,expiresIn:600,expectedChannel:CHANNEL});
  }
  let grant:{access_token:string;refresh_token:string;expires_at:number;expires_in?:number;scope?:string};
  if(b.action==='oauth_exchange'){
   if(typeof b.state!=='string'||!/^[a-f0-9]{64}$/.test(b.state)||typeof b.code!=='string'||b.code.length>4096)throw new SyncError(400,'invalid_oauth_callback');
   const pending=await load('oauth:'+b.state);if(!pending||pending.used||pending.expires<Date.now())throw new SyncError(400,'expired_oauth_state');
   await store('oauth:'+b.state,{used:true,expires:0});
   grant=await token({grant_type:'authorization_code',code:b.code,code_verifier:pending.verifier,redirect_uri:REDIRECT});
   if(!grant.refresh_token||!String(grant.scope||'').split(' ').includes(SCOPE))throw new SyncError(403,'offline_write_grant_required');
  }else{
   grant=await load('youtube:bubbles');if(!grant)throw new SyncError(409,'bubbles_google_consent_required');
   if(Date.now()>=grant.expires_at){const t=await token({grant_type:'refresh_token',refresh_token:grant.refresh_token});grant={...grant,...t,refresh_token:t.refresh_token||grant.refresh_token,expires_at:Date.now()+(Number(t.expires_in||3600)-90)*1000};await store('youtube:bubbles',grant);}
  }
  async function google(path:string,method='GET',body?:unknown){
   const u=new URL(path,'https://www.googleapis.com/youtube/v3/');if(u.origin!=='https://www.googleapis.com'||!u.pathname.startsWith('/youtube/v3/'))throw new SyncError(500,'invalid_google_target');
   const r=await fetch(u,{method,headers:{Authorization:'Bearer '+grant.access_token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.any([deadline,AbortSignal.timeout(15000)])});
   if(!r.ok)throw new SyncError(r.status===403?403:502,'youtube_request_failed');return await r.json();
  }
  const channels=await google('channels?part=id,snippet&mine=true');
  if(channels.items?.length!==1||channels.items[0].id!==CHANNEL)throw new SyncError(403,'wrong_youtube_channel');
  if(b.action==='oauth_exchange'){await store('youtube:bubbles',{...grant,expires_at:Date.now()+(Number(grant.expires_in||3600)-90)*1000});return json({connected:true,channelId:CHANNEL,channelTitle:channels.items[0].snippet.title,scopes:[SCOPE]});}
  if(b.action==='match'){
   if(typeof b.title!=='string'||b.title.length>300||!Array.isArray(b.artists)||b.artists.length>10||b.artists.some((x:unknown)=>typeof x!=='string'||x.length>200))throw new SyncError(400,'invalid_track');
   const q=new URLSearchParams({part:'snippet',type:'video',maxResults:'5',q:b.artists.join(' ')+' '+b.title});
   const result=await google('search?'+q);
   return json({candidates:(result.items||[]).map((x:any)=>({videoId:x.id.videoId,title:x.snippet.title,channel:x.snippet.channelTitle,score:score(b.title,b.artists,x.snippet.title+' '+x.snippet.channelTitle)})).sort((a:any,c:any)=>c.score-a.score),requiresReview:true});
  }
  if(b.action==='save_plan'){
   const list=entries(b.entries);const plan={source:SOURCE,channel:CHANNEL,title:'BUBBLEZ',privacy:'unlisted',entries:list,approved:false,playlistId:null};
   const hash=await digest(JSON.stringify({source:plan.source,channel:plan.channel,title:plan.title,privacy:plan.privacy,entries:list}));
   const existing=await load('plan:'+hash);
   if(!existing)await store('plan:'+hash,plan);
   return json({planHash:hash,entries:list.length,approved:Boolean(existing?.approved)});
  }
  if(typeof b.planHash!=='string'||!/^[a-f0-9]{64}$/.test(b.planHash))throw new SyncError(400,'invalid_plan_hash');
  const plan=await load('plan:'+b.planHash);if(!plan||plan.channel!==CHANNEL||plan.source!==SOURCE)throw new SyncError(404,'plan_not_found');
  if(b.action==='inspect_plan'){
   if(!plan.playlistId)return json({planHash:b.planHash,approved:Boolean(plan.approved),created:false,entries:plan.entries.length});
   const result=await google('playlists?part=snippet,status,contentDetails&id='+encodeURIComponent(plan.playlistId));
   const item=result.items?.[0];
   const ownerVerified=item?.snippet?.channelId===CHANNEL;
   const actual=ownerVerified?await playlistVideos(google,plan.playlistId):[];
   return json({planHash:b.planHash,approved:Boolean(plan.approved),playlistId:plan.playlistId,found:Boolean(item),ownerVerified,observedChannel:item?.snippet?.channelId||null,title:item?.snippet?.title||null,privacy:item?.status?.privacyStatus||null,expected:plan.entries.length,actual:ownerVerified?actual:null,prefixMatches:ownerVerified&&prefixMatches(plan.entries,actual),complete:ownerVerified&&actual.length===plan.entries.length&&prefixMatches(plan.entries,actual)});
  }
  if(b.action==='approve_plan'){
   if(b.confirm!==true)throw new SyncError(400,'explicit_confirmation_required');
   plan.approved=true;plan.approvedAt=new Date().toISOString();await store('plan:'+b.planHash,plan);return json({approved:true,planHash:b.planHash,entries:plan.entries.length});
  }
  if(!plan.approved)throw new SyncError(409,'plan_approval_required');
  if(!plan.playlistId){
   const marker='Central music sync '+b.planHash;
   const existing=await google('playlists?part=snippet&mine=true&maxResults=50');
   const found=(existing.items||[]).find((x:any)=>x.snippet.channelId===CHANNEL&&x.snippet.description===marker);
   if(found)plan.playlistId=found.id;
   else {const created=await google('playlists?part=snippet,status','POST',{snippet:{title:plan.title,description:marker},status:{privacyStatus:'unlisted'}});plan.playlistId=created.id;}
   await store('plan:'+b.planHash,plan);
  }
  const meta=await google('playlists?part=snippet&id='+encodeURIComponent(plan.playlistId));
  if(meta.items?.[0]?.snippet.channelId!==CHANNEL)throw new SyncError(403,'wrong_playlist_owner');
  const actual=await playlistVideos(google,plan.playlistId);
  if(!prefixMatches(plan.entries,actual))throw new SyncError(409,'playlist_changed_manual_review_required');
  let added=0;
  for(const item of plan.entries.slice(actual.length,actual.length+5)){
   await google('playlistItems?part=snippet','POST',{snippet:{playlistId:plan.playlistId,resourceId:{kind:'youtube#video',videoId:item.videoId},position:item.position}});added++;
  }
  return json({playlistId:plan.playlistId,added,total:actual.length+added,remaining:plan.entries.length-actual.length-added,mode:'additions-only'});
 }catch(e){const x=e instanceof SyncError?e:new SyncError(500,'sync_failed');return json({error:x.code},x.status);}
 finally{if(lease)await rpc('music_youtube_unlock',{p_lease:lease}).catch(()=>{});}
});
