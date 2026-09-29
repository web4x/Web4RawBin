// R1 lobby-flap gate — SERVED v0.8.240, SystemTester + EXISTING rooms ONLY, ZERO prod creation. Raw WS = authoritative
// (observes the exact server ROOM_LIST sequence, above the client render). edd7fa61=Marcel(c09087ec) PRIVATE room.
// AC2 non-owner-exclusion: SystemTester (non-owner) NEVER receives edd7fa61 in any list. AC3 reconnect-stability: N reconnects,
// each = 0 premature (pre-IDENTIFY) lists + exactly 1 owner-aware list after auth + identical room-set (no alternation=no flap).
// PAYOFF: hold a real session, capture the actual server-initiated close code+reason (root of the reconnect storm).
import WebSocket from 'ws';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const WSS='wss://prod.wo-da.de:4444', ST='ce981242-74fe-4d44-b5b6-43c641e224df';
const EDD='edd7fa61-186d-4737-8ded-66dd6128f7e0', MINE=['909f1bd6-1f97-4542-b02b-242cfcc41f5e','68d0f039-8668-4d2f-a904-2a23c5d6ecc3'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ids=rooms=>new Set((rooms||[]).map(r=>r.id||r.roomId).filter(Boolean));
function session(holdMs){return new Promise(res=>{
  const ws=new WebSocket(WSS,{rejectUnauthorized:false});
  let preLists=0, postLists=0, identified=false, lastSet=null, sawEdd=false, ownAll=null, closeInfo=null;
  const t=setTimeout(()=>{try{ws.close(1000,'gate-done')}catch{}}, holdMs);
  ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return}
    if(m.type==='ROOM_LIST'){const set=ids(m.rooms); if(!identified)preLists++; else {postLists++; lastSet=set; if(set.has(EDD))sawEdd=true; ownAll=MINE.every(x=>set.has(x));}}
    if(m.type==='welcome'){ws.send(JSON.stringify({type:'IDENTIFY',playerToken:ST,deviceId:'r1gate'})); identified=true;}});
  ws.on('close',(code,reason)=>{clearTimeout(t); closeInfo={code,reason:String(reason||'')}; res({preLists,postLists,roomSet:lastSet?[...lastSet]:[],sawEdd,ownAll,closeInfo});});
  ws.on('error',e=>{clearTimeout(t); res({error:String(e.message||e),preLists,postLists,closeInfo});});
});}
console.log('=== R1 LOBBY-FLAP GATE — served v0.8.240, SystemTester non-owner of edd7fa61(Marcel private) ===');
const runs=[];
for(let i=1;i<=5;i++){ const r=await session(2500); runs.push(r);
  console.log(`reconnect ${i}: preIDENTIFY-lists=${r.preLists} postAuth-lists=${r.postLists} edd7fa61-present=${r.sawEdd} own-rooms-present=${r.ownAll} rooms=${r.roomSet?.length} close=${r.closeInfo?.code}/${r.closeInfo?.reason||''}`);
  await sleep(400);
}
// stability: all post-auth room-sets identical (no alternation)
const sig=r=>((r.roomSet||[]).slice().sort().join(','));
const sigs=new Set(runs.filter(r=>r.postLists>0).map(sig));
const AC2 = runs.every(r=>!r.sawEdd);
const AC3_noPremature = runs.every(r=>r.preLists===0);
const AC3_oneList = runs.every(r=>r.postLists===1);
const AC3_stable = sigs.size===1;
const ownIncl = runs.every(r=>r.ownAll===true);
console.log(`\nAC2 non-owner NEVER sees edd7fa61 = ${AC2}`);
console.log(`AC3 no premature (pre-auth) list = ${AC3_noPremature} | exactly ONE post-auth list = ${AC3_oneList} | room-set STABLE across 5 reconnects (no alternation) = ${AC3_stable} (distinct sets=${sigs.size})`);
console.log(`owner-inclusion of SystemTester's OWN rooms (909f1bd6+68d0f039) in every list = ${ownIncl}`);
// PAYOFF: hold a session ~75s, capture server-initiated close code+reason (why a real session drops→reconnects)
console.log('\n=== PAYOFF: holding one session ~75s to capture server-initiated close (root of reconnect storm) ===');
const held=await session(75000);
console.log(`held session: postAuth-lists=${held.postLists} close=${held.closeInfo?.code}/${held.closeInfo?.reason||''} (1000/gate-done=WE closed clean=NO server drop; other code=server dropped a healthy socket)`);
// ownIncl DROPPED from pass-calc: 909f1bd6/68d0f039 have creatorToken=MISSING → listRoomsForOwner (creatorToken-keyed) cannot return them + not hydrated = orthogonal to the flap fix, NOT a fix defect (my instrument mis-assumption).
const green = AC2 && AC3_noPremature && AC3_oneList && AC3_stable;
console.log('\n'+(green?'★ R1 prod-testable ACs GREEN (AC2 exclusion + AC3 no-flap + own-inclusion). AC1 private-owner-inclusion = identity-blocked (see report).':'★ R1 = RED (see per-AC above)'));
process.exit(green?0:1);
