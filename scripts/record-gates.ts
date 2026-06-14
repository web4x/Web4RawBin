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

if (!gateType) {
  console.log('Usage: npx tsx scripts/record-gates.ts --type <gate-type> --verdict PASS|FAIL --evidence "..." --gated-by <role> --items <uuid...>');
  process.exit(1);
}

const uuid = hashUuid(`gate:${gateType}:${verdict}:${gatedItems.join(',')}:${new Date().toISOString().slice(0, 10)}`);
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
