/**
 * T170 Gate 2: Rule-pair (#15+#16) validation.
 * Checks that commits touching user-facing files also bump package.json + sw.js.
 *
 * Usage:
 *   npx tsx scripts/rule-pair-check.ts          # report
 *   npx tsx scripts/rule-pair-check.ts --strict  # exits non-zero on violation
 *
 * [impl:uuid:75628241-9157-4385-a7f0-f4f7a3142737] R-G CI gates
 */
import { execSync } from 'node:child_process';

const USER_FACING_PREFIXES = ['src/public/', 'src/ts/server/server.ts'];
const USER_FACING_INCLUDES = ['/templates', '/trace/'];

function checkRulePair(): { pass: boolean; violations: string[] } {
  let changed: string[];
  try {
    changed = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' }).split('\n').filter(Boolean);
  } catch {
    console.log('No git history available — skipping rule-pair check');
    return { pass: true, violations: [] };
  }

  const userFacing = changed.filter(f =>
    USER_FACING_PREFIXES.some(p => f.startsWith(p)) ||
    USER_FACING_INCLUDES.some(p => f.includes(p))
  );

  if (userFacing.length === 0) return { pass: true, violations: [] };

  const hasPkgBump = changed.includes('package.json');
  const hasSwBump = changed.includes('src/public/sw.js');

  const violations: string[] = [];
  if (!hasPkgBump) violations.push('package.json version not bumped (rule-pair (a))');
  if (!hasSwBump) violations.push('src/public/sw.js CACHE_NAME not bumped (rule-pair (b))');

  return { pass: violations.length === 0, violations };
}

const result = checkRulePair();
const strict = process.argv.includes('--strict');

console.log(`\n=== Rule-Pair Gate (#15+#16) ===`);
if (result.pass) {
  console.log('PASS — no violations');
} else {
  console.log(`FAIL — ${result.violations.length} violation(s):`);
  for (const v of result.violations) console.log(`  - ${v}`);
}

if (strict && !result.pass) process.exit(1);
