// qa-evidence-audit.mjs — PRE-DEPLOY TRUTH TEST (PO 2026-08-11): the hardened approve path enforces a
// testing-evidence precondition (Done-writer delegation). A QA-Review task WITHOUT two-keyed passing
// testing evidence would 409 on Tron's approve tap. This audits: of the S30++ QA-Review tasks, how many
// carry it (WOULD-PASS) vs how many would 409 — and names the latter with what each is missing.
// Evidence = the SAME chain-edge as StepEvidence 'testing': a Test in Impl.tests[] AND Test.implementations[]
// back-refs that Impl AND Test.status==='pass'. Never prose. Measured from UNITS.
import fs from 'fs'; import path from 'path';
const IDX='/var/dev/Workspaces/web4x/Web4RawBin/scenario/index';
const SPRINTS={'2173e549':'S30','3c05f411':'S31','332585f3':'S32','b86b53cc':'S37','8e8b32d6':'S40'};
const bare=s=>String(s??'').replace('ior:instance:','');
const ORDER=['Planned','In Progress','QA Review','Done'];
const byU=new Map();
(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())w(p);else if(e.name.endsWith('.scenario.json')){try{const j=JSON.parse(fs.readFileSync(p,'utf8'));const m=j.model||{};if(m.uuid)byU.set(m.uuid,{ior:j.ior,m});}catch{}}}})(IDX);
const get=u=>byU.get(bare(u));
const der=cl=>{if(typeof cl!=='string')return'Planned';let b='Planned';for(const l of cl.split('\n')){const mm=l.match(/^- \[x\] (Planned|In Progress|QA Review|Done)/);if(mm&&ORDER.indexOf(mm[1])>ORDER.indexOf(b))b=mm[1];}return b;};
const sprintOf=t=>{let c=t,h=0;while(c&&h++<8){const p=(c.m.uuid||'').slice(0,8);if(SPRINTS[p])return SPRINTS[p];const par=c.m.parent?get(c.m.parent):null;if(!par)break;c=par;}const sn=String(t.m.sprintName||'').match(/Sprint (30|31|32|37|40)\b/);return sn?'S'+sn[1]:null;};

// per-task testing-evidence: returns {covered, reason}
function evidence(t){
  let anyImpl=false, shipped=false, testWired=false, testPassNot2key=false, covered=false, testName='';
  for(const r of (t.m.coveredRequirements||[]).map(get).filter(Boolean))
    for(const uc of (r.m.useCases||[]).map(get).filter(Boolean)){
      const M=uc.m.method?get(uc.m.method):null; if(!M) continue;
      for(const im of (M.m.implementations||[]).map(get).filter(Boolean)){
        anyImpl=true; if(im.m.markerPending===false) shipped=true;
        for(const teu of (im.m.tests||[])){ testWired=true; const te=get(teu); if(!te)continue;
          const tk=(te.m.implementations||[]).some(x=>bare(x)===im.m.uuid);
          if(te.m.status==='pass'&&tk){covered=true;testName=(te.m.name||'').slice(0,45);}
          else if(te.m.status==='pass'&&!tk){testPassNot2key=true;}
        }
      }
    }
  let reason='';
  if(covered) reason='OK: two-keyed passing Test ('+testName+')';
  else if(!anyImpl) reason='NO Impl on chain (unbuilt)';
  else if(!shipped) reason='Impl exists but markerPending (not shipped)';
  else if(!testWired) reason='Impl shipped but NO Test wired (Impl.tests[] empty) — needs gate';
  else if(testPassNot2key) reason='Test passes but NOT two-keyed to the Impl (Test.implementations[] missing back-ref)';
  else reason='Test wired but status != pass (needs tester two-key)';
  return {covered, reason};
}

const qa=[...byU.values()].filter(x=>x.ior==='ior:class:Task'&&sprintOf(x)&&der(x.m.statusChecklist)==='QA Review');
const pass=[], would409=[];
for(const t of qa){ const e=evidence(t); (e.covered?pass:would409).push({sp:sprintOf(t),uuid:(t.m.uuid||'').slice(0,8),name:(t.m.name||'').slice(0,52),reason:e.reason}); }
console.log('=== PRE-DEPLOY QA-REVIEW EVIDENCE AUDIT (measured from units) ===');
console.log('QA-Review tasks S30++:', qa.length, '| WOULD-PASS approve:', pass.length, '| WOULD-409:', would409.length);
console.log('\n-- WOULD-409 (lack two-keyed passing testing evidence) --');
if(!would409.length) console.log('  (none — all QA-Review tasks carry two-keyed passing testing evidence)');
for(const r of would409.sort((a,b)=>a.sp.localeCompare(b.sp))) console.log(`  ${r.sp} ${r.uuid} ${r.name} :: ${r.reason}`);
