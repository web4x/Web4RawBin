// R1 AC1 rig-replica (PO priority) — ISOLATED rig v0.8.240, SYNTHETIC identity, ZERO prod. Discriminate loader-hydration vs a real gap:
// does roomListFor(owner) return a PRIVATE room whose creatorToken is MISSING (edd7fa61's exact shape)?
// PHASE arg: 'create' = synthA creates a private room (creatorToken=synthA) + control-check owner sees it (expect YES).
//            'checkA' = after creatorToken STRIPPED on disk + rig REBOOT, does the owner still see it? (NO=real gap, YES=loader-rehydrates)
import WebSocket from 'ws'; import { readFileSync, writeFileSync } from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const WSS='wss://localhost:4601';
const WT='/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/inc7b-rig';
const TF=WT+'/ac1-tokens.json';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ids=rooms=>new Set((rooms||[]).map(r=>r.id||r.roomId).filter(Boolean));
// owner session: IDENTIFY + optional UPDATE_PROFILE + optional CREATE_ROOM; capture first post-auth ROOM_LIST + created roomId
function ownerSession(token, {commit, createKey}={}) { return new Promise(res=>{
  const ws=new WebSocket(WSS,{rejectUnauthorized:false}); const msgs=[]; let roomId=null, list=null, ident=false;
  ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return}msgs.push(m);
    if(m.type==='welcome'){ws.send(JSON.stringify({type:'IDENTIFY',playerToken:token,deviceId:'ac1'})); ident=true;}
    else if(m.type==='PROFILE'&&commit&&!ws.__c){ws.__c=true;ws.send(JSON.stringify({type:'UPDATE_PROFILE',name:'SynthOwner',secretCode:'0009'})); if(createKey)setTimeout(()=>ws.send(JSON.stringify({type:'CREATE_ROOM',roomName:'ac1-private',playerName:'SynthOwner',playerToken:token,roomKey:createKey})),1400);}
    else if(m.type==='ROOM_JOINED'){roomId=m.room?.id;}
    else if(m.type==='ROOM_LIST'&&ident){list=ids(m.rooms);}});
  ws.on('error',()=>{});
  setTimeout(()=>{try{ws.close()}catch{}; res({roomId, list: list?[...list]:[]});}, createKey?6000:4000);
});}
const phase=process.argv[2];
if(phase==='create'){
  const synthA='11111111-'+Math.floor(1e12+Math.random()*8e12).toString(16).padStart(12,'0').slice(0,4)+'-4a1a-8a1a-'+Date.now().toString(16).slice(-12);
  const r=await ownerSession(synthA,{commit:true,createKey:'k1'});
  // control-check: fresh session, does the owner's first list include the just-created private room?
  await sleep(800);
  const chk=await ownerSession(synthA,{});
  const included = r.roomId && chk.list.includes(r.roomId);
  writeFileSync(TF, JSON.stringify({synthA, roomId:r.roomId}));
  console.log('PHASE create: synthA='+synthA.slice(0,8)+' created private roomId='+(r.roomId||'FAIL')?.slice?.(0,8));
  console.log('CONTROL (creatorToken=synthA SET) → owner roomListFor includes it = '+included+' (expect YES; list='+chk.list.length+' rooms)');
  process.exit(included?0:1);
} else if(phase==='checkA'){
  const {synthA, roomId}=JSON.parse(readFileSync(TF,'utf8'));
  const chk=await ownerSession(synthA,{});
  const included = chk.list.includes(roomId);
  console.log('PHASE checkA (creatorToken STRIPPED on disk + rig REBOOTED): owner='+synthA.slice(0,8)+' roomId='+roomId.slice(0,8));
  console.log('roomListFor(owner) includes the creatorToken-MISSING private room = '+included);
  console.log(included ? '→ LOADER RE-HYDRATES creatorToken (from ownerToken/path) → NO GAP: edd7fa61 fine for Marcel, AC1 mechanism OK' : '→ ★ REAL GAP: creatorToken-MISSING private room ABSENT for its OWNER → edd7fa61 would be ABSENT for Marcel = AC1 RED (PO owes Tron a correction)');
  process.exit(0);
}
