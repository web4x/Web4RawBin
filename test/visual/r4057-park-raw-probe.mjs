// bug(ii) discriminator: park→designate→IMMEDIATE endpoint read (read-after-write, the agreement RED's exact staging).
import { setupFoundation } from './r4031-foundation.mjs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const CSU='current-sprint-singleton-0000-000000000001';
const T40='7a956c21-5f37-4062-b921-9bdd5a461546'; // designate 40.1
const T37='4bc1b3d5';                              // park task prefix (37.2), discover full below
const f=await setupFoundation({commit:'HEAD',buildDist:true}); const oh=f.ownerHeaders();
const jf=(u)=>fetch(`${f.base}${u}`,{headers:oh}).then(r=>r.json()).catch(e=>({__e:String(e)}));
const cur=async(mode)=>{const d=await jf(`/api/trace/children/${CSU}${mode}`);const k=(d?.children||[]);const c=k.find(x=>x.role==='current');return c?`${c.uuid.slice(0,8)}(role=current,pinSlot=${c.pinSlot})`:'(NONE role=current)';};
try{
  // discover the park task full uuid (a non-40.1 task in the sprint)
  const kids=(await jf(`/api/trace/children/${CSU}?mode=trace`))?.children||[];
  const park=(kids.find(x=>String(x.uuid||'').startsWith(T37))||{}).uuid || kids.find(x=>x.uuid!==T40)?.uuid;
  console.log(`STATE: LIVE served=${f.servedVersion} sha=${f.worktreeSha}. park=${park?.slice(0,8)} designate=${T40.slice(0,8)}`);
  await fetch(`${f.base}/api/task/${park}/make-current`,{method:'POST',headers:oh}); // PARK
  console.log(`after PARK(${park?.slice(0,8)}): mode=trace endpoint current = ${await cur('?mode=trace')}`);
  await fetch(`${f.base}/api/task/${T40}/make-current`,{method:'POST',headers:oh}); // DESIGNATE (no settle)
  console.log(`IMMEDIATELY after DESIGNATE(40.1) [read-after-write]: mode=trace = ${await cur('?mode=trace')} · no-mode = ${await cur('')}`);
  // and again after a short settle to see if it converges
  await new Promise(r=>setTimeout(r,1500));
  console.log(`after 1.5s settle: mode=trace = ${await cur('?mode=trace')}`);
} finally { const td=await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
