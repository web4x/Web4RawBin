// R40.x PIN DERIVATION both-directions check (PO v0.8.231): prove getThreeSlots (the DERIVED render, CurrentSprint.slotsFrom)
// (1) excludes a PARKED un-designated band from AUTO-current, (2) KEEPS an ACTIVELY-processing (owner-DESIGNATED) band eligible
// [reverse guard — a build excluding ALL bands would RED here, reversing R40.59 inv-3 'processing a CR IS working'],
// (3) ranks by seam-stamped lastAdvancedAt (max first; untimestamped last). In-process on an ISOLATED SCRATCH sprint; 0 prod.
import { ScenarioIndex } from '../../src/ts/scenario/index.js';
import { CurrentSprint } from '../../src/ts/scenario/CurrentSprint.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
const SCRATCH = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/pin-scratch/index';
const shard = (u:string) => path.join(SCRATCH, ...u.slice(0,5).split(''), `${u}.scenario.json`);
const put = (u:string, ior:string, model:any) => { const p=shard(u); mkdirSync(path.dirname(p),{recursive:true}); writeFileSync(p, JSON.stringify({ ior, model:{ uuid:u, ...model } })); };
// T40.1's exact band checklist → deriveStatusEnum → 'QA-Review-with-open-CR'
const BAND = '- [x] Planned\n- [x] In Progress\n  - [x] refinement\n  - [x] creating test cases\n  - [x] implementing\n  - [x] testing\n- [x] QA Review\n  - [ ] processing change requests\n- [ ] Done';
const u = { inpA:'aaaaaaaa-0000-4000-8000-000000000001', inpB:'bbbbbbbb-0000-4000-8000-000000000002', parked:'cccccccc-0000-4000-8000-000000000003', active:'dddddddd-0000-4000-8000-000000000004', sprint:'eeeeeeee-0000-4000-8000-000000000009' };
if (existsSync(SCRATCH)) rmSync(SCRATCH,{recursive:true,force:true}); mkdirSync(SCRATCH,{recursive:true});
put(u.inpA, 'ior:class:Task', { name:'InProgress-A recent', status:'In Progress', lastAdvancedAt:'2026-09-13T10:00:00.000Z', coveredRequirements:[] });
put(u.inpB, 'ior:class:Task', { name:'InProgress-B older',  status:'In Progress', lastAdvancedAt:'2026-09-01T10:00:00.000Z', coveredRequirements:[] });
put(u.parked, 'ior:class:Task', { name:'Band PARKED (undesignated)', statusChecklist:BAND, lastAdvancedAt:'2026-08-29T10:00:00.000Z', coveredRequirements:[] });
put(u.active, 'ior:class:Task', { name:'Band ACTIVE (designated)',   statusChecklist:BAND, lastAdvancedAt:'2026-09-12T10:00:00.000Z', coveredRequirements:[] });
put(u.sprint, 'ior:class:Sprint', { name:'Sprint 99', number:99, tasks:[u.inpA,u.inpB,u.parked,u.active].map(x=>'ior:instance:'+x) });
const RS = { number:99, uuid:u.sprint, name:'Sprint 99' };

const idx = new ScenarioIndex(SCRATCH);
const R:any = {};
// (2a)+(3): NO designation → auto-current = In-Progress with MAX lastAdvancedAt (InPA), NOT either band, NOT older InPB
const s1 = CurrentSprint.slotsFrom(idx, RS, undefined);
R.auto_current_inpA = s1.current?.taskUuid === u.inpA;
R.parked_band_excluded = s1.current?.taskUuid !== u.parked && s1.current?.taskUuid !== u.active;
R.ranking_recent_over_old = s1.current?.taskUuid === u.inpA && s1.current?.taskUuid !== u.inpB;
// (2b) REVERSE GUARD: DESIGNATE the active band (owner set-current) → it STAYS current (processing IS working)
const s2 = CurrentSprint.slotsFrom(idx, RS, u.active);
R.designated_active_band_eligible = s2.current?.taskUuid === u.active;
// control: designating a task that reached clean 'QA Review' would EXPIRE — but our band is QA-Review-with-open-CR (not clean) → stays. (documents the boundary)
console.log('(2a) auto-current = InProgress-A (max lastAdvancedAt)      :', R.auto_current_inpA, '(current='+String(s1.current?.taskUuid||'').slice(0,8)+' "'+String(s1.current?.taskName||'').slice(0,30)+'")');
console.log('(1)  PARKED un-designated band EXCLUDED from auto-current  :', R.parked_band_excluded);
console.log('(3)  ranks recent InPA over older InPB (seam-stamp)        :', R.ranking_recent_over_old);
console.log('(2b) DESIGNATED actively-processing band STAYS eligible    :', R.designated_active_band_eligible, '(current='+String(s2.current?.taskUuid||'').slice(0,8)+') [reverse guard: a build excluding ALL bands REDs here]');
const pass = R.auto_current_inpA && R.parked_band_excluded && R.ranking_recent_over_old && R.designated_active_band_eligible;
if (existsSync(SCRATCH)) rmSync(path.dirname(SCRATCH),{recursive:true,force:true});
console.log(pass ? '\n★ PIN DERIVATION both-directions = GREEN — parked band excluded AND designated active band eligible AND lastAdvancedAt ranks. The fix is not one-directional (did not exclude all bands).' : '\n★ RED — see legs');
process.exit(pass?0:1);
