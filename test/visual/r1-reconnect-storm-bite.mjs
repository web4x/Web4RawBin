// R1 VISIBILITY BITE — induce a close-loop (>5 closes/min for one token) → the RECONNECT-STORM alarm MUST fire (visible).
// Rig, synthetic token, ZERO prod. (Neuter/invisible half done separately by raising the threshold on the rig + re-running.)
import WebSocket from 'ws'; import { randomUUID } from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const WSS='wss://localhost:4601'; const TOK=process.argv[2]||('storm-'+randomUUID());
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function connectThenClose(i){return new Promise(res=>{
  const ws=new WebSocket(WSS,{rejectUnauthorized:false}); let code=null;
  ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return} if(m.type==='welcome'){ws.send(JSON.stringify({type:'IDENTIFY',playerToken:TOK,deviceId:'storm'})); setTimeout(()=>{try{ws.close(4001,'bite-induced-close')}catch{}},400);}});
  ws.on('close',(c)=>{code=c;res(c);}); ws.on('error',()=>res('err'));
});}
console.log('=== R1 reconnect-storm BITE — token '+TOK.slice(0,12)+', inducing 8 close-loops (>5/min → alarm MUST fire) ===');
for(let i=1;i<=8;i++){ const c=await connectThenClose(i); console.log('  close '+i+' code='+c); await sleep(500); }
console.log('done inducing 8 closes in ~7s (rate>5/min). Read data-r1/logs for the ⚠ RECONNECT-STORM alarm + close codes.');
process.exit(0);
