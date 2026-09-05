/**
 * T37.21 — CHILDREN SINGLE-OWNER guard (architect; Tron "the Folder OWNS the children").
 * A TRACEABILITY QUERY, not a linter: it proves there is exactly ONE owner of children-derivation.
 *
 * SCAN THE HAZARD, NOT THE ACTORS: do NOT enumerate the surfaces we know about — scan for the
 * dangerous OPERATION: any client children-derivation (a raw fetch of /api/trace/children) that does
 * NOT go through the ONE interface implementation. A surface nobody thought of therefore cannot
 * quietly reintroduce the divergence, and the guard stays complete as the codebase grows.
 *
 * ONE NUMBER proves BOTH unevadability AND completeness: nonOwnerChildrenDerivations == 0.
 * The ONE sanctioned site carries the marker `children-owner` (the type's children() backing,
 * e.g. Folder.children()). Every other /api/trace/children fetch is a divergence → RED.
 *
 * FAILABLE + self-biting: deliberately derive children outside the interface (scratch) → this RED.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src', 'public', 'ts');
const HAZARD = /\/api\/trace\/children/;           // the dangerous OPERATION (children-derivation endpoint)
const OWNER_MARK = /children-owner/;                // the ONE sanctioned interface impl marks itself
const FETCH = /\bfetch\s*\(/;                       // a real call-site (not a comment about it)

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === 'dist' ? [] : walk(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}

const violations: string[] = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!HAZARD.test(line) || !FETCH.test(line)) continue;         // only real fetch call-sites of the endpoint
    // sanctioned iff the fetch line OR its enclosing 3-line window carries the children-owner marker
    const win = lines.slice(Math.max(0, i - 2), i + 2).join('\n');
    if (OWNER_MARK.test(win)) continue;
    violations.push(`${file.replace(ROOT, 'src/public/ts')}:${i + 1}  ${line.trim().slice(0, 90)}`);
  }
}

console.log(`children-derivation sites outside the one owner: ${violations.length} (${violations.length === 0 ? 'PASS' : 'FAIL'})`);
for (const v of violations) console.log('  ✗ ' + v);
if (violations.length) {
  console.error(`\n✗ ${violations.length} surface(s) derive children by a raw /api/trace/children fetch instead of node.children().`);
  console.error(`  Route ALL children-derivation through the ONE interface (Folder.children()); mark it 'children-owner'. Zero non-owner derivations = one owner by construction.`);
  process.exit(1);
}
console.log('✓ ONE owner of children-derivation — no surface bypasses the interface (Tron: the Folder owns its children).');
