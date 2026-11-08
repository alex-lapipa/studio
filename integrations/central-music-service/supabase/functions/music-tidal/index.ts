import {playlistId,tidalUrl,refreshBody,validateBody,readCursor,writeCursor,ServiceError} from './core.ts';
type Item={id:string;type:string;attributes?:Record<string,unknown>};
type ApiResponse={data:Item|Item[];included?:Item[];links?:Record<string,unknown>};
type Session=Record<string,unknown>&{client_id:string;access_token:string;refresh_token:string;scope:string;expires_at:number};
const env=(name:string)=>Deno.env.get(name)||'';
const base=env('SUPABASE_URL');
const keys=JSON.parse(env('SUPABASE_SECRET_KEYS')||'{}');
const key=keys.default||env('SUPABASE_SERVICE_ROLE_KEY');
const headers:Record<string,string>={'apikey':key,'Content-Type':'application/json'};
if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
const noStore={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(data:unknown,status=200,extra:Record<string,string>={})=>new Response(JSON.stringify(data),{status,headers:{...noStore,...extra}});
async function database(path:string,method='GET',body?:unknown){
 const r=await fetch(base+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw new ServiceError(503,'storage_unavailable');
 return r.status===204?null:await r.json();
}
const rpc=(name:string,body:unknown)=>database('rpc/'+name,'POST',body);
async function authorize(req:Request,project:string){
 const supplied=req.headers.get('x-music-key');
 if(supplied){
  if(!/^music_[A-Za-z0-9_-]{43}$/.test(supplied))throw new ServiceError(401,'unauthorized');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(supplied)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(await rpc('music_authorize_client',{p_hash:hash,p_project:project})!==true)throw new ServiceError(403,'project_access_denied');
  return;
 }
 const token=req.headers.get('Authorization')||'';
 if(!/^Bearer eyJ/.test(token))throw new ServiceError(401,'unauthorized');
 const r=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:token},signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw new ServiceError(401,'unauthorized');
 const user=await r.json();
 const projects=await database('music_projects?select=slug&slug=eq.'+encodeURIComponent(project)+'&owner_id=eq.'+encodeURIComponent(user.id)+'&enabled=eq.true');
 if(projects.length!==1)throw new ServiceError(403,'project_access_denied');
}
export async function handler(req:Request):Promise<Response>{
 let lease:string|null=null;let cooldown=2;
 const deadline=AbortSignal.timeout(65000);
 try{
  if(req.method!=='POST')return json({error:'method_not_allowed'},405,{'Allow':'POST'});
  if(req.headers.get('Origin'))return json({error:'server_client_required'},403);
  const bodyText=await req.text();
  if(new TextEncoder().encode(bodyText).length>4096)throw new ServiceError(413,'request_too_large');
  let parsed;try{parsed=JSON.parse(bodyText);}catch{throw new ServiceError(400,'invalid_json');}
  const body=validateBody(parsed),project=body.project as string;
  await authorize(req,project);
  if(body.action==='references'){
   const refs=await database('music_references?select=entity_type,entity_id,notes,created_at&project_slug=eq.'+encodeURIComponent(project));
   return json({project,references:refs});
  }
  const bootstrap=env('TIDAL_BOOTSTRAP_SESSION_B64');
  if(bootstrap)await rpc('music_initialize_session',{p_session:JSON.parse(atob(bootstrap))});
  const id=crypto.randomUUID();
  let session:Session|null=null;
  for(let i=0;i<4;i++){
   session=await rpc('music_session_checkout',{p_lease:id});
   if(session)break;
   if(i<3)await new Promise(r=>setTimeout(r,1100));
  }
  if(!session)throw new ServiceError(429,'connection_busy');
  lease=id;
  if(Date.now()>=Number(session.expires_at||0)){
   const r=await fetch('https://auth.tidal.com/v1/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:refreshBody(session),signal:AbortSignal.timeout(12000)});
   if(!r.ok)throw new ServiceError(503,'tidal_reauthorization_required');
   const t=await r.json();
   if(!t.access_token)throw new ServiceError(502,'invalid_token_response');
   session={...session,access_token:t.access_token,refresh_token:t.refresh_token||session.refresh_token,scope:t.scope||session.scope,expires_at:Date.now()+(Number(t.expires_in||3600)-90)*1000};
   if(await rpc('music_session_save',{p_lease:id,p_session:session})!==true)throw new ServiceError(503,'session_save_failed');
  }
  if(body.action==='status')return json({project,provider:'tidal',connected:true,readOnly:true,scopes:['playlists.read','collection.read'],accountListingComplete:false,host:'supabase',version:'1.0.0'});
  const accessToken=session.access_token;
  let last=0,requests=0;
  async function api(path:string):Promise<ApiResponse>{
   if(++requests>35)throw new ServiceError(502,'upstream_request_limit');
   const wait=1100-(Date.now()-last);if(wait>0)await new Promise(r=>setTimeout(r,wait));last=Date.now();
    const r=await fetch(tidalUrl(path),{headers:{Accept:'application/vnd.api+json',Authorization:'Bearer '+accessToken},signal:AbortSignal.any([deadline,AbortSignal.timeout(15000)])});
   if(r.status===429){cooldown=Math.min(60,Math.max(2,Number(r.headers.get('Retry-After'))||10));throw new ServiceError(429,'tidal_rate_limited');}
   if(!r.ok)throw new ServiceError(r.status===404?404:502,'tidal_request_failed');
   return await r.json();
  }
  if(body.action==='playlists'){
   const data=await api('/v2/playlists?'+new URLSearchParams({'filter[owners.id]':'me'}));
   return json({project,listingComplete:false,playlists:data.data,notice:'Account collection completeness is not verified. Use saved references or a playlist ID.'});
  }
  const pid=playlistId(body.playlist);
  const playlist=await api('/v2/playlists/'+encodeURIComponent(pid));
  const cursor=readCursor(body.cursor);
  const q=new URLSearchParams();if(cursor.page)q.set('page[cursor]',cursor.page);
  const refs=await api('/v2/playlists/'+encodeURIComponent(pid)+'/relationships/items?'+q);
  if(!Array.isArray(refs.data))throw new ServiceError(502,'invalid_upstream_response');
  const tracks=[];
  for(const ref of refs.data.slice(cursor.offset,cursor.offset+20)){
   if(ref.type!=='tracks'){tracks.push({id:ref.id,type:ref.type});continue;}
   const d=await api('/v2/tracks/'+encodeURIComponent(ref.id)+'?include=artists');
   const track=d.data as Item;
   tracks.push({id:track.id,title:track.attributes?.title||track.attributes?.name||null,artists:(d.included||[]).filter(x=>x.type==='artists').map(x=>x.attributes?.name).filter(Boolean)});
  }
  const nextValue=refs.links?.next;
  const next=typeof nextValue==='string'?nextValue:(nextValue as {href?:string}|undefined)?.href;
  let nextCursor=null;
  if(cursor.offset+20<refs.data.length)nextCursor=writeCursor(cursor.page,cursor.offset+20);
  else if(next){const nextPage=tidalUrl(next).searchParams.get('page[cursor]');if(!nextPage)throw new ServiceError(502,'invalid_upstream_cursor');nextCursor=writeCursor(nextPage,0);}
  const p=playlist.data as Item;
  return json({project,playlist:{id:p.id,name:p.attributes?.name||p.attributes?.title||null},tracks,count:tracks.length,nextCursor,hasMore:Boolean(nextCursor),metadataStored:false});
 }catch(e){
  const err=e instanceof ServiceError?e:new ServiceError(500,'internal_error');
  return json({error:err.code},err.status,err.status===429?{'Retry-After':String(cooldown)}:{});
 }finally{if(lease)await rpc('music_session_release',{p_lease:lease,p_cooldown:cooldown}).catch(()=>{});}
}
Deno.serve(handler);
