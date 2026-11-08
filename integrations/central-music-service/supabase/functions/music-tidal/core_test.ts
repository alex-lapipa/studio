import {playlistId,tidalUrl,refreshBody,validateBody,readCursor,writeCursor} from './core.ts';
function assert(v:unknown){if(!v)throw new Error('Assertion failed');}
function rejects(fn:()=>unknown){let fail=false;try{fn();}catch{fail=true;}assert(fail);}
Deno.test('refresh includes the registered client ID and refresh grant',()=>{
 const b=refreshBody({client_id:'registered',refresh_token:'private'});
 assert(b.get('client_id')==='registered');assert(b.get('grant_type')==='refresh_token');
 rejects(()=>refreshBody({refresh_token:'private'}));
});
Deno.test('playlist input cannot redirect token requests to another host',()=>{
 assert(playlistId('https://tidal.com/playlist/abc123')==='abc123');
 rejects(()=>playlistId('https://evil.example/playlist/abc123'));
 rejects(()=>playlistId('https://tidal.com/album/abc123'));
 rejects(()=>playlistId('../abc123'));
 rejects(()=>tidalUrl('https://evil.example/v2/tracks'));
 rejects(()=>tidalUrl('https://openapi.tidal.com@evil.example/v2/'));
 assert(tidalUrl('/playlists/abc123/relationships/items?page%5Bcursor%5D=opaque').pathname==='/v2/playlists/abc123/relationships/items');
 rejects(()=>tidalUrl('https://openapi.tidal.com/v1/me'));
});
Deno.test('only read actions and explicitly allowed inputs are accepted',()=>{
 for(const action of ['status','playlists','references'])assert(validateBody({action,project:'studio'}));
 rejects(()=>validateBody({action:'delete',project:'studio'}));
 rejects(()=>validateBody({action:'status',project:'studio',url:'https://evil.example'}));
 rejects(()=>validateBody({action:'status',project:'../studio'}));
 rejects(()=>validateBody({action:'playlist',project:'studio',playlist:'bad'}));
});
Deno.test('pagination preserves offsets inside upstream pages',()=>{
 const a=readCursor(writeCursor(null,20));assert(a.page===null&&a.offset===20);
 const b=readCursor(writeCursor('opaque-token',0));assert(b.page==='opaque-token'&&b.offset===0);
 assert(readCursor(writeCursor('x'.repeat(400),0)).page?.length===400);
 rejects(()=>readCursor('garbage'));rejects(()=>readCursor(btoa('{"page":null,"offset":-1}')));
});
