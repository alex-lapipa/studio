type Env=(name:string)=>string|undefined;
type Transport=typeof fetch;
const corsOrigins=new Set(['https://www.zetazeta.xyz','https://zetazeta.xyz','http://localhost:3000']);
const previewOrigin=/^https:\/\/studio-[a-z0-9]+-la-pipa-is-la-pipa\.vercel\.app$/;
export function allowedOrigin(origin:string){return corsOrigins.has(origin)||previewOrigin.test(origin);}
async function body(req:Request){
 const reader=req.body?.getReader();if(!reader)throw new Error('invalid_json');let size=0;const parts:Uint8Array[]=[];
 while(true){const d=await reader.read();if(d.done)break;size+=d.value.length;if(size>8192){await reader.cancel();throw new Error('request_too_large');}parts.push(d.value);}
 const bytes=new Uint8Array(size);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export function createHandler(env:Env,transport:Transport=fetch){
 return async(req:Request)=>{
  const origin=req.headers.get('Origin');
  const headers:Record<string,string>={'Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  if(origin&&allowedOrigin(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'});
  const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
  if(origin&&!allowedOrigin(origin))return json({error:'origin_not_allowed'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);
  const auth=req.headers.get('Authorization');if(!auth?.startsWith('Bearer eyJ'))return json({error:'authentication_required'},401);
  const url=env('SUPABASE_URL'),owner=env('MUSIC_HUB_OWNER_ID');
  const publicKeys=JSON.parse(env('SUPABASE_PUBLISHABLE_KEYS')||'{}');const apikey=publicKeys.default||env('SUPABASE_ANON_KEY');
  if(!url||!owner||!apikey)return json({error:'hub_not_configured'},503);
  try{
   const checked=await transport(url+'/auth/v1/user',{headers:{Authorization:auth,apikey},signal:AbortSignal.timeout(12000)});
   if(!checked.ok)return json({error:'authentication_required'},401);
   const user=await checked.json();if(user.id!==owner)return json({error:'owner_access_required'},403);
   const input=await body(req);
   if(!input||typeof input!=='object'||Array.isArray(input))return json({error:'invalid_request'},400);
   if(Object.keys(input).some(k=>!['provider','action','project','playlist','cursor'].includes(k)))return json({error:'invalid_request'},400);
   let target:string,forward:Record<string,string>,payload:unknown;
   if(input.provider==='tidal'){
    if(!['status','references','playlists','playlist'].includes(input.action)||typeof input.project!=='string'||!/^[a-z][a-z0-9-]{1,47}$/.test(input.project))return json({error:'invalid_tidal_request'},400);
    target=url+'/functions/v1/music-tidal';forward={Authorization:auth,apikey,'Content-Type':'application/json'};
    const {provider,...rest}=input;void provider;payload=rest;
   }else if(input.provider==='youtube'&&input.action==='status'){
    const operator=env('MUSIC_SYNC_OPERATOR_KEY');if(!operator)return json({error:'youtube_adapter_not_configured'},503);
    target='https://rccobdhbcjkosszgqwou.supabase.co/functions/v1/music-youtube-sync';forward={'x-music-operator':operator,'Content-Type':'application/json'};payload={action:'status'};
   }else return json({error:'unsupported_operation'},400);
   const upstream=await transport(target,{method:'POST',headers:forward,body:JSON.stringify(payload),signal:AbortSignal.timeout(75000)});
   const response=await upstream.json();return json(response,upstream.status);
  }catch(e){const code=e instanceof Error?e.message:'';return json({error:code==='request_too_large'?code:'music_request_failed'},code==='request_too_large'?413:502);}
 };
}
