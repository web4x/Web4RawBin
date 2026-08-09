/**
 * R-C3 [test]-marker AST-attach — the ONE SHARED single-source predicate (architect da2a029e8 / 3-bucket a08ab0f27).
 * Symmetric with the [impl] rule in strict-marker-audit.ts: a [test:uuid] credits chain-completion ONLY if it HEADS
 * a name/intent-matched it()/test()/describe() block. BOTH trace-audit and the tester's baseline import THIS module
 * (over the same file-set + marker regex) so the per-bucket counts CANNOT diverge (kills the 87%-vs-11% + 387-vs-652
 * drift). Fail-closed toward the LOWER-credit bucket on ambiguity — suspending real-but-unproven work is honest;
 * erasing it is the mirror error of inflating (both-directions rule).
 */
import * as ts from 'typescript';

export type TestBucket = 'PROVEN_COMPLETE' | 'UNPROVEN' | 'PROVEN_FICTIONAL';
export interface TestBlock { title: string; fullStart: number; start: number; end: number }

/** All it()/test()/describe() (incl .only/.each/.skip) call blocks with a string title, AST-parsed. */
export function collectTestBlocks(src: string, filePath: string): TestBlock[] {
  const sf = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const blocks: TestBlock[] = [];
  const isTestCall = (call: ts.CallExpression): boolean => {
    let e = call.expression;
    while (ts.isPropertyAccessExpression(e)) e = e.expression; // unwrap it.only / test.each / describe.skip
    return ts.isIdentifier(e) && (e.text === 'it' || e.text === 'test' || e.text === 'describe');
  };
  const titleOf = (call: ts.CallExpression): string | null => {
    const a = call.arguments[0];
    return a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) ? a.text : null;
  };
  // a REAL vitest block is it/test/describe('title', () => {…}) — a string title AND a function body. Requiring the
  // function 2nd arg excludes gate scripts' bare helper calls (test(value)) that would else false-count as blocks and
  // wrongly pigeonhole a DET gate's markers as fictional.
  const hasFnBody = (call: ts.CallExpression): boolean => call.arguments.length >= 2 && (ts.isArrowFunction(call.arguments[1]) || ts.isFunctionExpression(call.arguments[1]));
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && isTestCall(n) && hasFnBody(n)) {
      const title = titleOf(n);
      if (title != null) {
        // anchor on the enclosing ExpressionStatement — it carries the leading-trivia (the marker comment).
        const anchor: ts.Node = n.parent && ts.isExpressionStatement(n.parent) ? n.parent : n;
        blocks.push({ title, fullStart: anchor.getFullStart(), start: anchor.getStart(sf), end: anchor.getEnd() });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return blocks;
}

const STOP = new Set(['the', 'a', 'an', 'to', 'of', 'for', 'and', 'or', 'is', 'on', 'with', 'test', 'tests', 'should', 'when', 'then', 'it', 'that', 'in', 'via', 'by', 'not', 'no']);
function tokens(s: string): Set<string> {
  return new Set(String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter((t) => t.length > 2 && !STOP.has(t)));
}
/** Intent-match: ≥1 significant token shared between the block title and the Test unit's name (fail-closed: empty→false). */
export function nameMatch(title: string, unitName: string): boolean {
  const a = tokens(title), b = tokens(unitName);
  if (!a.size || !b.size) return false;
  for (const t of b) if (a.has(t)) return true;
  return false;
}

/** A marker HEADS a name-matched block iff its offset sits in that block's leading-trivia gap AND the title intent-matches. */
export function isTestMarkerAttached(markerOffset: number, blocks: TestBlock[], unitName: string): boolean {
  for (const b of blocks) if (markerOffset >= b.fullStart && markerOffset < b.start && nameMatch(b.title, unitName)) return true;
  return false;
}

/**
 * A GATE-STYLE test file (tester's blind-spot fix): a DET script/browser gate — assertions + exit-code + a
 * GREEN/RED verdict, but NO it()/test()/describe() blocks (the r-nnn / rc-nnn / dash-gate.mjs scripts). Its assertions ARE backing; the
 * pigeonhole (markers > it-blocks) does NOT apply — 0 it-blocks would else FALSELY mark real two-key-closed gates
 * fictional. So a marker in a gate-style file is at WORST UNPROVEN (backable; two-key/read promotes to complete),
 * NEVER auto-FICTIONAL. Erasing a real gate's work is the mirror error of inflating.
 */
export function fileHasGateAssertions(src: string): boolean {
  return /\bassert(\.\w+)?\s*\(|\bexpect\s*\(|\bprocess\.exit\s*\(|(GREEN|RED|PASS|FAIL|✓|✗)/.test(src);
}

/**
 * The 3-bucket classifier (INV-T4), fail-closed toward the lower-credit bucket:
 *  PROVEN_COMPLETE  — AST-attached to a name-matched it()/test()/describe() block (credit STANDS)
 *  UNPROVEN         — not attached but backable: file has ≥ as many it-blocks as markers, OR it's a GATE-STYLE file
 *                     (assertions but no it-blocks) → credit SUSPENDED (re-attach / two-key promotes)
 *  PROVEN_FICTIONAL — not attached AND a vitest/it()-style file with MORE markers than it-blocks (pigeonhole:
 *                     some provably can't back anything) → credit DENIED (write-test debt). Gate-style is EXEMPT.
 */
export function classifyTestMarker(opts: { markerOffset: number; blocks: TestBlock[]; unitName: string; fileMarkerCount: number; fileBlockCount: number; gateStyle?: boolean }): TestBucket {
  if (isTestMarkerAttached(opts.markerOffset, opts.blocks, opts.unitName)) return 'PROVEN_COMPLETE';
  // PROVEN_FICTIONAL requires PROOF of un-backability = the pigeonhole, which only exists for it()-style files
  // (markers > it-blocks). A file with ZERO it-blocks (gate/DET script) has no such proof → UNPROVEN, never auto-denied
  // (the tester's blind-spot: token-based gate-detection missed browser gates; 0-it-blocks is the robust signal).
  if (opts.gateStyle || opts.fileBlockCount === 0) return 'UNPROVEN';
  return opts.fileMarkerCount > opts.fileBlockCount ? 'PROVEN_FICTIONAL' : 'UNPROVEN';
}

export interface TestMarkerRef { uuid: string; file: string; offset: number; unitName: string }
export interface TestMarkerBuckets { complete: TestMarkerRef[]; unproven: TestMarkerRef[]; fictional: TestMarkerRef[] }

/** Single-source analyzer both trace-audit and the tester baseline import → identical per-bucket counts by construction. */
export function analyzeTestMarkers(fileSrcs: Map<string, string>, markers: TestMarkerRef[]): TestMarkerBuckets {
  const blocksByFile = new Map<string, TestBlock[]>();
  const gateByFile = new Map<string, boolean>();
  const markerCountByFile = new Map<string, number>();
  for (const m of markers) markerCountByFile.set(m.file, (markerCountByFile.get(m.file) || 0) + 1);
  const getBlocks = (f: string): TestBlock[] => { if (!blocksByFile.has(f)) blocksByFile.set(f, collectTestBlocks(fileSrcs.get(f) || '', f)); return blocksByFile.get(f)!; };
  const isGate = (f: string): boolean => { if (!gateByFile.has(f)) gateByFile.set(f, getBlocks(f).length === 0 && fileHasGateAssertions(fileSrcs.get(f) || '')); return gateByFile.get(f)!; };
  const out: TestMarkerBuckets = { complete: [], unproven: [], fictional: [] };
  for (const m of markers) {
    const blocks = getBlocks(m.file);
    const bucket = classifyTestMarker({ markerOffset: m.offset, blocks, unitName: m.unitName, fileMarkerCount: markerCountByFile.get(m.file) || 0, fileBlockCount: blocks.length, gateStyle: isGate(m.file) });
    (bucket === 'PROVEN_COMPLETE' ? out.complete : bucket === 'UNPROVEN' ? out.unproven : out.fictional).push(m);
  }
  return out;
}

// ── single-source FULL SCAN (architect e4e1fa41d: all 4 dims in ONE function — gate/tester/planner import THIS) ──
const MARKER_RE = /\[test:uuid:([0-9a-f-]{8,36})\]/gi;
const IN_SCOPE_SRC = /\.(test|spec)\.(ts|js|mjs)$/;   // in src/, only *.test.*/*.spec.* back a chain
const ANY_CODE = /\.(ts|js|mjs)$/;
export interface ScanResult extends TestMarkerBuckets { outsideScope: TestMarkerRef[]; markerTotal: number; fileCount: number }

/**
 * The ONE glob+regex+classify entry (dim 1-4 single-source). test/ = ALL .ts/.js/.mjs (any name incl gate scripts +
 * visual dir); src/ = only test-or-spec files as in-scope backing — a [test:uuid] in a NON-test src file is
 * test-marker-OUTSIDE-SCOPE (INVALID, 0 credit, REPORTED not dropped). Excludes dist/node_modules/.git.
 */
export function scanTestMarkers(root: string, nameOf: (uuid: string) => string, fsMod: { readdirSync: Function; readFileSync: Function }, pathJoin: (...p: string[]) => string): ScanResult {
  const fileSrcs = new Map<string, string>();
  const inScope: TestMarkerRef[] = []; const outsideScope: TestMarkerRef[] = [];
  const collect = (p: string, scoped: boolean) => {
    const src = String(fsMod.readFileSync(p, 'utf-8')); fileSrcs.set(p, src);
    let m: RegExpExecArray | null; MARKER_RE.lastIndex = 0;
    while ((m = MARKER_RE.exec(src))) { const ref: TestMarkerRef = { uuid: m[1], file: p, offset: m.index, unitName: nameOf(m[1]) }; (scoped ? inScope : outsideScope).push(ref); }
  };
  const walk = (d: string, underTest: boolean) => {
    let ents: any[]; try { ents = fsMod.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
      const p = pathJoin(d, e.name);
      if (e.isDirectory()) walk(p, underTest);
      else if (ANY_CODE.test(e.name)) collect(p, underTest || IN_SCOPE_SRC.test(e.name)); // test/ = all; src/ = test/spec only
    }
  };
  walk(pathJoin(root, 'test'), true);
  walk(pathJoin(root, 'src'), false);
  const buckets = analyzeTestMarkers(fileSrcs, inScope);
  return { ...buckets, outsideScope, markerTotal: inScope.length + outsideScope.length, fileCount: fileSrcs.size };
}
