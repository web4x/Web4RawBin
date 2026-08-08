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
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && isTestCall(n)) {
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
 * The 3-bucket classifier (INV-T4), fail-closed toward the lower-credit bucket:
 *  PROVEN_COMPLETE  — AST-attached to a name-matched block (credit STANDS)
 *  UNPROVEN         — not attached, but the file has ≥ as many blocks as markers (backable in principle → credit SUSPENDED)
 *  PROVEN_FICTIONAL — not attached AND the file has MORE markers than blocks (pigeonhole: some can't back anything → credit DENIED)
 */
export function classifyTestMarker(opts: { markerOffset: number; blocks: TestBlock[]; unitName: string; fileMarkerCount: number; fileBlockCount: number }): TestBucket {
  if (isTestMarkerAttached(opts.markerOffset, opts.blocks, opts.unitName)) return 'PROVEN_COMPLETE';
  return opts.fileMarkerCount > opts.fileBlockCount ? 'PROVEN_FICTIONAL' : 'UNPROVEN';
}

export interface TestMarkerRef { uuid: string; file: string; offset: number; unitName: string }
export interface TestMarkerBuckets { complete: TestMarkerRef[]; unproven: TestMarkerRef[]; fictional: TestMarkerRef[] }

/** Single-source analyzer both trace-audit and the tester baseline import → identical per-bucket counts by construction. */
export function analyzeTestMarkers(fileSrcs: Map<string, string>, markers: TestMarkerRef[]): TestMarkerBuckets {
  const blocksByFile = new Map<string, TestBlock[]>();
  const markerCountByFile = new Map<string, number>();
  for (const m of markers) markerCountByFile.set(m.file, (markerCountByFile.get(m.file) || 0) + 1);
  const getBlocks = (f: string): TestBlock[] => { if (!blocksByFile.has(f)) blocksByFile.set(f, collectTestBlocks(fileSrcs.get(f) || '', f)); return blocksByFile.get(f)!; };
  const out: TestMarkerBuckets = { complete: [], unproven: [], fictional: [] };
  for (const m of markers) {
    const blocks = getBlocks(m.file);
    const bucket = classifyTestMarker({ markerOffset: m.offset, blocks, unitName: m.unitName, fileMarkerCount: markerCountByFile.get(m.file) || 0, fileBlockCount: blocks.length });
    (bucket === 'PROVEN_COMPLETE' ? out.complete : bucket === 'UNPROVEN' ? out.unproven : out.fictional).push(m);
  }
  return out;
}
