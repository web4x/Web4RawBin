// FAILABLE BITE for the FINDING-2 real-owner brace (architect design 6173ff732): a bulk delete (!explicitOwner) of a unit
// owned by a KNOWN REAL ACCOUNT (committed profile) must be REFUSED 403; an ephemeral-owned unit must still delete (200)
// = the predicate DISCRIMINATES (not blanket-refuse). Stops the protection regressing to convention.
// PRE-brace (v0.8.226): real-owned bulk-delete SUCCEEDS = RED baseline (the gap). POST-brace: real-owned → 403 = GREEN.
// Runs on the isolated rig. Stub-must-fail is by-construction: without the predicate, real-owned deletes (RED).
import WebSocket from 'ws'; import https from 'node:https'; import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'; import path from 'node:path'; import { randomUUID } from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const BASE='https://localhost:4601', WSS='wss://localhost:4601', ST='ce981242-74fe-4d44-b5b6-43c641e224df';
const WT='/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/inc7b-rig';
const shard=u=>path.join(WT,'scenario/index',...u.slice(0,5).split(''),u+'.scenario.json');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const post=(p,body,ct)=>new Promise(res=>{const u=new URL(BASE+p);const rq=https.request({hostname:u.hostname,port:u.port,path:u.pathname,method:'POST',rejectUnauthorized:false,headers:{'content-type':ct,'x-player-token':ST,'content-length':Buffer.byteLength(body)}},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>{let j={};try{j=JSON.parse(b)}catch{}res({status:r.statusCode,body:j})})});rq.on('error',()=>res({status:0,body:{}}));rq.write(body);rq.end()});
const jpost=(p,o)=>post(p,JSON.stringify(o),'application/json');
const upload=async(room,tag)=>{const B='----rb';const body=Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${ST}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="rb-${tag}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`,'utf8'),Buffer.from('rb-'+tag+'-'+randomUUID()),Buffer.from(`\r\n--${B}--\r\n`,'utf8')]);const r=await post(`/api/room/${room}/upload`,body,`multipart/form-data; boundary=${B}`);return r.body?.uuid||''};
const waitShard=async u=>{for(let i=0;i<40;i++){if(existsSync(shard(u)))return true;await sleep(300)}return false};
const c=new WebSocket(WSS,{rejectUnauthorized:false});const msgs=[];let ready,readyP=new Promise(r=>ready=r);
c.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return}msgs.push(m);if(m.type==='welcome')c.send(JSON.stringify({type:'IDENTIFY',playerToken:ST,deviceId:'rb'}));else if(m.type==='PROFILE'&&!c.__c){c.__c=true;c.send(JSON.stringify({type:'UPDATE_PROFILE',name:'SystemTester',secretCode:'4242'}));setTimeout(ready,1400)}});
c.on('error',()=>{});
const R={};
await Promise.race([readyP,sleep(15000)]);
try{
  const s0=msgs.length;c.send(JSON.stringify({type:'CREATE_ROOM',roomName:'brace-bite',playerName:'SystemTester',playerToken:ST}));
  let room=null;for(let t=0;t<25;t++){await sleep(250);const j=msgs.slice(s0).find(m=>m.type==='ROOM_JOINED');if(j){room=j.room?.id;break}}
  if(!room)throw new Error('create failed');
  // REAL-owned unit: uploaded by SystemTester (ce981242 = a COMMITTED profile = known real account)
  const real=await upload(room,'real-owned');await waitShard(real);
  // EPHEMERAL-owned control: synthetic unit owned by a random non-committed token
  const eph=randomUUID();const ephUnit={ior:'ior:class:File',model:{uuid:eph,name:'rb-ephemeral.bin',roomUuid:room,location:`roomcoll:${room}:files`,uploaderToken:randomUUID()},ownerIor:`ior:instance:${randomUUID()}`};
  mkdirSync(path.dirname(shard(eph)),{recursive:true});writeFileSync(shard(eph),JSON.stringify(ephUnit,null,2));await sleep(500);
  // BULK delete (HTTP delete-unit = no explicitOwner → the !explicitOwner brace path)
  const dReal=await jpost(`/api/room/${room}/delete-unit`,{unit:real,playerToken:ST});
  const dEph=await jpost(`/api/room/${room}/delete-unit`,{unit:eph,playerToken:ST});
  R.realRefused = dReal.status===403; R.ephDeleted = dEph.status===200;
  console.log(`  real-owned(committed-profile ce981242) bulk-delete status=${dReal.status} → ${R.realRefused?'403 REFUSED (brace LIVE)':'(NOT refused — brace ABSENT = the gap)'}`);
  console.log(`  ephemeral-owned control bulk-delete status=${dEph.status} → ${R.ephDeleted?'200 deleted (predicate discriminates)':'?'}`);
  R.pass = R.realRefused && R.ephDeleted; // GREEN = real refused AND ephemeral allowed
  // cleanup
  c.send(JSON.stringify({type:'DELETE_ROOM',roomId:room}));await sleep(1500);
}catch(e){R.error=String(e.message||e);R.pass=false}
finally{try{c.close()}catch{}}
console.log('\n=== REAL-OWNER BRACE BITE (isolated rig) ===');
if(R.error)console.log('ERROR:',R.error);
console.log(R.pass?'★ GREEN — real-owned bulk-delete 403 REFUSED + ephemeral allowed = isOwnerKnownRealAccount brace LIVE + discriminating':'★ RED — brace ABSENT (real-owned committed-profile deletes via bulk = the gap FINDING-2 fixes). Expected PRE-brace; flips GREEN on brace commit.');
process.exit(R.pass?0:1);
