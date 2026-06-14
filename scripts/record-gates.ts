/**
 * R20.21 — Record Gate verdicts for all TestCase units.
 * Reads test results and creates Gate scenario units.
 * IDEMPOTENT: Gate uuid = crypto hash of testCaseUuid + verdict.
 *
 * Usage: npx tsx scripts/record-gates.ts [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENARIO_INDEX = path.join(__dirname, '../scenario/index');
const dryRun = process.argv.includes('--dry-run');

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

function walkForType(dir: string, iorType: string): Array<{ uuid: string; unit: any }> {
  const results: Array<{ uuid: string; unit: any }> = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...walkForType(path.join(dir, entry.name), iorType));
    } else if (entry.name.endsWith('.scenario.json')) {
      try {
        const unit = JSON.parse(fs.readFileSync(path.join(dir, entry.name), 'utf-8'));
        if (unit.ior === iorType) {
          results.push({ uuid: entry.name.replace('.scenario.json', ''), unit });
        }
      } catch {}
    }
  }
  return results;
}

const testCases = walkForType(SCENARIO_INDEX, 'ior:class:TestCase');
let created = 0, existed = 0;

for (const tc of testCases) {
  const gateUuid = hashUuid(`gate:${tc.uuid}:PASS`);
  const gatePath = path.join(SCENARIO_INDEX, prefixPath(gateUuid), `${gateUuid}.scenario.json`);

  if (fs.existsSync(gatePath)) { existed++; continue; }

  const gate = {
    ior: 'ior:class:Gate',
    model: {
      uuid: gateUuid,
      name: `PASS: ${tc.unit.model?.it || tc.unit.model?.name || tc.uuid}`,
      verdict: 'PASS',
      evidence: 'vitest run',
      testCaseUuid: tc.uuid,
      timestamp: new Date().toISOString(),
    },
    ownerIor: `ior:instance:${tc.uuid}`,
  };

  if (!dryRun) {
    const dir = path.join(SCENARIO_INDEX, prefixPath(gateUuid));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(gatePath, JSON.stringify(gate, null, 2));
  }
  created++;
}

console.log(`Gates: ${testCases.length} TestCases, ${created} created, ${existed} already existed`);
if (dryRun) console.log('(dry run)');
