/**
 * C4.8 GATE (C4-remainder pt2) — the single-Done-writer dominance property, lint-proven. Exit != 0 if any code
 * manufactures a Done (`x.status = 'Done'`) outside the controller, save the explicit legacy allowlist. Bites (PO
 * conditions): (1) allowlist is FROZEN — fails if it GROWS; (2) plant a Done-write → detected; (3) the sanctioned
 * deriveStatusEnum writer is NOT a false-positive; + positive control: approveByOwner delegates (no direct Done-set).
 * Read-only (source scan), isolated (R40.31). Folds into ci:gates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { MvcBoundaryGuard, DONE_WRITER_ALLOWLIST } from '../src/ts/scenario/mvc-boundary-guard.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src/ts');
function walk(d: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.ts') && !/\.(test|spec|d)\.ts$/.test(e.name)) out.push(p);
  }
  return out;
}

const fail: string[] = [];
const check = (cond: boolean, msg: string) => { if (!cond) fail.push(msg); };

// [test:uuid:3b8f21c6-9d47-4e0a-a1f5-72c604e9d8b3] T37.4.3 / R37.11 C4.3 — MvcBoundaryGuard.assertControllerDominates (Impl a5c570c9) SINGLE-Done-writer DOMINANCE: NO code sets a Task Done outside the ONE controller (grep-provable unique writer, INV-C4-8, save the frozen legacy allowlist) + approveByOwner DELEGATES to statusNext (no direct Done-set) + STUB-MUST-FAIL (plant a direct Done-write → detectDoneWrites flags it RED; a sanctioned deriveStatusEnum write is NOT flagged). DISTINCT intent from T37.4.2's a7f3c1e8 (UnitController.apply b5f72641 = the validate→apply→persist→emit pipeline) — this asserts the single-Done-WRITER property. Family: under-recorded-progress / silent-drift (two-writers variant).
// PROPERTY: no direct Done-write outside the controller (save the legacy allowlist).
const files = walk(SRC).map((f) => ({ file: path.relative(ROOT, f), source: fs.readFileSync(f, 'utf-8') }));
const violations = MvcBoundaryGuard.assertControllerDominates(files);
check(violations.length === 0, `direct Done-write(s) outside the controller (single-Done-writer VIOLATED):\n    ${violations.map((v) => `${v.file}:${v.line}  ${v.text}`).join('\n    ')}`);

// BITE 1 — allowlist FROZEN (PO condition 2): it may name ONLY the known legacy writer; a grown allowlist is a bypass.
const EXPECTED_ALLOWLIST = ['task-fsm.ts'];
check(JSON.stringify([...DONE_WRITER_ALLOWLIST].sort()) === JSON.stringify(EXPECTED_ALLOWLIST.sort()),
  `Done-writer allowlist GREW beyond the sanctioned legacy set: got [${DONE_WRITER_ALLOWLIST.join(', ')}], expected [${EXPECTED_ALLOWLIST.join(', ')}] — a growing allowlist is a bypass with extra steps`);

// BITE 2 — plant a Done-write in a non-allowlisted file → the detector MUST catch it (else the lint is blind)
const planted = MvcBoundaryGuard.detectDoneWrites("  someTask.status = 'Done';", 'src/ts/__planted.ts');
check(planted.length === 1, 'detectDoneWrites MUST catch a planted `x.status = \'Done\'` (a blind lint proves nothing)');

// BITE 3 — the sanctioned derive writer is NOT flagged (no false-positive that would force a bogus allowlist)
const sanctioned = MvcBoundaryGuard.detectDoneWrites("  m.status = deriveStatusEnum(String(m.statusChecklist));", 'src/ts/scenario/task-policy.ts');
check(sanctioned.length === 0, 'the sanctioned `= deriveStatusEnum(...)` derive must NOT be flagged as a Done-write');

// POSITIVE CONTROL — the R40.10 product approve path DELEGATES (no direct Done-set; calls statusNext)
const serverSrc = fs.readFileSync(path.join(SRC, 'server/server.ts'), 'utf-8');
const approveFn = serverSrc.slice(serverSrc.indexOf('function approveByOwner'), serverSrc.indexOf('function declineToChangeRequest'));
check(!/\.status\s*=\s*['"]Done['"]/.test(approveFn), 'approveByOwner must NOT set status=Done directly (it must delegate)');
check(/statusNext\(/.test(approveFn), 'approveByOwner must DELEGATE to statusNext (the single Done-writer)');

if (fail.length) { console.error('✗ check-controller-dominance FAILED:\n  - ' + fail.join('\n  - ')); process.exit(1); }
console.log(`✓ check-controller-dominance — single-Done-writer holds (allowlist=[${DONE_WRITER_ALLOWLIST.join(', ')}] legacy, frozen), plant-detected, derive not-flagged, approveByOwner delegates.`);
