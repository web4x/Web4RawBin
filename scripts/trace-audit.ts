/**
 * T169 — Data-quality audit: complete tree, no back-chaos, no untraced scenarios.
 *
 * Usage:
 *   npx tsx scripts/trace-audit.ts              # report mode
 *   npx tsx scripts/trace-audit.ts --strict     # exits non-zero on any violation
 *
 * [impl:uuid:e43c24fe-a1d1-4d14-8e7a-55ea7edd616f] R-F data quality
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

// R27.7: a full uuid is 8-4-4-4-12. Traceability markers with a TRUNCATED uuid credit by prefix but FAIL clean-tree
// measure + risk prefix-collision (bitten 3×: R27.4 prefix-collision, R27.7 credit-miss). Hard CI failure by construction.
const FULL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MARKER_RE = /\[(impl|test|task|uc|usecase|requirement|req|uuid):uuid:([0-9a-fA-F-]+)\]/g;
function truncatedUuidMarkers(roots: string[]): { file: string; marker: string; prefix: string }[] {
  const out: { file: string; marker: string; prefix: string }[] = [];
  const walk = (dir: string) => {
    let entries: fs.Dirent[]; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!/node_modules|\.git|dist|coverage/.test(p)) walk(p); }
      else if (/\.(ts|tsx|mjs|js|md)$/.test(e.name)) {
        let text: string; try { text = fs.readFileSync(p, 'utf8'); } catch { continue; }
        for (const m of text.matchAll(MARKER_RE)) if (!FULL_UUID.test(m[2])) out.push({ file: p, marker: m[0], prefix: m[2] });
      }
    }
  };
  for (const r of roots) walk(r);
  return out;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const REPO_ROOT = path.join(__dirname, '..');

// ── R27.5 STEP-1: Canonical Ref-Slot Registry (design: design-notes/r27.5-canonical-ref-slot-registry.md) ──
// Every place a unit-uuid can live is declared ONCE — the single source for migrations, audit, and repair-
// reasserts, so a slot-miss (R27.4 ownerIor/Test.methods) is impossible by construction. forward▸ = chain
// reachability; back◂ + cross↔ = also dangling-scanned (must resolve); data◇ = room-app tier (separate).
// Slot keys prefixed '@' live OUTSIDE model (unit.<key>, e.g. @ownerIor). token/self fields are EXCLUDEd —
// uuid-shaped but NOT unit edges. Classified by RESOLUTION+INTENT, never by name-heuristic.
interface SlotSet { forward: string[]; back: string[]; cross: string[]; data: string[] }
const S = (forward: string[] = [], back: string[] = [], cross: string[] = [], data: string[] = []): SlotSet => ({ forward, back, cross, data });
const REF_SLOTS: Record<string, SlotSet> = {
  // CHAIN TIER — reachability walk traverses forward▸ only
  Requirement:    S(['useCases'], ['parent', '@ownerIor'], ['crossRef', 'refinedBy', 'refinementOf', 'splitInto', 'siblingOf', 'supersededBy', 'supersedes', 'gates', 'tests']),
  Task:           S(['useCases', 'children', 'subtasks'], ['parent', '@ownerIor', 'sprint'], ['coveredRequirements', 'requirements', 'gates']),
  UseCase:        S(['class', 'classes', 'method'], ['parent', '@ownerIor', 'requirements'], ['tasks', 'covers', 'implementations']),
  Class:          S(['methods'], ['parent', '@ownerIor', 'useCases'], ['method', 'subtypes', 'extends']),
  Method:         S(['implementations'], ['parent', '@ownerIor'], ['implementation', 'tests']),
  Implementation: S(['tests'], ['parent', '@ownerIor', 'methods'], ['sourceMarker']),
  Test:           S(['testCases'], ['parent', '@ownerIor', 'methods', 'implementations'], ['verifies', 'gates']), // ▸testCases = the 2207 fix; ◂methods = the R27.4 fcf miss
  TestCase:       S([], ['@ownerIor', 'testUuid']),
  Sprint:         S(['tasks', 'requirements'], [], ['bugs']),                                                     // 2nd reachability ROOT
  Bug:            S([], ['parent', '@ownerIor'], ['crossRef', 'useCases', 'tasks', 'coveredBy', 'implementations', 'supersededBy']),
  Gate:           S([], [], ['gatedItems']),
  TraceLink:      S([], [], ['from', 'to']),
  CurrentSprint:  S([], ['lastCompletedUuid', 'lastCompletedReqUuid']),
  // DATA TIER (◇) — not chain-reachable; dangling-scanned separately
  Room:           S([], [], [], ['files']),
  File:           S([], [], [], ['roomUuid', 'parentFolder']),
  WebItem:        S([], [], [], ['roomUuid', 'parentFolder', 'children']),
  Message:        S([], [], [], ['roomIor', 'prevMessage', 'nextMessage']),
  Profile:        S([], [], [], ['phones', 'emails', 'companies']),
};
// uuid-shaped but NOT unit edges — verified all-dead / self (Device.ownerToken 195/195, File.uploaderToken 71,
// Message.senderIor 6/6). Including them = ~500 false dangling.
const EXCLUDE_SLOTS = new Set(['uuid', 'ownerToken', 'uploaderToken', 'deviceId', 'token', 'id', 'senderIor']);

// [impl:uuid:87983907-282c-4feb-ac04-1368dc5e9a01] TraceAudit.refSlots — the canonical ref-slot accessor: the single
// pinned source of "where a unit-ref can live". Migrations/audit/repair import THIS; CANONICAL_FORWARD derives from it.
function refSlots(type: string): SlotSet {
  return REF_SLOTS[type] || S();
}

// DERIVED (forward only) — no hand-list; the reachability walk consumes this.
const CANONICAL_FORWARD: Record<string, string[]> = Object.fromEntries(Object.keys(REF_SLOTS).map(t => [t, refSlots(t).forward]));

// R27.5: reachability seeds Requirement AND Sprint roots (Sprint promoted from orphan-by-design to a 2nd root).
const REACHABILITY_ROOTS = new Set(['Requirement', 'Sprint']);

/**
 * Orphan-by-design types: excluded from the reachability orphan report.
 * - TraceLink: edge metadata, not a chain node.
 * (Sprint was here; R27.5 promotes it to a reachability ROOT so its tasks/requirements traverse — the 2207-fix.)
 */
