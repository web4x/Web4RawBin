#!/usr/bin/env node
// scripts/check-boot-currency.ts — R40.55 boot CURRENCY guard + no-active-state backstop (architect designs
// 56aa5cf4f + efbc30e3e, req dc809efb). A rewound agent re-derives its world from its boot.md ACTIVE section; when
// that section names STALE state it inherits a dead world = the GHOST-CONTEXT ROOT (measured: expert boot ~v0.8.61 =
// ~62 versions stale while HEAD is v0.8.123). This lint makes "a boot may not name a sprint/version diverging from
// HEAD, and ideally names no active-state at all" a FAILABLE gate (R40.54), not a wish.
//
// TWO DIMENSIONS off ONE discovery:
//   CURRENCY  (Layer-1): a boot that NAMES a version/sprint (outside a lessons heading) whose value != gitHEAD.derived
//             is STALE → a currency VIOLATION (RED-capable). gitHEAD.derived = package.json version + the CurrentSprint
//             singleton's sprint (the SAME single-sources the app reads).
//   NO-STATE  (Layer-2 escalation): a boot that names ANY active-state token — even a CURRENT one — is STATE-BEARING
//             (it will rot); the cured shape is timeless rules + an anchor POINTER to context.md (zero state) → passes
//             by construction. This dimension is WARN and flips to RED per-boot as each cure lands (delta-vs-absolute,
//             R40.54: never RED-gate absolute-conformance before the migration that achieves it — it would false-fail
//             the very files being cured).
//
// DISCOVERY = the structuralDiscover PRINCIPLE (as R40.54 AcGuard / R37.12 live-MVC): derive the set by GLOB of every
//   session/agents/*/boot.md (incl. oosh*/other-team, @host variants) — NEVER a 7-name hand-list (which already MISSED
//   3 stale oosh boots). NB: there is no literal shared `structuralDiscover` symbol in the tree today — each lint
//   implements the derived-glob principle locally; extracting a shared util is a separate refactor (flagged to architect).
// FAIL-CLOSED SYMMETRIC: an unparseable boot token OR an unreadable truth-source (package.json / CurrentSprint) => RED,
//   never pass-green (a guard that silently passes when it cannot read HEAD is the silent-failure class this kills).
// LESSON-PROVENANCE EXEMPT, scoped: a version under a marked lessons heading ('## Hard-won patterns (v0.6.0 …)') is
//   provenance, exempt — but ONLY there, never in a ## Current/## Goal/anchor/header position.
//
// ROLLOUT (mirrors R40.48 Layer-1, and required by AC-delta-vs-absolute): ci:gates runs `--selftest` (proves the RED
//   mechanism bites on a seeded stale boot without RED-blocking the fleet on the ~6 real stale boots that exist TODAY);
//   the live scan is WARN/report (never blocks) and flips to RED via --strict / RB_BOOT_ENFORCE per-boot as cures land.
//
// tsx (reads the CurrentSprint scenario unit). Run: node --import tsx scripts/check-boot-currency.ts [--selftest|--strict]
import fs from 'node:fs';
import path from 'node:path';
import { assertNonVacuous } from '../src/ts/scenario/consistency-guard.js'; // R-C3 shared vacuous-refusal primitive (INV-C3-2, meta-BITE-backed) — single-source, not a bespoke count check
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
import { resolveSprintPin } from '../src/ts/scenario/sprint-pin-resolver.js'; // R40.17 INV-C1-9: the ONE current-sprint resolver — the SAME source the app reads (NOT the retired sprintName 2nd source)

const AGENT_ROOT = process.env.RB_AGENT_WORKSPACE || '/var/dev/Workspaces/AI/Claude';
const AGENTS_DIR = path.join(AGENT_ROOT, 'session/agents');
// Sanity FLOOR (PO): we KNOW the fleet has 7+ robbin boots plus the oosh trio (~36 today). A discovery count below this
// is definitionally a BROKEN run (wrong/stale RB_AGENT_WORKSPACE — highly reachable once the Layer-2 worktree migration
// moves repos) — the guard must REFUSE, never pass-green having checked near-zero. A guard that cannot detect its own
// blindness is not a guard.
const MIN_BOOTS = 7;

