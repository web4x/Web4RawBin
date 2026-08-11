/**
 * R40.17 INV-C1-9 — the ONE-current-function gate. Only `sprint-pin-resolver.ts` may DERIVE the current sprint.
 * FAILS if any OTHER src file re-derives "what is current" (a 2nd/3rd source — the disease R40.17 killed): a
 * `.filter(... status === 'Active')` used as a current-pick, or a `sprintName → sprint-number` current match. Every
 * consumer must call `resolveSprintPin` and never re-derive. Wired into ci:gates.
 * Run: /opt/node22/bin/node --import tsx scripts/check-pin-single-source.ts [--strict]   (--strict exits 1 on findings)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOW = new Set(['src/ts/scenario/sprint-pin-resolver.ts']); // the ONE legitimate current-deriver
const SCAN_DIRS = ['src/ts', 'src/public/ts', 'src/shared'];
const PATTERNS: { re: RegExp; why: string }[] = [
  { re: /\.filter\([^)]*status[^)]*===?\s*['"]Active['"]/, why: "filter(status==='Active') current-derivation" },
  { re: /sprintName[^\n]*\.find\(\s*\w+\s*=>\s*\w+\.number/, why: 'sprintName→sprint-number current match' },
];

const findings: string[] = [];
function walk(dir: string): void {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(rel); continue; }
    if (!e.name.endsWith('.ts') || e.name.endsWith('.d.ts') || rel.split(path.sep).includes('__tests__')) continue;
    if (ALLOW.has(rel)) continue;
    fs.readFileSync(path.join(ROOT, rel), 'utf-8').split('\n').forEach((line, i) => {
      for (const p of PATTERNS) if (p.re.test(line)) findings.push(`${rel}:${i + 1} — ${p.why}: ${line.trim().slice(0, 100)}`);
    });
  }
}
for (const d of SCAN_DIRS) walk(d);

const strict = process.argv.includes('--strict');
console.log(`\n=== INV-C1-9 pin single-source gate — ${findings.length === 0 ? 'PASS (only resolveSprintPin derives current)' : `FAIL (${findings.length} rogue current-derivation${findings.length === 1 ? '' : 's'})`} ===`);
for (const f of findings) console.log('  - ' + f);
if (findings.length) console.log('  → every consumer must CALL resolveSprintPin (R40.17 single source), never re-derive current.');
if (strict && findings.length) process.exit(1);