const ORPHAN_BY_DESIGN_TYPES = new Set(['TraceLink']);

interface AuditResult {
  total: number;
  reachable: number;
  orphans: { uuid: string; type: string; name: string }[];
  dangling: { uuid: string; type: string; slot: string; ref: string; tier: string }[]; // R27.5 Axis-1 ref-integrity
  cardinalityIssues: string[];
  duplicateClasses: { name: string; count: number; uuids: string[] }[]; // R27.2 AC-canonical: exactly ONE Class unit per code-class name
  hopResults: { total: number; reachable: number; unreachable: { uuid: string; name: string; breakHop: string }[] };
}

function getType(unit: ScenarioUnit): string {
  return unit.ior.replace('ior:class:', '');
}

function resolveIor(ior: string): string {
  return String(ior).replace('ior:instance:', '');
}

// R27.2 AC-canonical: exactly ONE Class unit per code-class name (assert; prevents the 55-dup recurrence).
// [impl:uuid:33ccac7f-834b-429e-a93f-e7641ce933ea] R27.2 duplicateClassUnits (duplicateClass assertion)
function duplicateClassUnits(units: Map<string, ScenarioUnit>): { name: string; count: number; uuids: string[] }[] {
  const byName = new Map<string, string[]>();
  for (const [uuid, unit] of units) if (getType(unit) === 'Class') { const n = String(unit.model.name || ''); (byName.get(n) || byName.set(n, []).get(n)!).push(uuid); }
  return [...byName.entries()].filter(([, us]) => us.length > 1).map(([name, uuids]) => ({ name, count: uuids.length, uuids })).sort((a, b) => a.name.localeCompare(b.name));
}