interface Head { version: string; sprint: number }
interface Token { kind: 'version' | 'sprint'; raw: string; value: string; num: number; heading: string; exempt: boolean }

// ── truth-source (fail-closed: throws → the caller turns it into RED, never pass-green) ──
function headVersion(): string {
  const v = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  if (!/^\d+\.\d+\.\d+$/.test(String(v))) throw new Error(`truth-source: package.json version "${v}" is not semver`);
  return String(v);
}
function headSprint(): number {
  // The SAME source the app reads (server.ts:2722-2726): the singleton's owner-DESIGNATION (sprintName→number) fed as
  // a HINT INTO the ONE resolver resolveSprintPin — NOT sprintName read directly as current (that parallel derivation
  // is the retired 2nd source R40.17/INV-C1-9 killed; reading it = the two-comparator false-currency the AC prevents).
  // resolveSprintPin THROWS fail-closed on ambiguity (INV-C1-4 >1 Active) / unresolvable task ref (INV-C1-3) — that
  // throw is the FEATURE: it bubbles to a RED truth-source (AC-fail-closed), never a silent-pick, never pass-green.
  const idx = new ScenarioIndex(path.join(process.cwd(), 'scenario/index'));
  const m = (idx.get('current-sprint-singleton-0000-000000000001')?.model ?? {}) as Record<string, unknown>;
  const desNum = /\d+/.exec(String(m.sprintName || ''))?.[0];
  const nextNum = /\d+/.exec(String(m.nextSprintName || ''))?.[0];
  const pin = resolveSprintPin(idx, { currentSprintNumber: desNum ? Number(desNum) : null, nextSprintNumber: nextNum ? Number(nextNum) : null });
  if (!pin.current) throw new Error('truth-source: resolveSprintPin resolved NO current sprint (no Active/designation) — cannot determine HEAD sprint, refusing to pass-green');
  return pin.current.number;
}

// ── PURE CORE 1: scan a boot's text for version/sprint tokens, tracking the enclosing heading + lessons-exemption. ──
const LESSON_HEADING = /hard-won|lessons?|patterns|provenance|memor(y|ies)/i;
export function scanBoot(text: string): Token[] {
  const out: Token[] = [];
  let heading = '';
  for (const line of text.split('\n')) {
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    if (h) heading = h[1]; // update the enclosing heading — but DON'T skip: a heading line itself carries active-state
                           // (e.g. '## Pane: … Prod: … (~v0.8.61)', '## CURRENT: Sprint 31') and must be scanned too.
    const exempt = LESSON_HEADING.test(heading);
    for (const m of line.matchAll(/~?v(\d+\.\d+\.\d+)\b/g)) out.push({ kind: 'version', raw: m[0], value: m[1], num: 0, heading, exempt });
    for (const m of line.matchAll(/\bSprint\s+(\d+)\b/gi)) out.push({ kind: 'sprint', raw: m[0], value: m[1], num: parseInt(m[1], 10), heading, exempt });
    for (const m of line.matchAll(/\bS(\d{1,2})\b/g)) out.push({ kind: 'sprint', raw: m[0], value: m[1], num: parseInt(m[1], 10), heading, exempt });
  }
  return out;
}

// ── PURE CORE 2: classify a boot from its tokens + HEAD truth. ──
export function classifyBoot(tokens: Token[], head: Head): { violations: Token[]; stateBearing: Token[]; conformance: 'timeless+pointer' | 'state-bearing' } {
  const active = tokens.filter((t) => !t.exempt);
  const violations: Token[] = [];
  for (const t of active) {
    if (t.kind === 'version' && t.value !== head.version) violations.push(t);
    if (t.kind === 'sprint' && t.num !== head.sprint) violations.push(t);
  }
  return { violations, stateBearing: active, conformance: active.length === 0 ? 'timeless+pointer' : 'state-bearing' };
}

