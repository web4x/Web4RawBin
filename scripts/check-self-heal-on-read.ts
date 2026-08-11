/**
 * C4.1 (T37.4.1) GATE — MODEL self-heal on read. STUB-MUST-FAIL, isolated (temp index, no prod mutation). Proves:
 * (1) a registered healer RECOMPUTES a derived field to reality on read (fresh); (2) a healer that throws REFUSES
 * (fail-loud) rather than return a drifted value; (3) an unregistered ior is accepted as-is (default); (4) the REAL
 * ScenarioIndex.get() APPLIES self-heal on read (meta-bite: remove the get()-hook → a drifted read survives → RED);
 * (5) Task = healer #1 recomputes status from the checklist (the C2/C6 drift: status 'Planned' while advanced) — and
 * a NEW class self-heals by REGISTRATION ONLY (this test registers throwaway healers with zero mechanism edits).
 * Exit != 0 on any failure; folds into ci:gates.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { registerSelfHeal, selfHealOnRead, hasSelfHeal } from '../src/ts/scenario/self-heal.js';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
import { deriveStatusEnum } from '../src/ts/scenario/task-status.js';
import '../src/ts/scenario/task-policy.js'; // side-effect: registers the Task self-healer (policy #1) — the live-wire path

const fail: string[] = [];
const check = (cond: boolean, msg: string) => { if (!cond) fail.push(msg); };

// (1) generic recompute-to-reality — a registered healer refreshes a derived field on read
registerSelfHeal('ior:class:__ProbeFresh', (u) => { (u.model as Record<string, unknown>).derived = 'FRESH'; });
const fresh = selfHealOnRead({ ior: 'ior:class:__ProbeFresh', model: { derived: 'STALE' } } as any);
check((fresh.model as Record<string, unknown>).derived === 'FRESH', 'registered healer must recompute the derived field (fresh)');

// (2) fresh-or-REFUSE — a healer that throws refuses (fail-loud), never returns a silently-drifted value
registerSelfHeal('ior:class:__ProbeRefuse', () => { throw new Error('drifted-irreconcilable'); });
let refused = false;
try { selfHealOnRead({ ior: 'ior:class:__ProbeRefuse', model: {} } as any); } catch { refused = true; }
check(refused, 'a healer that throws must REFUSE on read (fail-loud), not return a drifted value');

// (3) unregistered ior = accept as-is (default-accept)
check(!hasSelfHeal('ior:class:__Unregistered'), 'unregistered ior has no healer');
const asis = selfHealOnRead({ ior: 'ior:class:__Unregistered', model: { x: 1 } } as any);
check((asis.model as Record<string, unknown>).x === 1, 'unregistered ior is accepted as-is');

// (4) the REAL get()-hook applies self-heal (meta-bite: no hook → drifted read survives → RED). Isolated temp index.
const tmp = path.join(os.tmpdir(), 'rb-selfheal-gate');
fs.rmSync(tmp, { recursive: true, force: true });
const idx = new ScenarioIndex(path.join(tmp, 'index'));
registerSelfHeal('ior:class:__ProbeGet', (u) => { (u.model as Record<string, unknown>).derived = 'HEALED'; });
const gu = '11111111-1111-4111-8111-111111111111';
idx.put(gu, { ior: 'ior:class:__ProbeGet', model: { uuid: gu, derived: 'DRIFTED' } } as any);
const got = idx.get(gu);
check((got?.model as Record<string, unknown> | undefined)?.derived === 'HEALED', 'ScenarioIndex.get MUST apply self-heal on read (hook present) — else the drifted read survives');
fs.rmSync(tmp, { recursive: true, force: true });

// (5) Task = healer #1: a drifted Task recomputes status from the checklist (C2/C6 fix) — proves the live-wire path
const checklist = '- [x] Planned\n- [x] In Progress';
const healedTask = selfHealOnRead({ ior: 'ior:class:Task', model: { status: 'Planned', statusChecklist: checklist } } as any);
const m = healedTask.model as Record<string, unknown>;
check(m.status === deriveStatusEnum(checklist), 'Task self-heal must recompute status from the checklist (single source)');
check(m.status !== 'Planned', 'the drifted stored status (Planned while advanced) must be CORRECTED on read (C2/C6)');

if (fail.length) { console.error('✗ check-self-heal-on-read FAILED:\n  - ' + fail.join('\n  - ')); process.exit(1); }
console.log('✓ check-self-heal-on-read — generic recompute + fresh-or-refuse + get()-hook + Task healer (C2/C6) + registration-only all pass.');
