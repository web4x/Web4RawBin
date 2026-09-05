/**
 * T37.21 — CHILDREN SINGLE-OWNER guard (architect; Tron "the Folder OWNS the children").
 * A TRACEABILITY QUERY, not a linter: proves there is exactly ONE owner of children-derivation.
 *
 * SCAN THE HAZARD, NOT THE ACTORS: scan for the dangerous OPERATION — any client children-derivation
 * (a raw fetch of /api/trace/children) that does NOT go through the ONE interface implementation.
 * ONE NUMBER proves unevadability AND completeness: nonOwner == 0 (reached BY ROUTING).
 *
 * ★ GUARD-ON-THE-GUARD (PO 2026-09-05): zero MUST be reached by ROUTING, never by EXEMPTING.
 *  - A site CANNOT exempt itself. There is NO in-file exempt marker. Exemptions live ONLY in the
 *    architect-maintained EXEMPT list below (structural, architect-approved, reason+approvedBy).
 *  - Exempted sites are a SEPARATE number, NEVER folded into the zero.
 *  - The OWNER is exactly ONE file (the interface impl). Two owner-files = two owners = RED.
 *  - A hard site that is genuinely a DIFFERENT query is a DESIGN DECISION → architect+PO, not a self-exempt.
 * FAILABLE + self-biting: derive children outside the interface (scratch) → RED (proven at 9 before green).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src', 'public', 'ts');
const HAZARD = /\/api\/trace\/children|childrenUrl/;   // the dangerous OPERATION — the endpoint literal OR its ALIAS
const FETCH = /\bfetch\s*\(/;              // a real call-site (not a comment)
const ALIAS_DECL = /\bchildrenUrl\b\s*[:(]|get\s+childrenUrl/; // an alias GETTER/field that holds the endpoint = a covert non-owner holder
const OWNER_MARK = /children-owner/;       // the ONE interface impl marks its fetch(es)

// ★ ARCHITECT-ONLY exemptions — a site is exempt ONLY if listed HERE (never self-declared in-file).
// Each MUST carry a reason + approvedBy(design-note/commit). Reported as a SEPARATE number, never folded into 0.
const EXEMPT: { file: string; line: number; reason: string; approvedBy: string }[] = [
  // (empty) — 9→0 is by ROUTING. Add ONLY after an architect+PO design decision that a site is a distinct query.
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === 'dist' ? [] : walk(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}
const rel = (f: string) => f.replace(ROOT, 'src/public/ts');
const isExempt = (f: string, ln: number) => EXEMPT.some((e) => e.file === rel(f) && e.line === ln);

const ownerFiles = new Set<string>();
const nonOwner: string[] = [];
const exempted: string[] = [];
// ★ OBJECT vs MODULE (PO 2026-09-05): 9→0 can also be faked by a shared children(ref) HELPER all surfaces call — one
// owner file, zero raw fetches outside, guard green, but it is the PROVIDER by another name. The OWNER must be the OBJECT:
// node.children() a METHOD on the type (uses this.ref), NOT a free function taking a ref. An owner fetch with no `this.`
// in scope is a module-owns-on-the-object's-behalf service → RED.
const ownerNotMethod: string[] = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!HAZARD.test(lines[i]) || !(FETCH.test(lines[i]) || ALIAS_DECL.test(lines[i]))) continue; // a fetch OR an alias-getter that holds the endpoint (childrenUrl) — both are children-derivation outside the owner
    const win = lines.slice(Math.max(0, i - 2), i + 2).join('\n');
    const site = `${rel(file)}:${i + 1}  ${lines[i].trim().slice(0, 88)}`;
    if (OWNER_MARK.test(win)) { ownerFiles.add(rel(file)); if (!/this\./.test(win)) ownerNotMethod.push(site); continue; } // routed through the interface — must be a METHOD on the object (this.ref), not a free fn(ref)
    if (isExempt(file, i + 1)) { exempted.push(site); continue; }         // architect-approved distinct query
    nonOwner.push(site);
  }
}

console.log(`non-owner children-derivations: ${nonOwner.length} (must be 0 BY ROUTING)  |  exempted (architect-approved): ${exempted.length}  |  owner-file(s): ${[...ownerFiles].join(', ') || '(none yet)'}`);
for (const v of nonOwner) console.log('  ✗ non-owner: ' + v);
for (const v of exempted) console.log('  ⓘ exempt: ' + v);

let fail = false;
if (ownerFiles.size > 1) { console.error(`\n✗ TWO owners: children-owner appears in ${ownerFiles.size} files (${[...ownerFiles].join(', ')}). There must be exactly ONE owner.`); fail = true; }
if (ownerNotMethod.length) { console.error(`\n✗ ${ownerNotMethod.length} owner fetch(es) are NOT a method on the object (no this.ref) = a free-function children(ref) service = the PROVIDER escape Tron rejected. The owner must be the OBJECT (node.children()), not a module.`); for (const v of ownerNotMethod) console.error('  ✗ module-not-object: ' + v); fail = true; }
if (nonOwner.length) { console.error(`\n✗ ${nonOwner.length} surface(s) derive children by raw /api/trace/children instead of node.children(). Route them (do NOT exempt). Distinct query → architect+PO design decision.`); fail = true; }
if (fail) process.exit(1);
console.log(`✓ ONE owner of children-derivation (${exempted.length} architect-approved exemptions, listed separately). Divergence class dead by construction.`);
