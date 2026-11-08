export const CHANNEL='UCLVXedWkGtD3C5VZQyQWTdg';
export const SOURCE='cd605171-0e84-423c-ab7e-59aaa6568191';
export const CLIENT='403896212999-f3tv677gqmf0lgkh7hmi49punqt3ls8v.apps.googleusercontent.com';
export const REDIRECT='http://127.0.0.1:8768/callback';
export const SCOPE='https://www.googleapis.com/auth/youtube.force-ssl';
export class SyncError extends Error{constructor(public status:number,public code:string){super(code);}}
export const normalize=(s:string)=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function score(title:string,artists:string[],candidate:string):number{
 const c=normalize(candidate),t=normalize(title);
 let value=c.includes(t)?70:0;
 if(artists.some(a=>c.includes(normalize(a))))value+=25;
 if(/official|topic|audio/i.test(candidate))value+=5;
 for(const v of ['live','remix','cover','karaoke','sped up','slowed'])if(c.includes(v)&&!t.includes(v))value-=40;
 return Math.max(0,Math.min(100,value));
}
export function entries(value:unknown){
 if(!Array.isArray(value)||value.length<1||value.length>100)throw new SyncError(400,'invalid_entries');
 return value.map((x,i)=>{
  if(!x||x.position!==i||typeof x.trackId!=='string'||!/^\d{1,20}$/.test(x.trackId)||typeof x.videoId!=='string'||!/^[-_A-Za-z0-9]{11}$/.test(x.videoId))throw new SyncError(400,'invalid_entry');
  return {position:i,trackId:x.trackId,videoId:x.videoId};
 });
}
export function prefixMatches(expected:{videoId:string}[],actual:string[]){return actual.length<=expected.length&&actual.every((id,i)=>id===expected[i].videoId);}
export async function digest(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function limitedJson(req:Request,max=32768){
 if(Number(req.headers.get('content-length'))>max)throw new SyncError(413,'request_too_large');
 const reader=req.body?.getReader();if(!reader)throw new SyncError(400,'missing_body');
 const parts=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new SyncError(413,'request_too_large');}parts.push(value);}
 const data=new Uint8Array(size);let offset=0;for(const p of parts){data.set(p,offset);offset+=p.length;}
 try{return JSON.parse(new TextDecoder().decode(data));}catch{throw new SyncError(400,'invalid_json');}
}
