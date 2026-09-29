// R1 AC1 residual-2 (PO): listRoomsForOwner does creatorToken===ownerToken EXACT. A session token that RESOLVES to the owner
// (redirectTo) but is NOT EQUAL must STILL see the owner's private room (Marcel: 41ad88c4 redirectTo c09087ec). RED baseline on
// v0.8.240 (exact-match, no resolveToken) = the resolves-to-owner session does NOT see it. GREEN when expert ships Room.resolveToken.
// Non-owner (resolves to self/elsewhere) must NEVER see it (both builds). Rig + synthetic tokens, ZERO prod.
import WebSocket from 'ws'; import { readFileSync } from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const WSS='wss://localhost:4601';
const WT='/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/inc7b-rig';
const {synthA,synthB,synthC,roomId}=JSON.parse(readFileSync(WT+'/r1res2-tokens.json','utf8'));
const ids=rooms=>new Set((rooms||[]).map(r=>r.id||r.roomId).filter(Boolean));
function seesRoom(token){return new Promise(res=>{
  const ws=new WebSocket(WSS,{rejectUnauthorized:false}); let list=null, ident=false;
  ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return}
    if(m.type==='welcome'){ws.send(JSON.stringify({type:'IDENTIFY',playerToken:token,deviceId:'res2'}));ident=true;}
    else if(m.type==='ROOM_LIST'&&ident){list=ids(m.rooms);}});
  ws.on('error',()=>{}); setTimeout(()=>{try{ws.close()}catch{};res(list?list.has(roomId):false);},4000);
});}
console.log('=== R1 AC1 residual-2 (session-token != creatorToken) — rig v0.8.240 (exact-match, pre-resolveToken-fix) ===');
const a=await seesRoom(synthA), b=await seesRoom(synthB), c=await seesRoom(synthC);
console.log('owner-EQUAL synthA='+synthA.slice(0,8)+' sees private room = '+a+' (sanity, expect YES)');
console.log('RESOLVES-to-owner synthB='+synthB.slice(0,8)+' (redirectTo synthA) sees it = '+b+' (v0.8.240 expect NO = RED = the bug; fix→YES)');
console.log('distinct NON-OWNER synthC='+synthC.slice(0,8)+' sees it = '+c+' (expect NO both builds = correct exclusion)');
const redBaselineProven = a===true && b===false && c===false; // the gate CATCHES the real bug on the current build
console.log('\n'+(redBaselineProven ? '★ RED BASELINE PROVEN: gate catches the resolves-to-owner-not-equal bug (synthB absent) + owner-equal sees it + non-owner excluded. GREEN criterion on fix: synthB flips to YES, synthC stays NO.' : '★ NOT the expected RED baseline (a='+a+' b='+b+' c='+c+') — investigate before trusting.'));
process.exit(redBaselineProven?0:1);
