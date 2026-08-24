/**
 * R40.58 D1 GUARD (D — architect 9aedb3fab / PO). PROPERTY: you may not defeat the type checker on a value returned by
 * one of OUR OWN typed functions, by re-declaring its shape (`as {…}`) OR widening (`as any`) OR asserting a WRONG
 * named type. Mechanism, not syntax — an `as`-cast on such a call silences the field-check exactly where it matters
 * (the R40.56 bug: `slotsFrom(...) as { current?: { uuid?: string } }` let `.uuid` compile; real field `.taskUuid` →
 * '' → every task 'other', shipped). A cast that disables the detector is worse than a missing guard.
 * [[as-cast-lies-consume-the-exported-type]] [[scan-the-hazard-not-the-actors]]
 *
 * BY CONSTRUCTION (no allowlist to rot): STRUCTURALLY DISCOVER our exported typed fns — free functions AND exported
 * CLASS METHODS (static + instance) that declare a return type — recording each name, its owning module/class, and its
 * declared return type. Then flag any `as`-cast applied to a CALL of one of them, UNLESS the cast asserts that fn's
 * EXACT declared return type (a redundant no-op). Call-sites matched by NAME + MODULE/CLASS (not name alone) so a
 * same-name external fn (DOM `.get`, etc.) can't false-positive. DOM casts / `unit.model as any` (property access, not
 * a call of our typed fn) are out of scope by construction.
 *
 * Run: /opt/node22/bin/node --import tsx scripts/check-no-cast-on-typed-return.ts [--strict|--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['src/ts', 'src/public/ts', 'src/shared'];

export interface TypedFn { key: string; kind: 'free' | 'method'; cls?: string; ret: string } // ret = declared return type

// ── DISCOVER our exported typed fns (free + class methods with a declared return type). ──
export function discoverTypedFns(sources: string[]): Map<string, TypedFn> {
  const out = new Map<string, TypedFn>();
  for (const src of sources) {
    // free: export [async] function NAME(...): RET {
    for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*:\s*([^{;]+?)\s*\{/g))
      out.set(m[1], { key: m[1], kind: 'free', ret: m[2].trim() });
    // free arrow: export const NAME = [async] (...): RET =>
    for (const m of src.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*:\s*([^={]+?)\s*=>/g))
      out.set(m[1], { key: m[1], kind: 'free', ret: m[2].trim() });
    // exported classes → their methods with a declared return type
    for (const cm of src.matchAll(/export\s+class\s+([A-Za-z_$][\w$]*)/g)) {
      const cls = cm[1];
      const open = src.indexOf('{', cm.index! + cm[0].length);
      if (open < 0) continue;
      let depth = 0, i = open;
      for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (depth === 0) { i++; break; } } }
      const body = src.slice(open, i);
      for (const mm of body.matchAll(/(?:^|\n)\s*(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*:\s*([^{;]+?)\s*\{/g)) {
        const name = mm[1];
        if (['if', 'for', 'while', 'switch', 'catch', 'constructor'].includes(name)) continue; // not methods
        out.set(`${cls}.${name}`, { key: `${cls}.${name}`, kind: 'method', cls, ret: mm[2].trim() });
      }
    }
  }
  return out;
}

// Extract the callee expression whose result an `as` at index `asIdx` casts (the `)` before `as`, brace-matched back).
function calleeBefore(src: string, asIdx: number): string | null {
  let j = asIdx - 1;
  while (j >= 0 && /\s/.test(src[j])) j--;
  if (src[j] !== ')') return null; // the cast must apply to a call result
  let depth = 0, k = j;
  for (; k >= 0; k--) { if (src[k] === ')') depth++; else if (src[k] === '(') { depth--; if (depth === 0) break; } }
  if (k < 0) return null;
  // read the callee member-chain immediately before `(`, BALANCING any `(...)`/`[...]` inside it (e.g. the constructor
  // in `new ScenarioIndex(X).get`) so the owning class survives in the callee string.
  let s = k - 1;
  while (s >= 0 && /\s/.test(src[s])) s--;
  const e = s;
  while (s >= 0) {
    const ch = src[s];
    if (/[A-Za-z0-9_$.]/.test(ch)) { s--; continue; }
    if (ch === ')' || ch === ']') { const close = ch, openCh = ch === ')' ? '(' : '['; let d = 0; for (; s >= 0; s--) { if (src[s] === close) d++; else if (src[s] === openCh) { d--; if (d === 0) { s--; break; } } } continue; }
    break; // whitespace/operator boundary (drops a leading `new `, but the class name is retained)
  }
  return src.slice(s + 1, e + 1);
}

// ── flag as-casts on calls of our typed fns (exported for the selftest). ──
export function castHazards(src: string, typed: Map<string, TypedFn>): { pos: number; callee: string; cast: string }[] {
  const out: { pos: number; callee: string; cast: string }[] = [];
  for (const m of src.matchAll(/\bas\s+(\{[^;\n]*|any\b|[A-Za-z_$][\w$]*)/g)) {
    const callee = calleeBefore(src, m.index!);
    if (!callee) continue;
    // resolve callee → a discovered typed fn. free: last identifier ∈ free-set. method: `Class.method` present in callee chain.
    const lastName = callee.split('.').pop()!.replace(/[()]/g, '');
    let fn: TypedFn | undefined = typed.get(lastName) && typed.get(lastName)!.kind === 'free' ? typed.get(lastName) : undefined;
    if (!fn) {
      for (const t of typed.values()) if (t.kind === 'method' && t.key.endsWith(`.${lastName}`) && new RegExp(`\\b${t.cls}\\b`).test(callee)) { fn = t; break; }
    }
    if (!fn) continue; // not a call of one of OUR typed fns (DOM / external / property-access → out by construction)
    const cast = m[1].startsWith('{') ? '{…}' : m[1];
    if (cast === fn.ret.replace(/\s+/g, ' ')) continue; // `as <exact declared return type>` = redundant no-op, allowed
    out.push({ pos: m.index!, callee, cast });
  }
  return out;
}

function readSources(): { rel: string; src: string }[] {
  const files: { rel: string; src: string }[] = [];
  const walk = (dir: string): void => {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(rel); continue; }
      if (!e.name.endsWith('.ts') || e.name.endsWith('.d.ts') || rel.split(path.sep).includes('__tests__')) continue;
      files.push({ rel: rel.split(path.sep).join('/'), src: fs.readFileSync(path.join(ROOT, rel), 'utf-8') });
    }
  };
  for (const d of SCAN_DIRS) walk(d);
  return files;
}

function lineOf(src: string, pos: number): number { return src.slice(0, pos).split('\n').length; }

function selftest(): number {
  let fail = 0;
  const ck = (n: string, c: boolean) => { console.log(`  ${c ? 'PASS' : 'FAIL'}  ${n}`); if (!c) fail++; };
  const disc = discoverTypedFns([
    'export class CurrentSprint {\n  static slotsFrom(a: number, b: string): ThreeSlots {\n    return x;\n  }\n}',
    'export class ScenarioIndex {\n  get(k: string): ScenarioUnit | undefined {\n    return u;\n  }\n}',
    'export function resolveSprintPin(i: number): SprintPin {\n  return p;\n}',
  ]);
  ck('discovers CurrentSprint.slotsFrom / ScenarioIndex.get / resolveSprintPin', disc.has('CurrentSprint.slotsFrom') && disc.has('ScenarioIndex.get') && disc.has('resolveSprintPin'));
  // as-SHAPE on a discovered method call → RED
  ck('slotsFrom(...) as { current?: {uuid?} } → RED', castHazards('const s = CurrentSprint.slotsFrom(idx, a) as { current?: { uuid?: string } };', disc).length === 1);
  // as-ANY on the same call → RED (the case A missed)
  ck('slotsFrom(...) as any → RED (A missed this)', castHazards('const s = CurrentSprint.slotsFrom(idx, a) as any;', disc).length === 1);
  // as-SHAPE on new ScenarioIndex().get → RED (class-method via new-chain)
  ck('new ScenarioIndex(x).get(k) as { model?: unknown } → RED', castHazards('const g = new ScenarioIndex(X).get(key) as { model?: unknown };', disc).length === 1);
  // as the EXACT declared return type → allowed (redundant no-op)
  ck('slotsFrom(...) as ThreeSlots (real type) → allowed', castHazards('const s = CurrentSprint.slotsFrom(idx, a) as ThreeSlots;', disc).length === 0);
  // consume with no cast → allowed
  ck('slotsFrom(...) then .taskUuid, no cast → allowed', castHazards('const s = CurrentSprint.slotsFrom(idx, a); return s.current?.taskUuid;', disc).length === 0);
  // DOM boundary getElementById as any → NOT ours (not a discovered fn) → allowed
  ck('document.getElementById(x) as any → allowed (external, not ours)', castHazards('const el = document.getElementById(x) as any;', disc).length === 0);
  // property access widening (not a call) → allowed
  ck('unit.model as any (property access, not a call) → allowed', castHazards('const m = unit.model as any;', disc).length === 0);
  // a free typed fn cast → RED
  ck('resolveSprintPin(...) as any → RED', castHazards('const p = resolveSprintPin(1) as any;', disc).length === 1);
  if (fail) { console.error(`check:no-cast-on-typed-return SELFTEST FAILED (${fail}).`); return 1; }
  console.log('check:no-cast-on-typed-return SELFTEST GREEN — discovers our typed fns (free+methods); flags as-shape/as-any/as-wrong on their CALLS; allows exact-return-type / no-cast / DOM / property-access.');
  return 0;
}

const args = process.argv.slice(2);
if (args.includes('--selftest')) process.exit(selftest());

const files = readSources();
const typed = discoverTypedFns(files.map((f) => f.src));
const findings: { file: string; line: number; callee: string; cast: string }[] = [];
for (const f of files) for (const h of castHazards(f.src, typed)) findings.push({ file: f.rel, line: lineOf(f.src, h.pos), callee: h.callee.slice(-48), cast: h.cast });

const strict = args.includes('--strict');
console.log(`\n=== R40.58 no-cast-on-typed-return gate (D) — discovered ${typed.size} typed fns/methods; ${findings.length === 0 ? 'PASS (0 type-defeating casts on our typed-fn calls)' : `FAIL (${findings.length} type-defeating cast${findings.length === 1 ? '' : 's'})`} ===`);
for (const f of findings) console.log(`  - ${f.file}:${f.line} — ${f.callee}(...) as ${f.cast}`);
if (findings.length) console.log('  → consume the exported return type (let the compiler enforce fields); never re-declare/widen/re-type our typed fn results.');
if (strict && findings.length) process.exit(1);
