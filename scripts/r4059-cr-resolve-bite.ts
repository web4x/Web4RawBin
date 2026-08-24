// R40.1 CR-RESOLVE (#86) BITE — the owner resolve-cr action clears the band by ticking the 'processing change requests'
// sub-step through the EXISTING seam. Proves: (1) a band checklist derives 'QA-Review-with-open-CR'; (2) TaskPolicy
// validate ACCEPTS the processing-CR subStep on a band task + REJECTS it on a non-band (clean QA-Review) task (band-state-
// only, reuse of the generic seam); (3) TaskPolicy apply ticks the sub-step → status = clean 'QA Review' (band cleared,
// approvable) via deriveStatusEnum, NO status literal; (4) STUB-MUST-FAIL: an un-resolved band (sub-step still open) STAYS
// banded. Node-testable (pure seam). Run: node --import tsx scripts/r4059-cr-resolve-bite.ts
import { TaskPolicy } from '../src/ts/scenario/task-policy.js';
import { deriveStatusEnum, hasOpenCrSubstep, PROCESSING_CR_SUBSTEP } from '../src/ts/scenario/task-status.js';
import type { ScenarioIndex } from '../src/ts/scenario/index-store.js';

const band = '- [x] Planned\n- [x] In Progress\n- [ ] QA Review\n  - [ ] processing change requests'; // QA Review unticked + OPEN processing-CR sub-step
const cleanQa = '- [x] Planned\n- [x] In Progress\n- [x] QA Review';                                   // clean QA Review, no open CR
const mk = (cl: string) => ({ ior: 'ior:class:Task', model: { uuid: 't', name: 't', statusChecklist: cl, status: deriveStatusEnum(cl) } });
const mockIdx = {} as unknown as ScenarioIndex; // subStep validate/apply never touch the index (no evidence gate)
let pass = true;
const chk = (name: string, ok: boolean) => { console.log(`${ok ? '✓' : '✗ FAIL'} ${name}`); pass = pass && ok; };

// (1) the band exists to be resolved
chk("band checklist → derives 'QA-Review-with-open-CR'", deriveStatusEnum(band) === 'QA-Review-with-open-CR');

// (2) validate: band-state-only — accepts on a band task, rejects on a non-band task (reuse of the generic subStep seam)
let accepted = true;
try { TaskPolicy.validate!(mockIdx, mk(band), { subStep: PROCESSING_CR_SUBSTEP }); } catch { accepted = false; }
chk('validate ACCEPTS resolve-cr (processing-CR subStep) on a BAND task', accepted);
let rejected = false;
try { TaskPolicy.validate!(mockIdx, mk(cleanQa), { subStep: PROCESSING_CR_SUBSTEP }); } catch { rejected = true; }
chk('validate REJECTS resolve-cr on a non-band (clean QA-Review) task', rejected);

// (3) apply: ticks the sub-step → clean QA Review (band cleared) via deriveStatusEnum, NO status literal
const u = mk(band);
TaskPolicy.apply!(mockIdx, u, { subStep: PROCESSING_CR_SUBSTEP });
chk("apply ticks the processing-CR sub-step → status = clean 'QA Review' (band cleared, approvable)", u.model.status === 'QA Review');
chk('after resolve, hasOpenCrSubstep is FALSE (sub-step now [x])', !hasOpenCrSubstep(String(u.model.statusChecklist)));

// (4) STUB-MUST-FAIL: without the tick, the band persists → never approvable (the exact stuck-forever this fix prevents)
chk("STUB: an UN-resolved band (sub-step still open) STAYS 'QA-Review-with-open-CR' (RED baseline)", deriveStatusEnum(band) === 'QA-Review-with-open-CR');

if (!pass) { console.log('\n✗ CR-resolve bite FAILED'); process.exit(1); }
console.log('\n✓ CR-resolve: band → owner resolve-cr ticks the processing-CR sub-step (band-state-only, reused seam) → clean QA Review, approvable; un-resolved stays banded');
