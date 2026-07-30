// [test:uuid:9c419d83-ae85-4627-bf8b-5f4c1a036b2f] R32.6 relationship-edges — verifies buildEdges (the R32.6 edge pass, DISTINCT from R32.4 buildDiagramSvg ba96a744): edges from relations X→Y IFF both endpoints on-diagram (off-diagram/self = NO dangling), arrowhead BY M2 kind (Generalization hollow-triangle / Association+Dependency open), de-dup (from,to,kind) idempotent, edges in ONE svg BEHIND boxes; + R32.4 box no-regression. Own-oracle imports the REAL buildEdges/buildDiagramSvg/EDGE_DEFS + planted-defect bites (dangling-must-skip 3→4, dedup-must-collapse). → req IMPL-MINTs the R32.6 chain onto buildEdges (NOT ba96a744=R32.4) + wires this Test.
// R32.6 relationship-EDGES — INDEPENDENT own-oracle, CODE axis, DET-3x. Imports the REAL buildEdges + buildDiagramSvg
// + EDGE_DEFS (diagram-view-model.ts) and drives a synthetic on/off-diagram model. Measured DIFFERENTLY than the
// expert's tsx: own synthetic view-set + planted-defect bites (dangling-must-skip, dedup-must-collapse) + R32.4
// box no-regression. ACs: edges from relations X→Y IFF both on-diagram (off-diagram/self = NO dangling edge),
// arrowhead BY M2 kind (Generalization hollow-triangle / Association + Dependency open), de-dup (from,to,kind)
// idempotent, edges in ONE <svg> BEHIND the boxes. LIVE @390 edge render on the R32.5 demo diagram is a SEPARATE
// axis held for served==0.8.6 stability. → req IMPL-MINTs the R32.6 chain onto buildEdges; on ping I place the marker.
import { buildEdges, buildDiagramSvg, EDGE_DEFS, type ViewLink, type DiagramNode, type DiagramRelation } from '../../src/public/ts/trace/diagram-view-model.ts';

const FOO = '11111111-1111-4111-8111-111111111111';
const BASE = '22222222-2222-4222-8222-222222222222';
const BAZ = '33333333-3333-4333-8333-333333333333';
const GHOST = '99999999-9999-4999-8999-999999999999';
const ref = (u: string) => 'modelelement:' + u;
const rel = (to: string, kind: string): DiagramRelation => ({ to: ref(to), kind: kind as DiagramRelation['kind'] });

const meta: Record<string, { name: string; kind: string }> = {
  [FOO]: { name: 'Foo', kind: 'class' }, [BASE]: { name: 'Base', kind: 'class' }, [BAZ]: { name: 'Baz', kind: 'interface' }, [GHOST]: { name: 'Ghost', kind: 'class' },
};
const nodeOf = (rels: Record<string, DiagramRelation[]>) => (u: string): DiagramNode | null => {
  const m = meta[u]; if (!m) return null;
  return { name: m.name, kind: m.kind, attrs: ['x: number'], methods: ['go'], relations: rels[u] || [] };
};
const box = (u: string, x: number, y: number): ViewLink => ({ unit: ref(u), x, y, viewKind: meta[u].kind });

const VIEWS: ViewLink[] = [box(FOO, 20, 20), box(BASE, 260, 20), box(BAZ, 20, 240)];
// Foo→Base gen (×2 = dup), Foo→Baz assoc, Foo→Baz dep (diff kind, kept), Foo→Ghost assoc (off-diagram), Foo→Foo (self)
const RELS: Record<string, DiagramRelation[]> = {
  [FOO]: [rel(BASE, 'generalization'), rel(BASE, 'generalization'), rel(BAZ, 'association'), rel(BAZ, 'dependency'), rel(GHOST, 'association'), rel(FOO, 'association')],
};
const cnt = (s: string, sub: string) => s.split(sub).length - 1;

