// R32.6 gate (tsx runner — pure core; the component's RbPanZoom/live-faa4acad + visual = tester/Tron @390).
// Mirrors the R32.5 demo (Circle class, Point class, Shape interface) + an OFF-diagram target to prove no
// dangling edge. Asserts: relatesTo→edges (both endpoints on-diagram), arrowhead by M2 kind, edges BEHIND boxes
// in the same <svg>, de-dup idempotent, R32.4 boxes unregressed, edge-click data present.
import assert from 'node:assert/strict';
import { buildDiagramSvg, buildEdges, type ViewLink, type DiagramNode } from '../../src/public/ts/trace/diagram-view-model.js';

const SHAPE = 'aaaaaaaa-0000-4000-8000-000000000001';
const POINT = 'aaaaaaaa-0000-4000-8000-000000000002';
const CIRCLE = 'aaaaaaaa-0000-4000-8000-000000000003';
const OFFDIAGRAM = 'aaaaaaaa-0000-4000-8000-0000000000ff';

const views: ViewLink[] = [
  { unit: CIRCLE, x: 40, y: 200, viewKind: 'class' },
  { unit: POINT, x: 320, y: 40, viewKind: 'class' },
  { unit: SHAPE, x: 320, y: 320, viewKind: 'interface' },
];
const nodes: Record<string, DiagramNode> = {
  [CIRCLE]: { name: 'Circle', kind: 'class', attrs: ['center', '_r'], methods: ['area'], relations: [
    { to: SHAPE, kind: 'generalization' },   // implements Shape
    { to: POINT, kind: 'association' },       // typed attribute center: Point
    { to: OFFDIAGRAM, kind: 'dependency' },   // off-diagram → NO dangling edge
    { to: SHAPE, kind: 'generalization' },    // DUPLICATE → de-dup
  ] },
  [POINT]: { name: 'Point', kind: 'class', attrs: ['x', 'y'], methods: [], relations: [] },
  [SHAPE]: { name: 'Shape', kind: 'interface', attrs: [], methods: ['area'], relations: [] },
};
const nodeOf = (u: string): DiagramNode | null => nodes[u] || null;

// --- buildEdges pure ---
const e = buildEdges(views, nodeOf);
assert.equal(e.count, 2, `2 edges (Circle→Shape, Circle→Point); off-diagram + dup dropped (got ${e.count})`);
assert.ok(e.svg.includes(`data-rel-to="modelelement:${SHAPE}"`) && e.svg.includes('url(#dm-arrow-generalization)'), 'Circle→Shape generalization edge + hollow-triangle marker');
assert.ok(e.svg.includes(`data-rel-to="modelelement:${POINT}"`) && e.svg.includes('url(#dm-arrow-association)'), 'Circle→Point association edge + open-arrow marker');
assert.ok(!e.svg.includes(OFFDIAGRAM), 'off-diagram target → NO dangling edge');
assert.ok(e.svg.includes('data-rel-from') && e.svg.includes('data-rel-kind='), 'edge carries click data (from/to/kind)');

// --- buildDiagramSvg assembly ---
const { svg, count, edges } = buildDiagramSvg(views, nodeOf);
assert.equal(count, 3, `R32.4 UNREGRESSED — 3 boxes (got ${count})`);
assert.equal(edges, 2, `2 edges via buildDiagramSvg (got ${edges})`);
assert.ok(svg.includes('<defs>') && svg.includes('id="dm-arrow-generalization"'), 'ONE <defs> marker set present');
// edges BEHIND boxes: first .dm-edge occurs before first .dm-box
assert.ok(svg.indexOf('class="dm-edge') < svg.indexOf('class="dm-box"'), 'edges rendered BEHIND boxes (drawn first)');
// same <svg> group (RbPanZoom transforms together) — one svg, edges + boxes inside it
assert.equal((svg.match(/<svg/g) || []).length, 1, 'edges + boxes in ONE <svg> group');

// --- idempotent re-render (de-dup stable) ---
const again = buildDiagramSvg(views, nodeOf);
assert.equal(again.svg, svg, 'idempotent — re-render byte-identical (de-dup stable)');

console.log(`[r32.6-gate] GREEN — ${edges} edges (Circle→Shape=generalization, Circle→Point=association); off-diagram skipped ✓; dup de-duped ✓; markers by kind ✓; edges behind boxes in one svg ✓; ${count} boxes unregressed ✓; idempotent ✓`);
