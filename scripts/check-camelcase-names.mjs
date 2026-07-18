#!/usr/bin/env node
// check-camelcase-names.mjs — correct-by-construction naming gate (robbin-req 2026-07-18, per Tron/PO).
// UseCase + Method unit names MUST be camelCase (Object.verb / Class.method) — NO snake_case / underscores.
// Rejects at CI / pre-commit / mint so a snake_case name can never land (the 12 merge-action UCs + 4 edges slipped past manual review).
// Usage: node scripts/check-camelcase-names.mjs   (exit 1 on any violation)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const INDEX = join(ROOT, 'scenario/index');

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.scenario.json')) out.push(p);
  }
  return out;
}

// snake_case gate: a UseCase/Method name must NOT contain an underscore (camelCase is the convention).
// Scoped to underscores (the unambiguous snake_case marker) so it does NOT false-flag Method units that
// store a full signature as their name (e.g. "SpeakingTree.symlinkJson(sprint, tasks): void") — those are
// camelCase with an appended signature, not snake_case.
const isSnakeCase = (name) => name.includes('_');

const viol = [];
for (const f of walk(INDEX)) {
  let d;
  try { d = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
  const ior = d.ior, name = d.model?.name;
  if ((ior === 'ior:class:UseCase' || ior === 'ior:class:Method') && typeof name === 'string') {
    if (isSnakeCase(name)) {
      viol.push(`${ior.split(':').pop()}  ${name}  (${d.model.uuid?.slice(0, 8)})`);
    }
  }
}

if (viol.length) {
  console.error(`✗ camelCase name gate: ${viol.length} snake_case / non-camelCase UseCase/Method name(s):`);
  for (const v of viol) console.error('   ' + v);
  console.error('Rename to camelCase (name field only; keep UUIDs). See scripts/check-camelcase-names.mjs.');
  process.exit(1);
}
console.log('✓ camelCase name gate: all UseCase/Method names are camelCase (0 violations).');
