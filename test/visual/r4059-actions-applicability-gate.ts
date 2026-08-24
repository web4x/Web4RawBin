// T40.1 final pass — action APPEARANCE (items 3-appear + 5), via the REAL applicableActionsFor (node-testable, R40.37
// pattern: import the real function, not a replica). Deploy-independent source-invariant (served 0.8.130 built from this).
//   (3-appear) '✓ Resolve CRs' is offered on a task in the QA-Review-with-open-CR band, and HIDDEN on a clean QA-Review task.
//   (5)        '↗ Claude.ai RC' (open-rc) is offered on an otmuxpane (pane/agent) detail; the bespoke RC button is gone.
import { applicableActionsFor, UNIVERSAL_DECLS } from '../../src/public/ts/trace/action-applicability.ts';
import { readFileSync } from 'fs';

const decls = UNIVERSAL_DECLS;
const ctx: any = { isOwner: true };
const offered = (unit: any) => applicableActionsFor(unit, ctx, decls).offered.map((a: any) => a.verb);

const bandTask = { type: 'task', uuid: 'x', status: 'QA-Review-with-open-CR' };
const cleanQaTask = { type: 'task', uuid: 'y', status: 'QA Review' };
const pane = { type: 'otmuxpane', uuid: '%12' };

const resolveOnBand = offered(bandTask).includes('resolve-cr');
const resolveHiddenOnClean = !offered(cleanQaTask).includes('resolve-cr');
const openRcOnPane = offered(pane).includes('open-rc');

// bespoke RC button GONE: rb-terminal-detail must NOT construct a bespoke RC/private button
const term = readFileSync(new URL('../../src/public/ts/trace/rb-terminal-detail.ts', import.meta.url), 'utf8');
const bespokeGone = !/createElement\([^)]*\)[^;]*rc|rcButton|new\s+.*RcButton|\.appendChild\([^)]*rc-btn/i.test(term) && /No RC button is created here/i.test(term);

console.log(`(3-appear) resolve-cr offered on band task     : ${resolveOnBand}`);
console.log(`(3-appear) resolve-cr HIDDEN on clean QA task  : ${resolveHiddenOnClean}`);
console.log(`(5) open-rc offered on otmuxpane (pane) detail : ${openRcOnPane}`);
console.log(`(5) bespoke RC button gone from rb-terminal-detail : ${bespokeGone}`);

const item3appear = resolveOnBand && resolveHiddenOnClean;
const item5 = openRcOnPane && bespokeGone;
console.log(`\n(3) appearance  : ${item3appear ? 'GUARANTEED (appears on band, hidden on clean)' : 'NOT-GUARANTEED'}`);
console.log(`(5) RC action   : ${item5 ? 'GUARANTEED (open-rc offered on pane detail + bespoke button gone)' : 'NOT-GUARANTEED'}`);
process.exitCode = (item3appear && item5) ? 0 : 1;
