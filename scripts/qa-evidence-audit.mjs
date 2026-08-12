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
  return {covered, reason, testName};
}

// device-action AC detector (bucket 3 of the verdict-surface): a task whose ACs need Tron's DEVICE/pixel act
// (@390 tap/render), a distinct act from approving. Measured from the task's own AC/remaining text — NOT a 2nd list.
const DEVICE=/device-only|iOS|never.?headless|Tron device|@390|AC-5-DEVICE|real.?webkit|pixel|tap.?fires?|drawer renders/i;
const needsDevice=t=>DEVICE.test(t.m.acceptanceCriteria||'')||DEVICE.test(t.m.remainingIssues||'')||DEVICE.test(t.m.description||'');

const qa=[...byU.values()].filter(x=>x.ior==='ior:class:Task'&&sprintOf(x)&&der(x.m.statusChecklist)==='QA Review');
const rows=qa.map(t=>{const e=evidence(t);return{sp:sprintOf(t),uuid:(t.m.uuid||'').slice(0,8),name:(t.m.name||'').slice(0,52),covered:e.covered,testName:e.testName,reason:e.reason,device:needsDevice(t),checklist:t.m.statusChecklist||''};}).sort((a,b)=>a.sp.localeCompare(b.sp)||a.uuid.localeCompare(b.uuid));

// --json: SINGLE SOURCE for the verdict-surface (scripts/approve-queue-region.ts). Measured from units; the .ts
// writer FORMATS + maps status via the shared statusSymbol (task-status.ts) — no 2nd measurement, no 2nd vocabulary.
if(process.argv.includes('--json')){
  process.stdout.write(JSON.stringify({
    counts:{qaReview:rows.length, wouldPass:rows.filter(r=>r.covered).length, would409:rows.filter(r=>!r.covered).length, device:rows.filter(r=>r.device).length},
    qaTasks:rows,
  }));
  process.exit(0);
}

const pass=rows.filter(r=>r.covered), would409=rows.filter(r=>!r.covered);
console.log('=== PRE-DEPLOY QA-REVIEW EVIDENCE AUDIT (measured from units) ===');
console.log('QA-Review tasks S30++:', rows.length, '| WOULD-PASS approve:', pass.length, '| WOULD-409:', would409.length, '| needs-device:', rows.filter(r=>r.device).length);
console.log('\n-- WOULD-409 (lack two-keyed passing testing evidence) --');
if(!would409.length) console.log('  (none — all QA-Review tasks carry two-keyed passing testing evidence)');
for(const r of would409) console.log(`  ${r.sp} ${r.uuid} ${r.name} :: ${r.reason}`);
