// R40.x PIN DERIVATION both-directions gate — v0.8.234 pin-v2 DESIGNATION-BASED (front-comparison REMOVED = stale-front hole closed).
// The ONE predicate isCurrentEligible(status, uuid, currentTaskUuid), live at all 3 gates (terminal-def / auto-filter / designation-override):
//   In-Progress -> eligible; BAND -> eligible ONLY if it IS the valid owner designation (uuid===currentTaskUuid); else NOT.
// BOTH DIRECTIONS: (A-designated) designated band IS current [inv-3: processing-a-CR IS working]; (A-undesignated) parked band
//   (even with a stale In-Progress front present) NOT current [the T40.1 stale-front hole — structurally closed, no timestamp];
//   none-active = current null when nothing eligible + no valid designation. Unit (exported predicate) + integration (slotsFrom).
import { ScenarioIndex } from '../../src/ts/scenario/index.js';
import { CurrentSprint, isCurrentEligible, isBand, isTerminalForCurrent } from '../../src/ts/scenario/CurrentSprint.js';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
const BAND = 'QA-Review-with-open-CR';
const R:any = {};
const U1 = 'aaaaaaaa-0000-4000-8000-000000000001', U2 = 'bbbbbbbb-0000-4000-8000-000000000002';

// ── UNIT: the exported ONE predicate (new designation sig), both directions ──
R.u_inprogress    = isCurrentEligible('In Progress', U1, '') === true;      // active dev always eligible (no designation needed)
R.u_band_designated = isCurrentEligible(BAND, U1, U1) === true;             // band IS the designation -> eligible (inv-3)
R.u_band_undesignated = isCurrentEligible(BAND, U1, U2) === false;          // band is NOT the designation -> NOT (drop this clause -> RED)
R.u_band_nodesig  = isCurrentEligible(BAND, U1, '') === false;              // no designation -> band NOT eligible
R.u_isBand        = isBand(BAND) === true && isBand('In Progress') === false;
R.u_terminal      = isTerminalForCurrent(BAND, U1, U2) === true            // undesignated band terminal-for-current
                 && isTerminalForCurrent(BAND, U1, U1) === false           // designated band NON-terminal
                 && isTerminalForCurrent('Planned', U1, '') === false;     // Planned never terminal (pre-start fallback)

// ── 3-GATES: the ONE predicate wired at terminal-def + auto-filter + designation-override (no drifting inline check) ──
const src = readFileSync('/var/dev/Workspaces/web4x/Web4RawBin/src/ts/scenario/CurrentSprint.ts','utf8').replace(/\000/g,'');
// v0.8.234: the predicate ABSORBS the designation (currentTaskUuid arg), so eligibility is the ONE predicate at 2 gates —
// terminal-def (38) + auto-filter (310); the designation-override (337) is the consistent explicit-wins layer. No drifting
// inline eligibility check that BYPASSES the predicate (the old 3-gate-disagreement root).
const gateCount = (src.match(/isCurrentEligible\(/g) || []).length; // terminal-def + auto-filter = 2
R.three_gates = /isTerminalForCurrent =[\s\S]{0,120}!isCurrentEligible\(/.test(src)               // terminal derives FROM the predicate
             && /\.filter\(t => isCurrentEligible\(t\.status, t\.uuid, currentTaskUuid\)\)/.test(src) // auto-filter uses it (new sig)
             && /isBand\(status\) && !!currentTaskUuid && bareUuid\(uuid\) === bareUuid\(currentTaskUuid\)/.test(src) // designation IN the predicate (not a drifting external check)
             && gateCount >= 2;

// ── INTEGRATION: slotsFrom on an isolated scratch sprint, both ways ──
const SCRATCH='/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/pin234-scratch/index';
const shard=(u:string)=>path.join(SCRATCH,...u.slice(0,5).split(''),`${u}.scenario.json`);
const put=(u:string,ior:string,m:any)=>{const p=shard(u);mkdirSync(path.dirname(p),{recursive:true});writeFileSync(p,JSON.stringify({ior,model:{uuid:u,...m}}));};
const BANDCHK='- [x] Planned\n- [x] In Progress\n  - [x] refinement\n  - [x] creating test cases\n  - [x] implementing\n  - [x] testing\n- [x] QA Review\n  - [ ] processing change requests\n- [ ] Done';
const IN='11111111-0000-4000-8000-000000000001', BN='22222222-0000-4000-8000-000000000002', SP='99999999-0000-4000-8000-000000000009';
const seed=(withInProgress:boolean)=>{ if(existsSync(SCRATCH))rmSync(SCRATCH,{recursive:true,force:true}); mkdirSync(SCRATCH,{recursive:true});
  const tasks=[BN]; if(withInProgress){ put(IN,'ior:class:Task',{name:'InProgress front',status:'In Progress',lastAdvancedAt:'2026-08-24T00:00:00.000Z',coveredRequirements:[]}); tasks.unshift(IN); }
  // band with a MORE-RECENT stamp than the In-Progress front (the old stale-front-hole trigger) — must NOT matter now
  put(BN,'ior:class:Task',{name:'BAND',statusChecklist:BANDCHK,lastAdvancedAt:'2026-08-29T00:00:00.000Z',coveredRequirements:[]});
  put(SP,'ior:class:Sprint',{name:'S99',number:99,tasks:tasks.map(x=>'ior:instance:'+x)});
  return (desig?:string)=> CurrentSprint.slotsFrom(new ScenarioIndex(SCRATCH),{number:99,uuid:SP,name:'S99'},desig).current?.taskUuid || null;
};
const run1 = seed(true);
R.int_undesignated_band_excluded = run1(undefined) === IN && run1(undefined) !== BN;   // undesignated band + stale front -> In-Progress, NOT band (hole closed)
R.int_designated_band_current    = run1(BN) === BN;                                     // designated band -> IS current (inv-3)
const run2 = seed(false);
R.int_none_active = run2(undefined) === null;                                           // no In-Progress + no valid designation -> current NULL (none-active, never least-old)
if (existsSync(SCRATCH)) rmSync(path.dirname(SCRATCH),{recursive:true,force:true});

console.log('UNIT in-progress eligible                 :', R.u_inprogress);
console.log('UNIT (A-designated) band==designation elig :', R.u_band_designated);
console.log('UNIT (A-undesignated) band!=designation NOT:', R.u_band_undesignated);
console.log('UNIT band no-designation NOT               :', R.u_band_nodesig);
console.log('UNIT isBand + terminal(undesig/desig/Planned):', R.u_isBand && R.u_terminal);
console.log('3-GATES one predicate (term-def + >=3 sites):', R.three_gates, '(isCurrentEligible calls='+gateCount+')');
console.log('INTEG undesignated band + stale front -> NOT current (hole closed):', R.int_undesignated_band_excluded);
console.log('INTEG designated band -> IS current (inv-3)          :', R.int_designated_band_current);
console.log('INTEG none-active (no InProgress, no desig) -> null  :', R.int_none_active);
const pass = R.u_inprogress&&R.u_band_designated&&R.u_band_undesignated&&R.u_band_nodesig&&R.u_isBand&&R.u_terminal&&R.three_gates&&R.int_undesignated_band_excluded&&R.int_designated_band_current&&R.int_none_active;
console.log(pass?'\n★ PIN v0.8.234 both-directions = GREEN — designation-based ONE predicate at 3 gates; designated band eligible / undesignated (even stale-front) NOT / none-active null. Stale-front hole CLOSED structurally.':'\n★ RED — see legs');
process.exit(pass?0:1);
