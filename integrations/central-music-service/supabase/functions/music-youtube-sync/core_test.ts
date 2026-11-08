import {entries,prefixMatches,score,limitedJson,playlistVideos} from './core.ts';
function assert(x:unknown){if(!x)throw new Error('Assertion failed');}
Deno.test('matching penalises covers and unwanted alternate versions',()=>{assert(score('Starburster',['Fontaines D.C.'],'Fontaines D.C. - Starburster Official Video')>score('Starburster',['Fontaines D.C.'],'Fontaines D.C. Starburster live cover'));});
Deno.test('plans preserve repeated source positions and reject invalid videos',()=>{assert(entries([{position:0,trackId:'123',videoId:'abcdefghijk'},{position:1,trackId:'123',videoId:'abcdefghijk'}]).length===2);let bad=false;try{entries([{position:4,trackId:'123',videoId:'bad'}]);}catch{bad=true;}assert(bad);});
Deno.test('reconciliation rejects manual changes and supports restart',()=>{const p=[{videoId:'abcdefghijk'},{videoId:'12345678901'}];assert(prefixMatches(p,['abcdefghijk']));assert(!prefixMatches(p,['12345678901']));assert(!prefixMatches(p,['abcdefghijk','12345678901','extra']));});
Deno.test('body size is enforced while streaming',async()=>{let bad=false;try{await limitedJson(new Request('https://local',{method:'POST',body:'x'.repeat(20)}),10);}catch{bad=true;}assert(bad);});

Deno.test('reconciliation reads beyond 55 entries and detects second-page edits',async()=>{
 const plan=Array.from({length:65},(_,i)=>({videoId:String(i).padStart(11,'0')}));
 const calls:string[]=[];
 const actual=await playlistVideos(async path=>{
  calls.push(path);const token=new URL(path,'https://example.test/').searchParams.get('pageToken');
  return {items:plan.slice(token?50:0,token?60:50).map(x=>({snippet:{resourceId:x}})),...(token?{}:{nextPageToken:'page+/='})};
 },'playlist');
 assert(actual.length===60&&calls.length===2&&prefixMatches(plan,actual));
 assert(new URL(calls[1],'https://example.test/').searchParams.get('pageToken')==='page+/=');
 actual[58]='manual-edit';assert(!prefixMatches(plan,actual));
});
Deno.test('repeated page tokens stop reconciliation before any writes',async()=>{
 let failed=false,calls=0;
 try{await playlistVideos(async()=>{calls++;return {items:[],nextPageToken:'repeat'};},'playlist');}catch{failed=true;}
 assert(failed&&calls===2);
});
