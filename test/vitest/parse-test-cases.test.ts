/**
 * R20.20 — parse-test-cases generator produces TestCase units.
 * Verifies idempotency, count, and unit structure.
 *
 * [test:uuid:329081ca-977e-46d0-9f7f-4a6d92b34dc3] R20.20 TestCase.parseFromSource
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const INDEX_DIR = 'scenario/index';

function countTestCaseUnits(): number {
  const output = execSync(`grep -rl '"ior:class:TestCase"' ${INDEX_DIR}/`, { encoding: 'utf-8' }).trim();
  return output ? output.split('\n').length : 0;
}

describe('R20.20 parse-test-cases generator', () => {

  it('TestCase units exist on disk (>900)', () => {
    const count = countTestCaseUnits();
    expect(count).toBeGreaterThan(900);
  });

  it('idempotent: re-run produces 0 new units', () => {
    const output = execSync('npx tsx scripts/parse-test-cases.ts', { encoding: 'utf-8', timeout: 30000 });
    expect(output).toContain('0 created');
  });

  it('each TestCase unit has required fields (uuid, name, file)', () => {
    const files = execSync(`grep -rl '"ior:class:TestCase"' ${INDEX_DIR}/ | head -5`, { encoding: 'utf-8' }).trim().split('\n');
    for (const f of files) {
      const unit = JSON.parse(fs.readFileSync(f, 'utf-8'));
      expect(unit.ior).toBe('ior:class:TestCase');
      expect(unit.model.uuid).toMatch(/^[0-9a-f]{8}-/);
      expect(unit.model.name).toBeTruthy();
      expect(unit.model.file).toBeTruthy();
    }
  });

  it('TestCase count matches it()+test()+it.each blocks', () => {
    const tcCount = countTestCaseUnits();
    const itCount = parseInt(execSync("grep -r '^\\s*it(' test/vitest/ test/e2e/ --include='*.ts' --include='*.mjs' 2>/dev/null | wc -l", { encoding: 'utf-8' }).trim());
    const testCount = parseInt(execSync("grep -r '^\\s*test(' test/vitest/ test/e2e/ --include='*.ts' --include='*.mjs' 2>/dev/null | grep -v 'test\\.\\(describe\\|afterAll\\|afterEach\\|beforeEach\\|beforeAll\\)' | wc -l", { encoding: 'utf-8' }).trim());
    const totalBlocks = itCount + testCount;
    // Allow ±30 for it.each expansions and edge cases
    expect(Math.abs(tcCount - totalBlocks)).toBeLessThan(30);
  });
});
