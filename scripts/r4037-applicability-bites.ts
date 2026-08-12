// R40.37 BITE — per-(type,status/kind) applicability matrix on applicableActionsFor + stub-must-fail. Architect
// backstops. Proves AC1/AC2/AC3/AC4 (the impossible affordance is not built) and that the check is non-vacuous.
import { applicableActionsFor, UNIVERSAL_DECLS, type ActionDecl } from '../src/public/ts/trace/action-applicability.js';
import { MODEL_DECLS } from '../src/public/ts/model/model-action-decls.js'; // the REAL container decls (pure module) — not a replica

const verbs = (u: { type: string; status?: string; kind?: string }, decls: ActionDecl[]) =>
  applicableActionsFor(u, {}, decls).offered.map((a) => a.verb).sort();
const has = (arr: string[], v: string) => arr.includes(v);
let pass = true;
const chk = (name: string, ok: boolean, got?: unknown) => { console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — got ' + JSON.stringify(got)}`); pass = pass && ok; };

// AC2 — the headline: approve/decline present ONLY at QA Review, ABSENT on Done + In Progress
const done = verbs({ type: 'task', status: 'Done' }, UNIVERSAL_DECLS);
chk('AC2 task+Done → NO qa-approve', !has(done, 'qa-approve'), done);
chk('AC2 task+Done → NO qa-decline', !has(done, 'qa-decline'), done);
const qa = verbs({ type: 'task', status: 'QA Review' }, UNIVERSAL_DECLS);
chk('AC2 task+QA Review → qa-approve PRESENT', has(qa, 'qa-approve'), qa);
chk('AC2 task+QA Review → qa-decline PRESENT', has(qa, 'qa-decline'), qa);
const wip = verbs({ type: 'task', status: 'In Progress' }, UNIVERSAL_DECLS);
chk('AC2 task+In Progress → qa-approve HIDDEN', !has(wip, 'qa-approve'), wip);
// pin verbs on any task status (steering unconstrained)
chk('pin-current present on task+Done', has(done, 'pin-current'), done);
// type policy (INV-E3): file verbs never on a webitem, vcard only on member/user
const file = verbs({ type: 'file' }, UNIVERSAL_DECLS);
chk('file → preview + newtab', has(file, 'preview-file') && has(file, 'open-newtab'), file);
chk('file → NO vcard/approve', !has(file, 'download-vcard') && !has(file, 'qa-approve'), file);
const member = verbs({ type: 'member' }, UNIVERSAL_DECLS);
chk('member → vcard only', JSON.stringify(member) === JSON.stringify(['download-vcard']), member);

// AC3 — the REAL MODEL_DECLS (pure module): container actions HIDDEN on a task, PRESENT on model contexts
const taskOffered = verbs({ type: 'task' }, MODEL_DECLS);
chk('AC3 add-folder HIDDEN on task (real MODEL_DECLS)', !has(taskOffered, 'add-folder'), taskOffered);
chk('AC3 import-puml HIDDEN on task', !has(taskOffered, 'import-puml'), taskOffered);
chk('AC3 add-diagram HIDDEN on task', !has(taskOffered, 'add-diagram'), taskOffered);
chk('AC3 add-folder PRESENT on modelelement', has(verbs({ type: 'modelelement' }, MODEL_DECLS), 'add-folder'));
// membership when-predicate (R33.9): only with an active diagram — REAL decls
chk('membership HIDDEN with no active diagram', !has(verbs({ type: 'modelelement' }, MODEL_DECLS), 'add-to-diagram'));
chk('membership PRESENT with active diagram', applicableActionsFor({ type: 'modelelement' }, { hasActiveDiagram: true }, MODEL_DECLS).offered.some((a) => a.verb === 'add-to-diagram'));

// stub-must-fail: mutate the approve decl's statuses → any, assert task+Done now WRONGLY offers approve (the BITE
// would catch the regression). Non-vacuous proof.
const mutated: ActionDecl[] = UNIVERSAL_DECLS.map((d) => d.verb === 'qa-approve' ? { ...d, appliesTo: { types: ['task'] } } : d);
const mutatedDone = verbs({ type: 'task', status: 'Done' }, mutated);
chk('stub-must-fail: loosened approve → task+Done WRONGLY offers it (BITE is non-vacuous)', has(mutatedDone, 'qa-approve'), mutatedDone);

console.log(pass ? '\n★ R40.37 applicability BITE GREEN' : '\n✗ FAIL');
process.exit(pass ? 0 : 1);
