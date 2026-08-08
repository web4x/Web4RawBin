/**
 * R40.4 gate — DRY-ENFORCED (not DRY-claimed): the 'Sprint <number>' DISPLAY format is composed in exactly ONE place,
 * sprintPrefix @ src/ts/scenario/sprint-label.ts. Any OTHER src/scripts site that interpolates or concatenates a number
 * after 'Sprint ' FAILS the build. Without this a fourth bypass site (like server.ts:1384 / generator.ts:104, which a
 * client-scoped grep missed) reappears and we relearn it. Enforce the invariant; do not merely comment it.
 * Run: /opt/node22/bin/node --import tsx scripts/check-sprint-label.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOW = path.join(ROOT, 'src/ts/scenario/sprint-label.ts'); // the ONE home of the atom
// the DISPLAY composition: a 'Sprint ' string literal immediately followed by a numeric interpolation or a concat.
const COMPOSE = /(`Sprint \$\{|['"]Sprint ['"]\s*\+|`Sprint `\s*\+)/;
const CODE = /\.(ts|mjs)$/;
const offenders: string[] = [];

const stripComment = (line: string): string => {
  const s = line.replace(/\/\/.*$/, '');            // trailing line comment
  return /^\s*\*/.test(line) || /^\s*\/\//.test(line) ? '' : s; // whole-line JSDoc/comment → ignore
};
const walk = (d: string): void => {
  let ents: fs.Dirent[]; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (CODE.test(e.name) && !/\.(test|spec)\./.test(e.name) && p !== ALLOW) {
      const src = fs.readFileSync(p, 'utf-8');
      src.split('\n').forEach((line, i) => { if (COMPOSE.test(stripComment(line))) offenders.push(`${path.relative(ROOT, p)}:${i + 1}  ${line.trim().slice(0, 90)}`); });
    }
  }
};
for (const d of ['src', 'scripts']) walk(path.join(ROOT, d));

if (offenders.length) {
  console.error(`\n✗ check:sprint-label FAIL — the 'Sprint <number>' format is composed OUTSIDE sprint-label.ts (${offenders.length} site(s)); route them through sprintPrefix:`);
  for (const o of offenders) console.error(`  - ${o}`);
  process.exit(1);
}
console.log('✓ check:sprint-label — the Sprint-number format is composed ONLY in sprint-label.ts (sprintPrefix). Single-source enforced.');