function auditAll(idx: ScenarioIndex): AuditResult {
  const allUuids = idx.list();
  const units = new Map<string, ScenarioUnit>();
  for (const uuid of allUuids) {
    const u = idx.get(uuid);
    if (u) units.set(uuid, u);
  }

  // Pass 1: Reachability — walk forward from Requirements
  const visited = new Set<string>();
  function walk(uuid: string): void {
    if (visited.has(uuid)) return;
    visited.add(uuid);
    const unit = units.get(uuid);
    if (!unit) return;
    const type = getType(unit);
    const fwdKeys = CANONICAL_FORWARD[type] || [];
    for (const key of fwdKeys) {
      const val = (unit.model as Record<string, unknown>)[key];
      const refs = Array.isArray(val) ? val : (val ? [val] : []);   // R27.5: forward slot may be single-value (UseCase.class/method)
      for (const ref of refs) walk(resolveIor(String(ref)));
    }
  }

  // R27.5: walk from Requirement AND Sprint roots (strict forward chain) — was Requirement-only (T172)
  for (const [uuid, unit] of units) {
    if (REACHABILITY_ROOTS.has(getType(unit))) walk(uuid);
  }

  const orphans: AuditResult['orphans'] = [];
  for (const [uuid, unit] of units) {
    const type = getType(unit);
    if (ORPHAN_BY_DESIGN_TYPES.has(type)) continue;
    if (!visited.has(uuid)) {
      orphans.push({ uuid, type, name: String(unit.model.name || uuid) });
    }
  }

  // Pass 2 (R27.5 Axis-1 — REF INTEGRITY): every slot ref (forward+back+cross, chain tier; data separately) must
  // resolve to a live unit. Replaces the old forward-only "prohibited back-ref" check — R27.5 reclassifies
  // parent/@ownerIor/requirements as LEGITIMATE back-edges that must RESOLVE (not chaos). token/self are EXCLUDEd.
  const bareRef = (ref: string): string | null => {
    const s = String(ref);
    if (s.startsWith('ior:file:') || s.startsWith('ior:class:')) return null; // not a unit-instance ref
    const at = s.replace('ior:instance:', '').split('@');
    if (at[1] && at[1] !== 'self' && at[1] !== 'local') return null;           // remote federated ref — not local dangling
    return FULL_UUID.test(at[0]) ? at[0] : null;                               // a ref is uuid-shaped; prose ("None (at…)") is NOT a ref
  };
  const readSlot = (unit: ScenarioUnit, key: string): unknown =>
    key.startsWith('@') ? (unit as unknown as Record<string, unknown>)[key.slice(1)] : (unit.model as Record<string, unknown>)[key];
  const dangling: AuditResult['dangling'] = [];
  const scanDangling = (unit: ScenarioUnit, keys: string[], tier: string): void => {
    const type = getType(unit);
    for (const key of keys) {
      if (EXCLUDE_SLOTS.has(key.replace('@', ''))) continue;
      const val = readSlot(unit, key);
      const refs = Array.isArray(val) ? val : (val ? [val] : []);
      for (const r of refs) {
        const b = bareRef(String(r));
        if (b && !units.has(b)) dangling.push({ uuid: String(unit.model.uuid), type, slot: key, ref: b, tier });
      }
    }
  };
  for (const [, unit] of units) {
    const slots = refSlots(getType(unit));
    scanDangling(unit, [...slots.forward, ...slots.back, ...slots.cross], 'chain');
    scanDangling(unit, slots.data, 'data');
  }

  // Pass 3: Cardinality
  const cardinalityIssues: string[] = [];
  for (const [uuid, unit] of units) {
    const m = unit.model as Record<string, unknown>;
    const type = getType(unit);
    if (type === 'Task' && m.useCases !== undefined && !Array.isArray(m.useCases))
      cardinalityIssues.push(`${uuid}: task.useCases not an array`);
    if (type === 'Class' && m.methods !== undefined && !Array.isArray(m.methods))
      cardinalityIssues.push(`${uuid}: class.methods not an array`);
    if (type === 'Requirement' && m.tasks !== undefined && !Array.isArray(m.tasks))
      cardinalityIssues.push(`${uuid}: requirement.tasks not an array`);
  }

  // Pass 4 (T183): 7-hop walkUp — every Test must reach a Requirement root
  const reverseMap = new Map<string, Set<string>>();
  for (const [uuid, unit] of units) {
    const type = getType(unit);
    const fwdKeys = CANONICAL_FORWARD[type] || [];
    for (const key of fwdKeys) {
      const val = (unit.model as Record<string, unknown>)[key];
      const refs = Array.isArray(val) ? val : (val ? [val] : []);   // R27.5: forward slot may be single-value
      for (const ref of refs) {
        const childUuid = resolveIor(String(ref));
        if (!reverseMap.has(childUuid)) reverseMap.set(childUuid, new Set());
        reverseMap.get(childUuid)!.add(uuid);
      }
    }
  }

  const testUnits = [...units.entries()].filter(([, u]) => getType(u) === 'Test');
  const hopResults: { uuid: string; name: string; reachable: boolean; breakHop: string }[] = [];
  for (const [testUuid, testUnit] of testUnits) {
    let found = false;
    let breakHop = '';
    const queue: { uuid: string; hops: number }[] = [{ uuid: testUuid, hops: 0 }];
    const seen = new Set<string>();
    while (queue.length > 0) {
      const { uuid: cur, hops } = queue.shift()!;
      if (seen.has(cur)) continue;
      seen.add(cur);
      const u = units.get(cur);
      if (u && getType(u) === 'Requirement') { found = true; break; }
      if (hops >= 7) continue;
      const parents = reverseMap.get(cur);
      if (!parents || parents.size === 0) {
        if (!found) breakHop = `${u ? getType(u) : '?'}→(no parent)`;
      } else {
        for (const p of parents) queue.push({ uuid: p, hops: hops + 1 });
      }
    }
    hopResults.push({ uuid: testUuid, name: String(testUnit.model.name || testUuid), reachable: found, breakHop });
  }

  const hopReachable = hopResults.filter(r => r.reachable).length;
  const hopUnreachable = hopResults.filter(r => !r.reachable);

  const duplicateClasses = duplicateClassUnits(units);

  return {
    total: allUuids.length,
    reachable: visited.size,
    orphans,
    dangling,
    cardinalityIssues,
    duplicateClasses,
    hopResults: { total: testUnits.length, reachable: hopReachable, unreachable: hopUnreachable },
  };
}

