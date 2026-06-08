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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');

const CANONICAL_FORWARD: Record<string, string[]> = {
  Requirement: ['useCases'],
  Task: ['useCases', 'children', 'subtasks'],
  UseCase: ['classes'],
  Class: ['methods'],
  Method: ['implementations'],
  Implementation: ['tests'],
  Sprint: ['tasks', 'requirements'],
  Test: [],
  TraceLink: [],
};

/**
 * Orphan-by-design types: excluded from reachability audit.
 * - TraceLink: edge metadata, not a chain node
 * - Sprint: navigation container; S01-S09 have empty tasks[] (deferred historical
 *   migration, PO decision — see task-planner-s2-s9-backfill.md)
 */
const ORPHAN_BY_DESIGN_TYPES = new Set(['TraceLink', 'Sprint']);

const BACK_REF_FIELDS: Record<string, string[]> = {
  Task: ['requirements'],
  UseCase: ['requirements'],
  Class: ['useCases'],
  Method: ['classes', 'useCases', 'tests'],
  TraceLink: [],
};

interface AuditResult {
  total: number;
  reachable: number;
  orphans: { uuid: string; type: string; name: string }[];
  backRefs: { uuid: string; type: string; field: string }[];
  cardinalityIssues: string[];
  hopResults: { total: number; reachable: number; unreachable: { uuid: string; name: string; breakHop: string }[] };
}

function getType(unit: ScenarioUnit): string {
  return unit.ior.replace('ior:class:', '');
}

function resolveIor(ior: string): string {
  return String(ior).replace('ior:instance:', '');
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
      const refs = (unit.model as Record<string, unknown>)[key];
      if (!Array.isArray(refs)) continue;
      for (const ref of refs) walk(resolveIor(String(ref)));
    }
  }

  // T172: walk from Requirement roots ONLY (strict forward chain)
  for (const [uuid, unit] of units) {
    if (getType(unit) === 'Requirement') walk(uuid);
  }

  const orphans: AuditResult['orphans'] = [];
  for (const [uuid, unit] of units) {
    const type = getType(unit);
    if (ORPHAN_BY_DESIGN_TYPES.has(type)) continue;
    if (!visited.has(uuid)) {
      orphans.push({ uuid, type, name: String(unit.model.name || uuid) });
    }
  }

  // Pass 2: No back-refs
  const backRefs: AuditResult['backRefs'] = [];
  for (const [uuid, unit] of units) {
    const type = getType(unit);
    const banned = BACK_REF_FIELDS[type] || [];
    for (const field of banned) {
      const val = (unit.model as Record<string, unknown>)[field];
      if (val && ((Array.isArray(val) && val.length > 0) || (!Array.isArray(val) && val !== ''))) {
        backRefs.push({ uuid, type, field });
      }
    }
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
      const refs = (unit.model as Record<string, unknown>)[key];
      if (!Array.isArray(refs)) continue;
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

  return {
    total: allUuids.length,
    reachable: visited.size,
    orphans,
    backRefs,
    cardinalityIssues,
    hopResults: { total: testUnits.length, reachable: hopReachable, unreachable: hopUnreachable },
  };
}

const idx = new ScenarioIndex(INDEX_DIR);
const result = auditAll(idx);
const strict = process.argv.includes('--strict');

console.log(`\n=== RawBin Trace Data Quality Audit ===`);
console.log(`Total units: ${result.total}`);
console.log(`Reachable from requirements/sprints: ${result.reachable}`);

console.log(`\nOrphans: ${result.orphans.length} (${result.orphans.length === 0 ? 'PASS' : 'FAIL'})`);
for (const o of result.orphans.slice(0, 20)) console.log(`  - ${o.uuid.slice(0, 8)} (${o.type}: ${o.name})`);
if (result.orphans.length > 20) console.log(`  ... and ${result.orphans.length - 20} more`);

console.log(`\nBack-refs: ${result.backRefs.length} (${result.backRefs.length === 0 ? 'PASS' : 'FAIL'})`);
for (const b of result.backRefs.slice(0, 20)) console.log(`  - ${b.uuid.slice(0, 8)} (${b.type}): prohibited field '${b.field}'`);

console.log(`\nCardinality: ${result.cardinalityIssues.length} (${result.cardinalityIssues.length === 0 ? 'PASS' : 'FAIL'})`);
for (const c of result.cardinalityIssues) console.log(`  - ${c}`);

const hop = result.hopResults;
const hopPass = hop.reachable === hop.total;
console.log(`\n7-hop strict audit: ${hop.reachable}/${hop.total} tests reachable from Requirement roots (${hopPass ? 'PASS' : 'FAIL'})`);
if (hop.unreachable.length > 0) {
  console.log('UNREACHABLE TESTS:');
  for (const t of hop.unreachable) console.log(`  ${t.name}  break: ${t.breakHop || 'unknown'}`);
}

const totalIssues = result.orphans.length + result.backRefs.length + result.cardinalityIssues.length;
const allPass = totalIssues === 0 && hopPass;
console.log(`\n=== AUDIT ${allPass ? 'PASSED' : `FAILED (${totalIssues} orphan/backref/card issues + ${hop.unreachable.length} unreachable tests)`} ===\n`);

if (strict && !allPass) process.exit(1);