function discoverBoots(dir: string = AGENTS_DIR): string[] {
  // structuralDiscover principle: glob every agent dir's boot.md; a NEW/renamed agent cannot hide by being unlisted.
  const ents = fs.readdirSync(dir, { withFileTypes: true }); // throws if the root is unreadable → caller REDs (coverage fail-closed)
  return ents.filter((e) => e.isDirectory()).map((e) => path.join(dir, e.name, 'boot.md')).filter((p) => fs.existsSync(p));
}

// ── R40.55 terminal-RED flip classification. An exclusion has TWO ORTHOGONAL axes — a RECONCILIATION of two rulings that
// answered DIFFERENT questions and only looked contradictory because both landed on the oosh entry (NOT an override; the
// architect's design stands):
//   • EXPRESSION (architect 58e2cd3f4 — HOW to express): a PREDICATE (whole team, e.g. /^oosh-/ — auto-covers every
//     variant + future ones; a name-list rots, it once missed 6 of 9 oosh by scoping to symptom not ownership) OR a
//     NAMED entry (a single agent). A NAMED entry keeps a DEAD-EXEMPTION liveness check (its name must resolve to a real
//     boot — a stale name is rot); a predicate can't name a vanished file so dead-exemption is moot there.
//   • CLOSURE KIND (PO typed-closure — WHEN it closes, typed to the REASON): OWNERSHIP ('not ours' → closes on a
//     GOVERNANCE ACK, NEVER file-state: clean-today != not-ours-anymore; retiring on all-timeless would re-open the
//     unfair-RED on a future regression) vs REMEDIATION ('ours-adjacent but currently dirty, can't fix' → closes when
//     remedied = all-matched-timeless, a machine-checkable EXEMPTION-SATISFIED). Visibility (every matched file PRINTED
//     each run) is what makes a predicate safe — a classified-and-printed file is not a silent skip. ──
type Exclusion =
  | { expr: 'predicate'; predicate: RegExp; label: string; kind: 'ownership' | 'remediation'; reason: string; closesOn: string }
  | { expr: 'named'; name: string; label: string; kind: 'ownership' | 'remediation'; reason: string; closesOn: string };
export const EXCLUSIONS: Exclusion[] = [
  { expr: 'predicate', predicate: /^oosh-/, label: '/^oosh-/', kind: 'ownership', reason: 'other-PO-owned (oosh team); we may not edit these', closesOn: 'oosh-PO governance ACK / ownership transfer (NOT file-state)' },
  { expr: 'named', name: 'master-product-owner', label: 'master-product-owner', kind: 'ownership', reason: 'higher-authority governance layer managing robbin-po, cross-host MacStudio; coordinate-not-rewrite; TRON-OVERRIDABLE', closesOn: 'master-PO / Tron governance decision (NOT file-state)' },
];
const isExcluded = (agent: string): boolean => EXCLUSIONS.some((e) => (e.expr === 'predicate' ? e.predicate.test(agent) : e.name === agent));
export function classify(agent: string): 'OWNED' | 'EXCLUDED' | 'UNCLASSIFIED' {
  // OWNED = the robbin team + its shared infra, by NAMED prefix/exact (not a catch-all): robbin-* · scrum-master (SM) ·
  // ARON · agent-trainer (the fleet propagator + rewind-driver, ours — prefix covers the @WODA.prod host variant).
  // NB `/^scrum-master/` matches the SM but NOT the camelCase scrumMaster-* OOSH script specialists (other-team).
  if (/^robbin-/.test(agent) || agent === 'ARON' || /^scrum-master/.test(agent) || /^agent-trainer/.test(agent)) return 'OWNED';
  if (isExcluded(agent)) return 'EXCLUDED';
  return 'UNCLASSIFIED'; // divergence: anything not OWNED/EXCLUDED is held to the OWNED standard (RED iff state-bearing)
}

