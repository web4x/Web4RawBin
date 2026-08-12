/**
 * R20.21 — Record a Gate verification event.
 * Gates are real verification events (deploy-gate, DET-3x, parity, tron-qa).
 * Each is a SINGLE unit linking what it gates (Task/Test UUIDs) + verdict + evidence.
 *
 * Usage:
 *   npx tsx scripts/record-gates.ts --type deploy-gate --verdict PASS --evidence "v0.6.37 /api/health=ok" --gated-by tester --items <uuid1> <uuid2>
 *   npx tsx scripts/record-gates.ts --type det-3x --verdict PASS --evidence "testcase=1016 x3" --gated-by tester --items <uuid>
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENARIO_INDEX = path.join(__dirname, '../scenario/index');

function hashUuid(input: string): string {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return [
    hash.slice(0, 8), hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

function prefixPath(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  return path.join(hex[0], hex[1], hex[2], hex[3], hex[4]);
}

const args = process.argv.slice(2);
function arg(name: string): string { const i = args.indexOf(`--${name}`); return i >= 0 && i + 1 < args.length ? args[i + 1] : ''; }
function argList(name: string): string[] {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return [];
  const items: string[] = [];
  for (let j = i + 1; j < args.length && !args[j].startsWith('--'); j++) items.push(args[j]);
  return items;
}

const gateType = arg('type');
const verdict = arg('verdict') || 'PASS';
const evidence = arg('evidence') || '';
const gatedBy = arg('gated-by') || 'system';
const gatedItems = argList('items').map(u => `ior:instance:${u}`);
const version = arg('version'); // R40.25 INV-PDG-7: stamp the exact served version + commit a gate was produced against —
const commit = arg('commit');   // a device-gate is valid ONLY for that version+commit; a mismatch vs the live artifact reads NOT-RUN/stale.

if (!gateType) {
  console.log('Usage: npx tsx scripts/record-gates.ts --type <gate-type> --verdict PASS|FAIL --evidence "..." --gated-by <role> --items <uuid...>');
  process.exit(1);
}

const uuid = hashUuid(`gate:${gateType}:${verdict}:${gatedItems.join(',')}:${version || ''}:${new Date().toISOString().slice(0, 10)}`); // R40.25: version in the key → each served version's gate is a DISTINCT unit (a v0.8.56 green can't masquerade as v0.8.82)
const unitPath = path.join(SCENARIO_INDEX, prefixPath(uuid), `${uuid}.scenario.json`);

const gate = {
  ior: 'ior:class:Gate',
  model: {
    uuid,
    name: `${gateType}: ${verdict}`,
    gateType,
    verdict,
    evidence,
    gatedItems,
    timestamp: new Date().toISOString(),
    gatedBy,
  },
  ownerIor: gatedItems[0] || null,
};

fs.mkdirSync(path.join(SCENARIO_INDEX, prefixPath(uuid)), { recursive: true });
fs.writeFileSync(unitPath, JSON.stringify(gate, null, 2));
console.log(`Gate created: ${uuid} (${gateType} ${verdict})`);

// R40.11 (PO 2026-08-12): gate results are durable ONLY as TEST-UNIT writes (measured: the board reads neither a
// dedicated Gate class — only 6 exist, unread — nor a bare Test.status; it will DERIVE held/signable from the served
// version a gate PASSED against vs the CURRENT served). So persist `gateServedVersion` (+ verdict/commit stamp) ON the
// gated Test unit itself — one source, one field. A row SELF-RELEASES when gateServedVersion == current served, and
// legitimately reads HELD-STALE after any version bump until its gate re-runs (the S23-audio law: a gate that never
// re-ran certified nothing). Only touches EXISTING ior:class:Test units; never mints, never touches Task/other classes.
if (!version) {
  console.warn('  ⚠ no --version given: gateServedVersion NOT stamped on the Test unit(s) — the derived board cannot self-release without it. Pass --version <served>.');
} else {
  for (const item of gatedItems) {
    const u = item.replace('ior:instance:', '');
    const p = path.join(SCENARIO_INDEX, prefixPath(u), `${u}.scenario.json`);
    if (!fs.existsSync(p)) { console.warn(`  ⚠ gated item ${u.slice(0, 8)} not found on disk — skipped`); continue; }
    const unit = JSON.parse(fs.readFileSync(p, 'utf-8'));
    if (unit.ior !== 'ior:class:Test') continue; // only Test units carry the gate result
    unit.model.gateServedVersion = version;         // the served version this gate PASSED against (derived-board reads THIS: SIGNABLE iff ==current-served, HELD-STALE iff <)
    if (commit) unit.model.gateServedCommit = commit; // provenance (planner-agreed shape)
    unit.model.gateVerdict = verdict;
    unit.model.gatedAt = gate.model.timestamp;
    if (verdict === 'PASS') unit.model.status = 'pass'; else if (verdict === 'FAIL') unit.model.status = 'fail';
    fs.writeFileSync(p, JSON.stringify(unit, null, 2));
    console.log(`  Test ${u.slice(0, 8)}: gateServedVersion=${version}${commit ? ` @${commit}` : ''} verdict=${verdict}`);
  }
}
