// [test:uuid:6251a78f-ee4d-4ca6-abed-0ad1155be3d7] Group-D f1 Bug/ChangeRequest OOP-reuse — GREEN DET-3x served v0.8.65. ⚠ FINDING for req: b1c93799 is a TASK uuid; there is NO [impl:uuid] marker on the Bug/ChangeRequest decl (templates.ts:369-370 unmarkered) — req determines/mints the canonical Impl unit (+ places a source marker) before wiring this Test. Behaviour verified working today regardless.
// Group-D feature 1 — templates.ts Bug/ChangeRequest OOP-reuse (PO task-id b1c93799; discover the real Impl marker).
// defaultTemplateRegistry() registers ior:class:Bug + ior:class:ChangeRequest → RequirementTemplate (templates.ts:369-370):
// OOP reuse — Bug/ChangeRequest inherit the full Requirement view instead of a bespoke/fallback template. Own-oracle on
// source; phantom-guard served==package==HEAD v0.8.65 → source logic == served logic. DET-3x.
import { defaultTemplateRegistry, RequirementTemplate } from '../../src/ts/scenario/templates.ts';

const bugUnit: any = { ior: 'ior:class:Bug', model: { uuid: 'bug-1', name: 'Login crashes on submit', description: 'the app crashes when submitting the login form', status: 'open' } };
const crUnit: any = { ior: 'ior:class:ChangeRequest', model: { uuid: 'cr-1', name: 'Add dark mode toggle', description: 'user wants a dark mode switch', status: 'open' } };

const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  const reg = defaultTemplateRegistry();
  const reqT = reg.resolve('ior:class:Requirement');
  const bugT = reg.resolve('ior:class:Bug');
  const crT = reg.resolve('ior:class:ChangeRequest');

  // OOP reuse: Bug + ChangeRequest resolve to the SAME object as RequirementTemplate (inheritance, not a copy/fallback)
  const bugReuses = !!bugT && bugT === RequirementTemplate && bugT === reqT;
  const crReuses = !!crT && crT === RequirementTemplate && crT === reqT;

  // and they actually RENDER the requirement view (sv-requirement + the unit's own content), not an empty/default stub
  const bugHtml = bugT ? bugT.renderHtml(bugUnit) : '';
  const crHtml = crT ? crT.renderHtml(crUnit) : '';
  const rendersReqView = bugHtml.includes('sv-requirement') && bugHtml.includes('Login crashes on submit') &&
    crHtml.includes('sv-requirement') && crHtml.includes('Add dark mode toggle');

  // HOLD: an UNregistered class resolves to undefined (explicit registration, NOT a catch-all that would over-reuse)
  const unregisteredUndefined = reg.resolve('ior:class:NotAThing') === undefined;

  const pass = bugReuses && crReuses && rendersReqView && unregisteredUndefined;
  results.push(pass);
  console.log(`iter ${i}: bug-reuses-req=${bugReuses} cr-reuses-req=${crReuses} renders-req-view=${rendersReqView} unregistered-undefined=${unregisteredUndefined} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== Group-D f1 templates Bug/ChangeRequest OOP-reuse (DET-3x, own-oracle) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (shipped-then-regressed — real finding)');
process.exitCode = green ? 0 : 1;
