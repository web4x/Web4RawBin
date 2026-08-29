// Tron fact-2: after make-current, the NEXT task slot never updates (even after reload) = a DATA/derivation defect.
// Scratch@HEAD 0.8.143: read the CurrentSprint pin slots, make-current a NEW task (demoting the prior current),
// re-read the slots → assert current=new AND next=demoted-prior. If next stays empty/stale = fact-2 reproduced.
import { setupFoundation } from './r4031-foundation.mjs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const CS='current-sprint-singleton-0000-000000000001';
const B='9a70ce5e-7e88-45f9-b921-0f8e9caf07a6'; // Sprint-40 Task 40.10
const HARD=setTimeout(()=>{console.log('RED: WATCHDOG');process.exit(1);},180000);
const f=await setupFoundation({commit:'HEAD',buildDist:true}); const oh=f.ownerHeaders();
const slots=async()=>{const r=await fetch(`${f.base}/api/trace/children/${CS}?mode=trace`,{signal:AbortSignal.timeout(15000)}).catch(()=>null); if(!r)return{}; const d=await r.json(); const ch=d.children||[];
  const pick=role=>{const c=(Array.isArray(ch)?ch:[]).find(x=>x.role===role||new RegExp(role,'i').test(x.name||'')); return c?{uuid:(c.uuid||'').slice(0,8),name:(c.name||'').slice(0,50)}:null;};
  return {current:pick('current'), next:pick('next|backlog'), last:pick('last|completed')};};
try{
  console.log(`scratch@HEAD served=${f.servedVersion} sha=${f.worktreeSha}`);
  const before=await slots();
  console.log('BEFORE make-current: current=',JSON.stringify(before.current),' next=',JSON.stringify(before.next));
  await fetch(`${f.base}/api/task/${B}/decline`,{method:'POST',headers:oh,signal:AbortSignal.timeout(15000)}).catch(()=>{}); // decline first so the designation STICKS (band), not auto-advanced
  const mc=await fetch(`${f.base}/api/task/${B}/make-current`,{method:'POST',headers:oh,signal:AbortSignal.timeout(15000)}).then(r=>r.status).catch(()=>0);
  console.log('make-current(40.10) →',mc);
  const after=await slots();
  console.log('AFTER  make-current: current=',JSON.stringify(after.current),' next=',JSON.stringify(after.next));
  const currentIsB = /40\.10/.test(after.current?.name||'') || after.current?.uuid==='9a70ce5e';
  const priorUuid = before.current?.uuid;
  const nextIsDemotedPrior = priorUuid && after.next && after.next.uuid===priorUuid;
  const nextChanged = JSON.stringify(before.next)!==JSON.stringify(after.next);
  console.log(`\n  current moved to B: ${currentIsB} | NEXT shows demoted-prior (${priorUuid}): ${nextIsDemotedPrior} | NEXT changed at all: ${nextChanged}`);
  console.log(nextIsDemotedPrior ? 'GREEN: NEXT slot updates to the demoted prior current (fact-2 NOT reproduced on scratch)'
    : `RED: NEXT slot did NOT become the demoted prior (${priorUuid}) — after.next=${JSON.stringify(after.next)} = fact-2 (NEXT never updates) REPRODUCED on scratch = a DATA/derivation defect`);
} finally { const td=await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); clearTimeout(HARD); process.exit(0); }
