// R1 AC1 residual-2 FAITHFUL gate (expert-confirmed 2-hop RED shape). Rig, synthetic, ZERO prod.
// X.redirectTo=M, M.redirectTo=OWNER, room.creatorToken=OWNER. IDENTIFY resolves ONE hop (X→M)+rebinds session→M;
// roomListFor(M) EXACT-misses on v0.8.240 (creatorToken=OWNER≠M) = RED; v0.8.241 Room.resolveToken(M)=OWNER (hop2) = GREEN.
// Controls: OWNER-direct sees it (sanity); Z→different-primary never sees (both versions). X3 (3-hop) = expert's KNOWN LIMITATION
// (single-hop resolveToken covers only 2 total hops) → still absent on v0.8.241 until the multi-hop chain-follow refinement.
import WebSocket from 'ws'; import { readFileSync } from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const WSS='wss://localhost:4601';
const WT='/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/inc7b-rig';
const T=JSON.parse(readFileSync(WT+'/r1chain-tokens.json','utf8'));
const served=process.argv[2]||'?';
const ids=r=>new Set((r||[]).map(x=>x.id||x.roomId).filter(Boolean));
const sees=token=>new Promise(res=>{const ws=new WebSocket(WSS,{rejectUnauthorized:false});let list=null,id=false;
  ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return}
    if(m.type==='welcome'){ws.send(JSON.stringify({type:'IDENTIFY',playerToken:token,deviceId:'chain'}));id=true;}
    else if(m.type==='ROOM_LIST'&&id)list=ids(m.rooms);});
  ws.on('error',()=>{});setTimeout(()=>{try{ws.close()}catch{};res(list?list.has(T.roomId):false);},4000);});
console.log('=== R1 AC1 2-hop resolve gate — served '+served+' ===');
const owner=await sees(T.synthA), x2=await sees(T.synthX), z=await sees(T.synthZ), x3=await sees(T.synthX3);
console.log('OWNER-direct sees room        = '+owner+'  (sanity, expect YES both versions)');
console.log('X 2-HOP→M→OWNER sees room     = '+x2+'  (v0.8.240 expect NO=RED / v0.8.241 expect YES=GREEN)');
console.log('Z non-owner→different-primary = '+z+'  (expect NO both versions = correct exclusion)');
console.log('X3 3-HOP→M2→M1→OWNER sees room= '+x3+'  (expert LIMITATION: NO both versions until multi-hop refine)');
process.exit(0);
