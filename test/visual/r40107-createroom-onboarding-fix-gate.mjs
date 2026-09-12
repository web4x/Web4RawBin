// v0.8.224 CREATE-fix co-verify: the EXACT 2 cases proven broken pre-fix must now SUCCEED (ROOM_JOINED). End-to-end WS CREATE_ROOM.
import WebSocket from 'ws'; import { readFileSync } from 'node:fs'; import { randomUUID } from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const WSS='wss://localhost:4601';
const WT='/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/inc7b-rig';
const {Ru,Pu}=JSON.parse(readFileSync(WT+'/falsifier-tokens.json','utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function createRoom(token, needProfile, label){
  const msgs=[]; const ws=new WebSocket(WSS,{rejectUnauthorized:false});
  ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return} msgs.push(m);
    if(m.type==='welcome')ws.send(JSON.stringify({type:'IDENTIFY',playerToken:token,deviceId:'cf'}));
    else if(m.type==='PROFILE'&&!ws.__c){ws.__c=true; if(needProfile)ws.send(JSON.stringify({type:'UPDATE_PROFILE',name:label,secretCode:'0007'})); setTimeout(()=>ws.send(JSON.stringify({type:'CREATE_ROOM',roomName:label+'-room',playerName:label,playerToken:token})), needProfile?1400:800)}});
  ws.on('error',()=>{});
  await sleep(needProfile?5000:4000);
  const j=msgs.find(m=>m.type==='ROOM_JOINED'); const e=msgs.find(m=>m.type==='ERROR');
  try{ws.close()}catch{}
  return j?{ok:true,roomId:j.room?.id}:{ok:false,err:e?.message||'SILENCE(threw)'};
}
const NEW=randomUUID();
const r1=await createRoom(NEW,true,'NewUser');   // (ii) distinct primary no-redirect
const r2=await createRoom(Ru,false,'RedirectUser'); // (iii) existing redirect→present primary (already committed+seeded)
console.log('(ii) NEW-USER distinct('+NEW.slice(0,8)+') CREATE_ROOM →', r1.ok?('ROOM_JOINED '+r1.roomId?.slice(0,8)+' ✓ SUCCEEDS'):('✗ '+r1.err));
console.log('(iii) REDIRECT('+Ru.slice(0,8)+'→'+Pu.slice(0,8)+') CREATE_ROOM →', r2.ok?('ROOM_JOINED '+r2.roomId?.slice(0,8)+' ✓ SUCCEEDS'):('✗ '+r2.err));
console.log(r1.ok&&r2.ok?'★ v0.8.224 CREATE-FIX VERIFIED — both pre-fix-broken cases now SUCCEED. Architect may SIGN.':'★ RED — still broken');
process.exit(r1.ok&&r2.ok?0:1);
