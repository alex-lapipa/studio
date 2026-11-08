import {entries,prefixMatches,score,limitedJson} from './core.ts';
function assert(x:unknown){if(!x)throw new Error('Assertion failed');}
Deno.test('matching penalises covers and unwanted alternate versions',()=>{assert(score('Starburster',['Fontaines D.C.'],'Fontaines D.C. - Starburster Official Video')>score('Starburster',['Fontaines D.C.'],'Fontaines D.C. Starburster live cover'));});
Deno.test('plans preserve repeated source positions and reject invalid videos',()=>{assert(entries([{position:0,trackId:'123',videoId:'abcdefghijk'},{position:1,trackId:'123',videoId:'abcdefghijk'}]).length===2);let bad=false;try{entries([{position:4,trackId:'123',videoId:'bad'}]);}catch{bad=true;}assert(bad);});
Deno.test('reconciliation rejects manual changes and supports restart',()=>{const p=[{videoId:'abcdefghijk'},{videoId:'12345678901'}];assert(prefixMatches(p,['abcdefghijk']));assert(!prefixMatches(p,['12345678901']));assert(!prefixMatches(p,['abcdefghijk','12345678901','extra']));});
Deno.test('body size is enforced while streaming',async()=>{let bad=false;try{await limitedJson(new Request('https://local',{method:'POST',body:'x'.repeat(20)}),10);}catch{bad=true;}assert(bad);});