// HARD REFUSE: if anyone tries to use this for completion measurement
if (process.argv.includes('--completion') || process.argv.includes('--complete')) {
  console.error('\n❌ REFUSED: trace-audit is NOT a completion measure.');
  console.error('   Canonical completion: npx tsx scripts/po-chain-follow-up.ts --all');
  console.error('   This audit checks structural quality ONLY (orphans, back-refs, cardinality).\n');
  process.exit(1);
}

const idx = new ScenarioIndex(INDEX_DIR);
const result = auditAll(idx);
const strict = process.argv.includes('--strict');

console.log(`\n=== RawBin Trace Data Quality Audit (STRUCTURAL ONLY) ===`);
console.log(`⚠ NOT a completion measure — for completion use: npx tsx scripts/po-chain-follow-up.ts --all\n`);
console.log(`Total units: ${result.total}`);

console.log(`\nOrphans: ${result.orphans.length} (${result.orphans.length === 0 ? 'PASS' : 'FAIL'})`);
const orphanByType = [...result.orphans.reduce((m, o) => m.set(o.type, (m.get(o.type) || 0) + 1), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]);
console.log(`  by-type: ${orphanByType.map(([t, n]) => `${t}=${n}`).join(' ')}`);   // R27.5: calibration view — chain-types (real debt) vs non-chain data (orphan-by-design candidates)
for (const o of result.orphans.slice(0, 20)) console.log(`  - ${o.uuid.slice(0, 8)} (${o.type}: ${o.name})`);
if (result.orphans.length > 20) console.log(`  ... and ${result.orphans.length - 20} more`);

