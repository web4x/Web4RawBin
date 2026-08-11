/**
 * check-altid-canon — S37's consistency-by-construction thesis applied to ITSELF: task/requirement naming can never
 * drift back to a bespoke scheme. Fold into ci:gates (RED on any bespoke id).
 *
 * ★ COVERS BOTH FORMS (PO ruling 2026-08-11): a TASK carries NO altId — its identity lives in `model.name`
 * ("Task 37.1: …") + `model.slug` ("task-37.1-…"); a REQUIREMENT carries `model.altId` ("R37.1"). An altId-ONLY
 * check would pass every task no matter how it is named (half-blind), so we assert canon on task name+slug AND req altId.
 *
 * The bespoke scheme we killed (S37 was `C1..C8` / `R-C1..R-C10`) vs fleet canon `<sprint>.<index>`
 * (Task 37.1, R37.1, slug task-37.1-). This gate asserts the bespoke `C<n>` scheme is ABSENT on both surfaces —
 * so a planted `C9` altId or a `Task C9` / `task-c9-` name goes RED, and a weakened guard (the tester's meta-bite) goes RED.
 *
 * Determinism: read-only over the scenario index; sort violations by uuid; exit 1 iff any.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allUnits } from './generate-sprint-md.js'; // reuse the ONE loader (keys by model.uuid)

const BESPOKE_TASK_NAME = /^Task C\d/;   // "Task C1:", "Task C4.1:"
const BESPOKE_TASK_SLUG = /^task-c\d/;   // "task-c1-…", "task-c4.1-…"
const BESPOKE_REQ_ALTID = /^R-C\d/;      // "R-C1", "R-C10"

export interface CanonViolation { uuid: string; ior: string; surface: 'name' | 'slug' | 'altId'; value: string; }

// [impl:uuid:8f934116-b64b-47f1-b206-da658e94c5c3] AltIdCanonGuard.assertNoBespokeScheme — the canon guard (R37.13)
export function findAltIdCanonViolations(units = allUnits()): CanonViolation[] {
  const v: CanonViolation[] = [];
  for (const [uuid, u] of units) {
    const m = u.model as Record<string, unknown>;
    if (u.ior === 'ior:class:Task') {
      const name = String(m.name || ''), slug = String(m.slug || '');
      if (BESPOKE_TASK_NAME.test(name)) v.push({ uuid, ior: u.ior, surface: 'name', value: name.slice(0, 48) });
      if (BESPOKE_TASK_SLUG.test(slug)) v.push({ uuid, ior: u.ior, surface: 'slug', value: slug });
    } else if (u.ior === 'ior:class:Requirement') {
      const altId = String(m.altId || '');
      if (BESPOKE_REQ_ALTID.test(altId)) v.push({ uuid, ior: u.ior, surface: 'altId', value: altId });
    }
  }
  return v.sort((a, b) => a.uuid.localeCompare(b.uuid));
}

// ★ FAMILY: scheme-literal-in-source (added 2026-08-11 per PO, from the sprint-overview:73 find). check-altid-canon
// inspects UNITS; it structurally COULD NOT catch a hardcoded scheme literal in generator SOURCE — which is exactly
// where tonight's board-drift defect lived (the overview index header hardcoded 'R-C1 pin + R-C5 rollup'). This scan
// closes that blind side: FAIL on a bespoke `R-C<n>` / `task-c<n>` / `Task C<n>` literal in src/ + scripts/*.ts —
// so a rename can never again leave a generator ASSERTING the dead scheme. EXCLUSIONS: the `INV-C<n>` invariant-ID
// namespace (a DIFFERENT namespace, referenced in code+gates — renaming it would be a code change with test/gate
// fallout, the corruption we correctly refused); comment-only lines (docs, not emitted); and THIS file (it defines
// the bespoke patterns it hunts). Uppercase R-C/Task C + lowercase task-c never match lowercase commit hashes.
export interface SourceLiteral { file: string; line: number; text: string; }

const SCHEME_LITERAL = /R-C\d|task-c\d|Task C\d/;
const INV_NAMESPACE = /INV-C\d/;                              // excluded: invariant IDs, a different namespace
const COMMENT_ONLY = /^\s*(\/\/|\*|\/\*)/;                    // a doc/comment line — not emitted, not a generator assertion

function walkTs(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walkTs(p, out); }
    else if (e.name.endsWith('.ts') && !e.name.endsWith('check-altid-canon.ts')) out.push(p);
  }
  return out;
}

export function findSchemeLiteralsInSource(root: string): SourceLiteral[] {
  const files = [...walkTs(path.join(root, 'src')), ...walkTs(path.join(root, 'scripts'))];
  const hits: SourceLiteral[] = [];
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (COMMENT_ONLY.test(l)) continue;                    // skip doc comments
      // remove INV-C tokens first so an on-line INV-C1 never masks a real R-C1 (and never itself trips the scan)
      const scrubbed = l.replace(/INV-C\d+(-\d+)?/g, '');
      if (SCHEME_LITERAL.test(scrubbed)) hits.push({ file: path.relative(root, f), line: i + 1, text: l.trim().slice(0, 90) });
    }
  }
  return hits;
}

if (process.argv[1] && process.argv[1].endsWith('check-altid-canon.ts')) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const unitViolations = findAltIdCanonViolations();
  const srcLiterals = findSchemeLiteralsInSource(root);
  console.log('=== check-altid-canon — UNIT canon (task name+slug AND req altId) + SOURCE canon (scheme-literal-in-source) ===');
  let bad = false;
  if (unitViolations.length === 0) console.log('✓ units: 0 bespoke-scheme ids.');
  else { bad = true; console.log(`✗ units: ${unitViolations.length} bespoke-scheme id(s):`); for (const x of unitViolations) console.log(`  ${x.ior.replace('ior:class:', '')} ${x.uuid.slice(0, 8)} ${x.surface} bespoke: "${x.value}"`); }
  if (srcLiterals.length === 0) console.log('✓ source: 0 hardcoded scheme literals (INV-C excluded).');
  else { bad = true; console.log(`✗ source: ${srcLiterals.length} hardcoded scheme-literal(s) — a generator/script asserting the dead scheme:`); for (const s of srcLiterals) console.log(`  ${s.file}:${s.line}  ${s.text}`); }
  process.exit(bad ? 1 : 0);
}
