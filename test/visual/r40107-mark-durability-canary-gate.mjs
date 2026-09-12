// v0.8.226 CANARY bite (PO class-not-instance): a re-persist that PROVABLY fires (room rename takes effect) must PRESERVE
// model.protected AND an ARBITRARY unmodeled stored field (canary). preserve-unknown merge → both survive; an
// enumerate-protected instance-fix → canary DIES → RED. Failable-both-ways: the rename proves the rebuild fired (so a
// surviving canary is NOT "nothing happened"); explicit-unset honored proves it MERGES (not blind-freezes). Isolated rig.
import WebSocket from 'ws'; import { readFileSync, writeFileSync, existsSync } from 'node:fs'; import path from 'node:path';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const WSS='wss://localhost:4601', ST='ce981242-74fe-4d44-b5b6-43c641e224df';
const WT='/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/inc7b-rig';
const shard=u=>path.join(WT,'scenario/index',...u.slice(0,5).split(''),u+'.scenario.json');
const readU=u=>{try{return JSON.parse(readFileSync(shard(u),'utf8'))}catch{return null}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const c=new WebSocket(WSS,{rejectUnauthorized:false}); const msgs=[]; let ready,readyP=new Promise(r=>ready=r);
c.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return}msgs.push(m);if(m.type==='welcome')c.send(JSON.stringify({type:'IDENTIFY',playerToken:ST,deviceId:'canary'}));else if(m.type==='PROFILE'&&!c.__c){c.__c=true;c.send(JSON.stringify({type:'UPDATE_PROFILE',name:'SystemTester',secretCode:'4242'}));setTimeout(ready,1400)}});
c.on('error',()=>{});
const R={};
await Promise.race([readyP,sleep(15000)]);
try{
  const s0=msgs.length; c.send(JSON.stringify({type:'CREATE_ROOM',roomName:'canary-room-orig',playerName:'SystemTester',playerToken:ST}));
  let roomId=null; for(let t=0;t<25;t++){await sleep(250);const j=msgs.slice(s0).find(m=>m.type==='ROOM_JOINED');if(j){roomId=j.room?.id;break}}
  R.created=!!roomId; if(!roomId)throw new Error('create failed');
  await sleep(800);
  // stamp protected + arbitrary unmodeled canary on the ROOM scenario unit (on disk)
  const CANARY='canary-'+roomId.slice(0,8); const u=readU(roomId); u.model.protected=true; u.model.__biteCanary=CANARY; writeFileSync(shard(roomId),JSON.stringify(u,null,2)); await sleep(400);
  R.setup = readU(roomId)?.model?.protected===true && readU(roomId)?.model?.__biteCanary===CANARY;
  // FORCE a re-persist that provably fires: rename via UPDATE_ROOM_CONFIG → cfgRoom.persist() → writeRoomJson rebuild
  c.send(JSON.stringify({type:'UPDATE_ROOM_CONFIG',roomId,name:'canary-room-RENAMED',playerToken:ST})); await sleep(1500);
  const after=readU(roomId);
  const renameFired = after?.model?.name==='canary-room-RENAMED'; // proves the rebuild actually ran (not 'nothing happened')
  const protectedSurvived = after?.model?.protected===true;
  const canarySurvived = after?.model?.__biteCanary===CANARY; // ★ the CLASS proof: arbitrary unmodeled field preserved
  R.preserve = renameFired && protectedSurvived && canarySurvived;
  console.log(`  ${R.preserve?'PASS':'★RED '} PRESERVE: rename-fired(rebuild ran)=${renameFired} + protected SURVIVED=${protectedSurvived} + ★canary SURVIVED=${canarySurvived} (setup=${R.setup})`);
  // EXPLICIT-UNSET honored (merge, not blind-freeze): explicitly set protected=false on disk → re-persist → stays false
  const u2=readU(roomId); u2.model.protected=false; writeFileSync(shard(roomId),JSON.stringify(u2,null,2)); await sleep(400);
  c.send(JSON.stringify({type:'UPDATE_ROOM_CONFIG',roomId,name:'canary-room-R2',playerToken:ST})); await sleep(1500);
  const unsetHonored = readU(roomId)?.model?.protected===false; // NOT resurrected to true
  R.unset = unsetHonored;
  console.log(`  ${R.unset?'PASS':'★RED '} EXPLICIT-UNSET honored (protected=false stays false after re-persist, merge not blind-freeze)=${unsetHonored}`);
  // cleanup throwaway (named delete via composite — v0.8.226 has it)
  c.send(JSON.stringify({type:'DELETE_ROOM',roomId})); await sleep(2000);
  R.pass = R.created && R.setup && R.preserve && R.unset;
}catch(e){R.error=String(e.message||e);R.pass=false}
finally{try{c.close()}catch{}}
console.log('\n=== v0.8.226 MARK-DURABILITY CANARY BITE (isolated rig) ===');
if(R.error)console.log('ERROR:',R.error);
console.log(R.pass?'★ GREEN — arbitrary unmodeled field + protected SURVIVE a proven re-persist (preserve-unknown CLASS fix), explicit-unset honored. Marks are DURABLE.':'★ RED');
process.exit(R.pass?0:1);
