/**
 * R20.20 — Parse test files → one TestCase scenario unit per it() block.
 * IDEMPOTENT: TestCase uuid = crypto hash of file+describe+it path.
 * Re-run produces 0 new units (deterministic UUIDs).
 *
 * Usage: npx tsx scripts/parse-test-cases.ts [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const SCENARIO_INDEX = path.join(PROJECT_ROOT, 'scenario/index');
const TEST_DIRS = [
  path.join(PROJECT_ROOT, 'test/vitest'),
  path.join(PROJECT_ROOT, 'test/e2e'),
];

const dryRun = process.argv.includes('--dry-run');

function hashUuid(input: string): string {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  // Format as v4 UUID with correct version (4) and variant (8-b) bits
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

interface TestCaseInfo {
  file: string;
  describe: string;
  it: string;
  uuid: string;
}

function parseTestFile(filePath: string): TestCaseInfo[] {
  const relPath = path.relative(PROJECT_ROOT, filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const cases: TestCaseInfo[] = [];

  // Find test:uuid for the file (parent Test unit)
  const testUuidMatch = content.match(/\[test:uuid:([0-9a-f-]{36})\]/i);
  const describeStack: string[] = [];

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const describeMatch = line.match(/(?:describe|test\.describe)\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (describeMatch) {
      describeStack.push(describeMatch[1]);
    }

    const closingMatch = line.match(/^\s*\}\s*\)\s*;?\s*$/);
    if (closingMatch && describeStack.length > 0) {
      // Heuristic: closing brace might close a describe — track depth by indentation
    }

    const itMatch = line.match(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (itMatch) {
      const describePath = describeStack.length > 0 ? describeStack[describeStack.length - 1] : '';
      const itName = itMatch[1];
      const hashInput = `${relPath}::${describePath}::${itName}`;
      const uuid = hashUuid(hashInput);
      cases.push({ file: relPath, describe: describePath, it: itName, uuid });
    }
  }

  return cases;
}

function prefixPath(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  return path.join(hex[0], hex[1], hex[2], hex[3], hex[4]);
}

let created = 0, existed = 0, total = 0;
const testFileToUuids: Map<string, string[]> = new Map();

for (const testDir of TEST_DIRS) {
  if (!fs.existsSync(testDir)) continue;
  for (const file of fs.readdirSync(testDir)) {
    if (!file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) continue;
    const filePath = path.join(testDir, file);
    const cases = parseTestFile(filePath);

    // Find parent Test unit UUID
    const content = fs.readFileSync(filePath, 'utf-8');
    const testUuidMatch = content.match(/\[test:uuid:([0-9a-f-]{36})\]/i);
    const testUuid = testUuidMatch?.[1] || '';

    for (const tc of cases) {
      total++;
      const unitPath = path.join(SCENARIO_INDEX, prefixPath(tc.uuid), `${tc.uuid}.scenario.json`);
      if (fs.existsSync(unitPath)) { existed++; continue; }

      const unit = {
        ior: 'ior:class:TestCase',
        model: {
          uuid: tc.uuid,
          name: tc.it,
          file: tc.file,
          describe: tc.describe,
          it: tc.it,
          testUuid,
          status: '',
        },
        ownerIor: testUuid ? `ior:instance:${testUuid}` : null,
      };

      if (!dryRun) {
        const dir = path.join(SCENARIO_INDEX, prefixPath(tc.uuid));
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(unitPath, JSON.stringify(unit, null, 2));
      }
      created++;

      // Track for wiring testCases[] on parent Test
      if (testUuid) {
        const arr = testFileToUuids.get(testUuid) || [];
        arr.push(tc.uuid);
        testFileToUuids.set(testUuid, arr);
      }
    }
  }
}

// Wire testCases[] IOR arrays on parent Test units
if (!dryRun) {
  for (const [testUuid, caseUuids] of testFileToUuids) {
    const testPath = path.join(SCENARIO_INDEX, prefixPath(testUuid), `${testUuid}.scenario.json`);
    if (!fs.existsSync(testPath)) continue;
    const testUnit = JSON.parse(fs.readFileSync(testPath, 'utf-8'));
    const existing = ((testUnit.model as any).testCases as string[]) || [];
    const existingSet = new Set(existing);
    let changed = false;
    for (const cuuid of caseUuids) {
      const ior = `ior:instance:${cuuid}`;
      if (!existingSet.has(ior)) { existing.push(ior); existingSet.add(ior); changed = true; }
    }
    if (changed) {
      (testUnit.model as any).testCases = existing;
      fs.writeFileSync(testPath, JSON.stringify(testUnit, null, 2));
    }
  }
}

console.log(`TestCases: ${total} found, ${created} created, ${existed} already existed`);
if (dryRun) console.log('(dry run — no files written)');