function live(strict: boolean): number {
  let head: Head;
  try { head = { version: headVersion(), sprint: headSprint() }; }
  catch (e) { console.error(`check:boot-currency RED [TRUTH-SOURCE — fix the CurrentSprint designation / package.json, NOT a boot]: ${(e as Error).message} — the guard cannot read HEAD (missing/ambiguous designation or unreadable version), refusing to pass-green. NB this is a DIFFERENT failure class from a stale boot.`); return 1; }

  let boots: string[];
  try { boots = discoverBoots(); }
  catch (e) { console.error(`check:boot-currency RED (fail-closed coverage): cannot read agents dir ${AGENTS_DIR}: ${(e as Error).message}. Set RB_AGENT_WORKSPACE to the agent workspace root.`); return 1; }
  // Fail-closed on the DISCOVERY step (not just on parse): 0 — or a suspiciously-low — boot count is a broken run, via
  // the shared assertNonVacuous (single-source, inherits the meta-BITE). This closes the vacuous-pass family (0-items /
  // MISSING-CONTAINER) inside the guard the architect declared SOLE ENFORCEMENT — a stale root must RED, never neuter it.
  const floor = assertNonVacuous(boots, { name: `boot-currency discovery under ${AGENTS_DIR}`, min: MIN_BOOTS });
  if (!floor.ok) { console.error(`check:boot-currency RED (fail-closed discovery): ${floor.reason} — expected >=${MIN_BOOTS} boots (7+ robbin + oosh trio); a near-zero count means a wrong/stale RB_AGENT_WORKSPACE, refusing to pass-green.`); return 1; }

  type Row = { rel: string; agent: string; bucket: 'OWNED' | 'EXCLUDED' | 'UNCLASSIFIED'; conformance: 'timeless+pointer' | 'state-bearing'; violations: Token[] };
  const rows: Row[] = [];
  let readError = 0;
  for (const b of boots) {
    let text: string;
    try { text = fs.readFileSync(b, 'utf8'); }
    catch { readError++; console.error(`check:boot-currency RED (fail-closed): boot unreadable, not skipped: ${b}`); continue; }
    const agent = path.basename(path.dirname(b));
    const c = classifyBoot(scanBoot(text), head);
    rows.push({ rel: b.replace(AGENT_ROOT + '/', ''), agent, bucket: classify(agent), conformance: c.conformance, violations: c.violations });
  }

  const ownedState = rows.filter((r) => r.bucket === 'OWNED' && r.conformance === 'state-bearing');
  const excludedState = rows.filter((r) => r.bucket === 'EXCLUDED' && r.conformance === 'state-bearing');
  const unclassifiedState = rows.filter((r) => r.bucket === 'UNCLASSIFIED' && r.conformance === 'state-bearing');
  const timelessCount = rows.filter((r) => r.conformance === 'timeless+pointer').length;
  const bucketCount = (b: string) => rows.filter((r) => r.bucket === b).length;
  const excludedRows = rows.filter((r) => r.bucket === 'EXCLUDED');
  const present = new Set(rows.map((r) => r.agent));
  // dead-exemption liveness: NAMED entries only (a predicate can't name a vanished file). A named exclusion whose name
  // resolves to no discovered boot is a stale exemption = rot → RED.
  const deadNamed = EXCLUSIONS.filter((e): e is Extract<Exclusion, { expr: 'named' }> => e.expr === 'named' && !present.has(e.name));

  console.log(`check:boot-currency — HEAD v${head.version} / Sprint ${head.sprint}; ${rows.length} boots CHECKED (${timelessCount} timeless+pointer ✓) — buckets OWNED ${bucketCount('OWNED')} / EXCLUDED ${bucketCount('EXCLUDED')} / UNCLASSIFIED ${bucketCount('UNCLASSIFIED')}.`);
  const allViol = rows.flatMap((r) => r.violations.map((t) => ({ r, t })));
  if (allViol.length) {
    console.log(`\n  ── CURRENCY VIOLATIONS (named state != HEAD) — ${allViol.length}:`);
    for (const { r, t } of allViol) console.log(`     [${r.bucket}] ${t.kind === 'version' ? 'v' + t.value : 'Sprint ' + t.value} != ${t.kind === 'version' ? 'v' + head.version : 'Sprint ' + head.sprint}  ·  ${r.rel}  [${t.raw} under "${t.heading || '(top)'}"]`);
  }
  // EXCLUDED — per entry: PRINT every matched boot (visibility = the safety property that makes a predicate safe), then
  // the CLOSURE typed to the entry's KIND. oosh-* / master-PO are OWNERSHIP → governance-boundary line, never all-timeless.
  console.log(`\n  ── EXCLUDED (${excludedRows.length} boots; closure typed to REASON — ownership≠remediation):`);
  for (const e of EXCLUSIONS) {
    const matched = excludedRows.filter((r) => (e.expr === 'predicate' ? e.predicate.test(r.agent) : r.agent === e.name));
    console.log(`     • ${e.expr} ${e.label}  [${e.kind}] — ${e.reason}`);
    for (const r of matched) console.log(`         ${r.agent}${r.conformance === 'state-bearing' ? '   ⚠ state-bearing (WARN-loud — coordinate with their PO, never our RED)' : '   ✓ timeless'}`);
    if (e.expr === 'named' && !present.has(e.name)) console.log(`         ⚠ DEAD exemption — "${e.name}" resolves to NO discovered boot (stale exemption = rot → RED)`);
    if (e.kind === 'ownership') {
      // OWNERSHIP boundary: closure is a GOVERNANCE event, NOT file-state (clean-today ≠ not-ours). all-timeless is IRRELEVANT.
      console.log(`         ↳ OWNERSHIP boundary — NOT closable by file state; closes on: ${e.closesOn}`);
    } else {
      // REMEDIATION: the machine-checkable EXEMPTION-SATISFIED — all matched timeless ⇒ retireable. (Reserved; none today.)
      if (matched.length > 0 && matched.every((r) => r.conformance === 'timeless+pointer'))
        console.log(`         ★★ EXEMPTION SATISFIED (remediation): all ${matched.length} matched boots timeless — this exemption is RETIREABLE, debt CLOSABLE. ★★`);
    }
  }
  // NON-enforcing INVENTORY VISIBILITY (PO): a TIMELESS unclassified boot is protected (held to OWNED standard) but
  // MISLABELED — and a silent gap only surfaces by accident. Some things can be made impossible, some only EVIDENT;
  // this inventory is the latter, so print it loudly (never RED — these may genuinely not be ours). Review for owned-but-unclassified.
  const unclassifiedAll = rows.filter((r) => r.bucket === 'UNCLASSIFIED').map((r) => r.agent).sort();
  console.log(`\n  ── UNCLASSIFIED inventory (NON-enforcing — eyeball for any owned-but-unclassified agent): ${unclassifiedAll.length}`);
  if (unclassifiedAll.length) console.log(`     ${unclassifiedAll.join(', ')}`);
  if (excludedState.length) { console.log(`\n  ── EXCLUDED boots STILL state-bearing (WARN-LOUD — other-PO-owned, we cannot fix; flagged, never green-silent):`); for (const r of excludedState) console.log(`     ${r.rel}`); }
  if (ownedState.length) { console.log(`\n  ── OWNED boots state-bearing (must be timeless+pointer post-cure):`); for (const r of ownedState) console.log(`     ${r.rel}`); }
  if (unclassifiedState.length) { console.log(`\n  ── UNCLASSIFIED boots state-bearing (TRIAGE: ours→cure, theirs→named-exclude-with-expiry — CANNOT inherit the exemption):`); for (const r of unclassifiedState) console.log(`     ${r.rel}`); }

  if (readError) return 1; // an unreadable boot is fail-closed RED regardless of mode
  // ── RED reason class 2 = STATE-BEARING/STALE-BOOT (distinct from the truth-source RED at the top — a future RED must
  // send the next person to the right problem: this one = fix the BOOT; the truth-source one = fix the CurrentSprint
  // designation / package.json). Dead exemptions RED in any mode (the exemption list itself must not rot). ──
  const red: string[] = [];
  if (deadNamed.length) red.push(`${deadNamed.length} DEAD named exemption(s) [${deadNamed.map((e) => e.name).join(', ')}] — a named exclusion must resolve to a real boot (a stale exemption is rot)`); // RED in any mode
  if (strict && ownedState.length) red.push(`${ownedState.length} OWNED boot(s) state-bearing — an owned boot must be timeless+pointer post-cure`);
  if (strict && unclassifiedState.length) red.push(`${unclassifiedState.length} UNCLASSIFIED boot(s) state-bearing — triage them (cannot inherit the exemption)`);
  if (red.length) { console.error(`\ncheck:boot-currency RED [STATE-BEARING/STALE-BOOT — fix the boot, NOT the truth-source]: ${red.join('; ')}.`); return 1; }

  if (excludedState.length || (!strict && (ownedState.length || unclassifiedState.length)))
    console.error(`\ncheck:boot-currency WARN: ${excludedState.length} excluded-still-state-bearing (other-PO debt)${strict ? '' : ` + ${ownedState.length + unclassifiedState.length} owned/unclassified state-bearing (pre-flip WARN)`}.`);
  console.log(`\ncheck:boot-currency ${strict ? 'PASS (--strict): 0 OWNED/UNCLASSIFIED state-bearing' : 'PASS (warn phase)'} over ${rows.length} boots CHECKED (non-vacuous, floor ${MIN_BOOTS}); ${excludedState.length} named-excluded still-state-bearing carried as WARN-loud debt.`);
  return 0;
}