function runOnce() {
  const e = buildEdges(VIEWS, nodeOf(RELS));
  const e2 = buildEdges(VIEWS, nodeOf(RELS));                                  // idempotency: re-render identical
  const full = buildDiagramSvg(VIEWS, nodeOf(RELS));

  const onDiagramOnly = e.count === 3                                          // gen + assoc + dep; dup+ghost+self excluded
    && !e.svg.includes(GHOST)                                                  // no dangling edge to off-diagram target
    && !e.svg.includes(`data-rel-from="${ref(FOO)}" data-rel-to="${ref(FOO)}"`); // no self edge
  const arrowByKind = e.svg.includes('marker-end="url(#dm-arrow-generalization)"')
    && e.svg.includes('marker-end="url(#dm-arrow-association)"')
    && e.svg.includes('marker-end="url(#dm-arrow-dependency)"')
    && e.svg.includes('data-rel-kind="generalization"') && e.svg.includes('data-rel-kind="dependency"');
  const dedup = cnt(e.svg, 'dm-edge-generalization') === 1;                    // the 2 Foo→Base gen collapsed to ONE
  const idempotent = e.svg === e2.svg && e.count === e2.count;
  const defsByKind = /dm-arrow-generalization[\s\S]*dm-arrow-hollow/.test(EDGE_DEFS) && /dm-arrow-association[\s\S]*dm-arrow-open/.test(EDGE_DEFS);
  const behindBoxes = full.svg.indexOf('<line class="dm-edge') < full.svg.indexOf('<g class="dm-box"')
    && cnt(full.svg, '<svg') === 1 && full.edges === 3;                         // edges drawn before boxes, one svg
  const r324NoRegress = full.count === 3 && full.svg.includes('Foo') && full.svg.includes('Baz') && full.svg.includes('«interface» Baz');

  // ── PLANTED-DEFECT BITES (anti-green-wash: the checks MOVE with reality) ──
  // dangling bite: adding Ghost to the diagram makes the previously-skipped edge APPEAR (3→4) → on-diagram gate is real
  const withGhost = buildEdges([...VIEWS, box(GHOST, 260, 240)], nodeOf(RELS));
  const biteDangling = e.count === 3 && withGhost.count === 4;
  // dedup bite: SAME (from,to) DIFFERENT kind = 2 edges (kept); SAME triple = 1 (collapsed) → dedup is by the full triple
  const twoKinds = buildEdges([box(FOO, 0, 0), box(BASE, 200, 0)], nodeOf({ [FOO]: [rel(BASE, 'generalization'), rel(BASE, 'association')] }));
  const oneKindDup = buildEdges([box(FOO, 0, 0), box(BASE, 200, 0)], nodeOf({ [FOO]: [rel(BASE, 'generalization'), rel(BASE, 'generalization')] }));
  const biteDedup = twoKinds.count === 2 && oneKindDup.count === 1;

  return { onDiagramOnly, arrowByKind, dedup, idempotent, defsByKind, behindBoxes, r324NoRegress, biteDangling, biteDedup, edgeCount: e.count };
}

const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  const o = runOnce();
  const pass = o.onDiagramOnly && o.arrowByKind && o.dedup && o.idempotent && o.defsByKind && o.behindBoxes && o.r324NoRegress && o.biteDangling && o.biteDedup;
  results.push(pass);
  console.log(`iter ${i}: onDiagramOnly=${o.onDiagramOnly}(${o.edgeCount}) arrowByKind=${o.arrowByKind} dedup=${o.dedup} idempotent=${o.idempotent} defsByKind=${o.defsByKind} behindBoxes=${o.behindBoxes} r324NoRegress=${o.r324NoRegress} | BITES dangling=${o.biteDangling} dedup=${o.biteDedup} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R32.6 relationship-edges own-oracle (CODE axis, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('HELD for served==0.8.6 stable: LIVE @390 edge render on the R32.5 demo diagram (faa4acad) — Tron device sign-off for the visual.');
process.exitCode = green ? 0 : 1;