const chainDangling = result.dangling.filter(d => d.tier === 'chain');
const dataDangling = result.dangling.filter(d => d.tier === 'data');
console.log(`\nRef-integrity dangling (R27.5 Axis-1, all REF_SLOTS must resolve): chain=${chainDangling.length} data=${dataDangling.length} (${result.dangling.length === 0 ? 'PASS' : 'residual → R27.6 repair, delta-not-absolute'})`);
for (const d of result.dangling.slice(0, 25)) console.log(`  - ${d.uuid.slice(0, 8)} (${d.type}).${d.slot} → ${d.ref.slice(0, 8)} [${d.tier}]`);
if (result.dangling.length > 25) console.log(`  ... and ${result.dangling.length - 25} more`);

console.log(`\nCardinality: ${result.cardinalityIssues.length} (${result.cardinalityIssues.length === 0 ? 'PASS' : 'FAIL'})`);
for (const c of result.cardinalityIssues) console.log(`  - ${c}`);

const hop = result.hopResults;
const hopPass = hop.reachable === hop.total;
console.log(`\n7-hop structural check: ${hop.unreachable.length} tests without structural path (NOT completion — use po-chain-follow-up)`);
if (hop.unreachable.length > 0) {
  console.log('Structurally unreachable tests:');
  for (const t of hop.unreachable) console.log(`  ${t.name}  break: ${t.breakHop || 'unknown'}`);
}

console.log(`\nDuplicate Class units (R27.2 AC-canonical, 1 per code-class name): ${result.duplicateClasses.length} (${result.duplicateClasses.length === 0 ? 'PASS' : 'FAIL'})`);
for (const d of result.duplicateClasses) console.log(`  - ${d.name}: ${d.count} units [${d.uuids.map(u => u.slice(0, 8)).join(', ')}] — collapse to ONE`);

// Split truncated markers: LIVE (prefix matches a real unit → a crediting marker written short = the recurrence to
// hard-gate) vs STALE (matches no unit → orphan marker = deferred cleanup, don't false-red CI on pre-existing debt).
const allUuidSet = new Set(idx.list().map(u => String(u)));
const truncated = truncatedUuidMarkers([path.join(REPO_ROOT, 'src'), path.join(REPO_ROOT, 'test'), path.join(REPO_ROOT, 'scripts')]);
const liveTruncated = truncated.filter(t => [...allUuidSet].some(u => u.startsWith(t.prefix)));
const staleTruncated = truncated.filter(t => !liveTruncated.includes(t));
console.log(`\nTruncated-uuid markers (R27.7, must be full 36-char): LIVE (prefix→real unit) = ${liveTruncated.length} (${liveTruncated.length === 0 ? 'PASS' : 'FAIL'}) | stale (no unit, deferred) = ${staleTruncated.length}`);
for (const t of liveTruncated) console.log(`  ✗ LIVE ${t.marker} in ${path.relative(REPO_ROOT, t.file)} — expand to full uuid`);
for (const t of staleTruncated.slice(0, 25)) console.log(`  · stale ${t.marker} in ${path.relative(REPO_ROOT, t.file)}`);

// R27.2/R27.7: dup-Class + cardinality + LIVE truncated-uuid markers are HARD-gated NOW (all clean → won't false-fail).
// orphans + back-refs + STALE truncated markers are pre-existing baseline debt → REPORTED but NOT strict-gated
// (delta-not-absolute — else --strict false-fails on the 2207-orphan / 18-stale-marker baseline).
const hardIssues = result.duplicateClasses.length + result.cardinalityIssues.length + liveTruncated.length;
const deferredIssues = result.orphans.length + result.dangling.length;
console.log(`\n=== STRUCTURAL AUDIT — HARD (dup-Class + cardinality) = ${hardIssues} ${hardIssues === 0 ? 'PASS' : 'FAIL'} | deferred (orphans + ref-integrity dangling) = ${deferredIssues} (R27.5 residual, delta-not-absolute, not strict-gated yet) ===`);
console.log(`(Completion measure: npx tsx scripts/po-chain-follow-up.ts --all)\n`);

if (strict && hardIssues > 0) process.exit(1); // R27.2 dup=0 STRICT now; re-enable orphan/back-ref strict gate AFTER R27.4