// ── stub-must-fail (isolated, in-memory fixtures — no prod mutation, cleanup-free by construction, R40.31) ──
function selftest(): number {
  let fail = 0;
  const HEAD: Head = { version: '0.8.123', sprint: 40 };
  const ck = (name: string, cond: boolean) => { console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}`); if (!cond) fail++; };

  // (a) a seeded STALE version boot → currency VIOLATION (the R40.54 own-stub-must-fail: the RED mechanism bites).
  ck('stale version (v0.8.61) in a ## Pane line → currency violation',
    classifyBoot(scanBoot('## Pane: x · Prod: y (~v0.8.61)'), HEAD).violations.length === 1);
  // (b) a CURRENT version → no violation, but STATE-BEARING (WARN, not RED).
  const cur = classifyBoot(scanBoot('## Current\nrunning v0.8.123 now'), HEAD);
  ck('current version → no violation but state-bearing (WARN)', cur.violations.length === 0 && cur.conformance === 'state-bearing');
  // (c) lesson-provenance EXEMPT: same old version under a lessons heading → GREEN (no false-RED on tester v0.6.0).
  ck('v0.6.0 under "## Hard-won patterns" → exempt (no violation, timeless)',
    classifyBoot(scanBoot('## Hard-won patterns (v0.6.0 marathon)\nlesson text v0.6.0'), HEAD).violations.length === 0);
  // (d) dual-control: the SAME old version in a ## Current position → violation (exemption is scoped, not blanket).
  ck('same v0.6.0 in a ## Current position → violation (scoped exemption)',
    classifyBoot(scanBoot('## Current\nv0.6.0'), HEAD).violations.length === 1);
  // (e) stale SPRINT (S36 vs Sprint 40) → violation.
  ck('stale sprint (S36) in active position → violation',
    classifyBoot(scanBoot('## Goal\nfinish the S36 work'), HEAD).violations.length === 1);
  // (f) timeless+pointer boot (no state) → PASS by construction.
  const tl = classifyBoot(scanBoot('# Boot: x\n## You are: x\n## Anchor: read context.md first'), HEAD);
  ck('no active-state → timeless+pointer, no violation', tl.violations.length === 0 && tl.conformance === 'timeless+pointer');
  // (g) fail-closed truth-source: a non-semver package.json version throws (→ RED, never pass-green).
  let threw = false;
  try { JSON.parse('{"version":"garbage"}').version; if (!/^\d+\.\d+\.\d+$/.test('garbage')) throw new Error('x'); } catch { threw = true; }
  ck('non-semver HEAD version → throws (fail-closed RED, not pass-green)', threw);

  // (h) DISCOVERY BLINDNESS (PO): a nonexistent RB_AGENT_WORKSPACE → discovery THROWS → RED, never a vacuous green.
  let discThrew = false;
  try { discoverBoots('/nonexistent-rb-agent-workspace-xyz/session/agents'); } catch { discThrew = true; }
  ck('nonexistent agent workspace → discovery throws (fail-closed RED, not vacuous green)', discThrew);
  // (i) vacuous discovery: 0 boots → the shared assertNonVacuous REFUSES (not pass-green having checked zero).
  ck('0 boots discovered → assertNonVacuous refuses (RED)', !assertNonVacuous([], { name: 'x', min: MIN_BOOTS }).ok);
  // (j) suspiciously-LOW count (< floor) → refused (even a low count is a broken run, not just 0).
  ck('suspiciously-low count (< floor) → refused', !assertNonVacuous(['a', 'b'], { name: 'x', min: MIN_BOOTS }).ok);
  // (k) a healthy count (>= floor) → passes the floor (guard does not false-RED a real fleet).
  ck('healthy count (>= floor) → passes floor', assertNonVacuous(new Array(MIN_BOOTS).fill('b'), { name: 'x', min: MIN_BOOTS }).ok);

  // ── terminal-RED flip classification (architect ed9eadecb) ──
  ck('classify robbin-* → OWNED', classify('robbin-tester') === 'OWNED' && classify('robbin-po') === 'OWNED');
  ck('classify ARON + scrum-master + agent-trainer(+@host) → OWNED', classify('ARON') === 'OWNED' && classify('scrum-master') === 'OWNED' && classify('agent-trainer') === 'OWNED' && classify('agent-trainer@WODA.prod') === 'OWNED');
  ck('classify scrumMaster-expert (camelCase OOSH specialist) → NOT owned', classify('scrumMaster-expert') !== 'OWNED');
  ck('classify ANY oosh-* boot → EXCLUDED (predicate, whole-team + future variants)', classify('oosh-po@MacStudio') === 'EXCLUDED' && classify('oosh-architect') === 'EXCLUDED' && classify('oosh-po@prototype') === 'EXCLUDED');
  ck('classify master-product-owner → EXCLUDED (NAMED, single agent)', classify('master-product-owner') === 'EXCLUDED');
  ck('classify a brand-new unowned agent → UNCLASSIFIED (must be triaged, not silently exempt)', classify('some-new-agent') === 'UNCLASSIFIED');
  // TYPED CLOSURE (kind ⟂ expression): only a REMEDIATION kind announces the machine-checked all-timeless SATISFIED; an
  // OWNERSHIP boundary announces GOVERNANCE regardless of file state (clean-today ≠ not-ours). Mirrors the live gating.
  const announcesSatisfied = (kind: string, allMatchedTimeless: boolean) => kind === 'remediation' && allMatchedTimeless;
  ck('OWNERSHIP + all-timeless → does NOT announce SATISFIED (governance boundary, not file-state)', !announcesSatisfied('ownership', true));
  ck('REMEDIATION + all-timeless → announces SATISFIED (reserved mechanism, kept real by this test)', announcesSatisfied('remediation', true));
  ck('REMEDIATION + a state-bearing → does NOT announce SATISFIED', !announcesSatisfied('remediation', false));
  ck('all current exclusions are OWNERSHIP-kind → none auto-closes on all-timeless today', EXCLUSIONS.every((e) => e.kind === 'ownership'));
  // dead-exemption liveness (NAMED entries only — a predicate cannot name a vanished file): a named entry whose name
  // resolves to no discovered boot → flagged (a stale exemption is rot).
  const presentSet = new Set(['oosh-architect']); // master-product-owner absent from this fixture set
  ck('dead-exemption (named) detected when the name resolves to no boot', EXCLUSIONS.filter((e) => e.expr === 'named' && !presentSet.has(e.name)).length === 1);

  if (fail) { console.error(`check:boot-currency SELFTEST FAILED (${fail}).`); return 1; }
  console.log('check:boot-currency SELFTEST GREEN — currency RED bites on a stale boot; lessons exempt (scoped); no-state classified; fail-closed on unreadable truth. Wired.');
  return 0;
}

const args = process.argv.slice(2);
if (args.includes('--selftest')) process.exit(selftest());
process.exit(live(args.includes('--strict') || process.env.RB_BOOT_ENFORCE === '1'));
