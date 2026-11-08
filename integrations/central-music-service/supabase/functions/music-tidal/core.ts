export class ServiceError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
export function playlistId(value: unknown): string {
  if(typeof value!=='string') throw new ServiceError(400,'invalid_playlist');
  let id=value;
  if(value.startsWith('https://')) {
    const u=new URL(value);
    if(!['tidal.com','www.tidal.com','listen.tidal.com'].includes(u.hostname)||!/^\/playlist\/[A-Za-z0-9_-]+\/?$/.test(u.pathname))
      throw new ServiceError(400,'invalid_playlist');
    id=u.pathname.split('/')[2];
  }
  if(!/^[A-Za-z0-9_-]{6,128}$/.test(id)) throw new ServiceError(400,'invalid_playlist');
  return id;
}
export function tidalUrl(path: string): URL {
  const input=path.startsWith('/')&&!path.startsWith('/v2/')&&!path.startsWith('//')?'/v2'+path:path;
  const u=new URL(input,'https://openapi.tidal.com');
  if(u.origin!=='https://openapi.tidal.com'||!u.pathname.startsWith('/v2/')||u.username||u.password)
    throw new ServiceError(502,'invalid_upstream_link');
  return u;
}
export function refreshBody(session: Record<string,unknown>): URLSearchParams {
  if(typeof session.client_id!=='string'||typeof session.refresh_token!=='string') throw new ServiceError(503,'connection_missing');
  return new URLSearchParams({grant_type:'refresh_token',client_id:session.client_id,refresh_token:session.refresh_token});
}
export function readCursor(value: unknown): {page:string|null;offset:number} {
  if(value===undefined)return {page:null,offset:0};
  try {
    const c=JSON.parse(atob(value as string));
    if(!c||!Number.isInteger(c.offset)||c.offset<0||c.offset>1000||
      !(c.page===null||(typeof c.page==='string'&&c.page.length<=1024)))throw new Error();
    return c;
  } catch {throw new ServiceError(400,'invalid_cursor');}
}
export const writeCursor=(page:string|null,offset:number)=>btoa(JSON.stringify({page,offset}));
export function validateBody(b: unknown): Record<string,unknown> {
  if(!b||typeof b!=='object'||Array.isArray(b))throw new ServiceError(400,'invalid_request');
  const x=b as Record<string,unknown>;
  if(Object.keys(x).some(k=>!['action','project','playlist','cursor'].includes(k)))throw new ServiceError(400,'invalid_request');
  if(!['status','references','playlists','playlist'].includes(String(x.action))) throw new ServiceError(400,'invalid_action');
  if(typeof x.project!=='string'||!/^[a-z][a-z0-9-]{1,47}$/.test(x.project))throw new ServiceError(400,'invalid_project');
  if(x.action==='playlist')playlistId(x.playlist);
  if(x.cursor!==undefined&&(typeof x.cursor!=='string'||x.cursor.length>2048))throw new ServiceError(400,'invalid_cursor');
  return x;
}
