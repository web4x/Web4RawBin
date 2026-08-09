// R32.4 gate (tsx; vitest mirror for tester/CI). SVG diagram SURFACE+NODES render logic (pure diagram-view-model)
// + additive drawer registration. DOM/pan-zoom/click/resize = tester playwright (element wraps the pure core).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDiagramSvg } from '../../src/public/ts/trace/diagram-view-model.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Layer-2 view-links: 2 renderable (class + interface) + 1 relationship (R32.6 → excluded here).
const views = [
  { unit: 'modelelement:AAA', x: 20, y: 30, viewKind: 'class' },
  { unit: 'modelelement:BBB', x: 200, y: 60, viewKind: 'interface' },
  { unit: 'modelelement:CCC', x: 0, y: 0, viewKind: 'relationship' },
];
const nodes: Record<string, { name: string; kind: string; attrs: string[]; methods: string[] }> = {
  AAA: { name: 'Circle', kind: 'class', attrs: ['center', '_r'], methods: ['area'] },
  BBB: { name: 'Shape', kind: 'interface', attrs: [], methods: ['area'] },
};
const { svg, count } = buildDiagramSvg(views, (u) => nodes[u] || null);

// AC-2 nodes from view-links; AC-7 edges excluded (relationship skipped)
assert.equal(count, 2, `relationship view excluded (R32.6) → 2 boxes (got ${count})`);
// AC-3 box at the view-LINK x,y (position on link, unit untouched — R25.7)
assert.ok(svg.includes('translate(20,30)') && svg.includes('translate(200,60)'), 'boxes at view-link x,y');
// AC-2 compartments from members (name / attributes / methods) + interface stereotype + M-kind
assert.ok(svg.includes('>Circle<'), 'Circle name compartment');
assert.ok(svg.includes('«interface» Shape'), 'interface stereotype (kind)');
assert.ok(svg.includes('>center<') && svg.includes('>_r<'), 'attribute compartment from members');
assert.ok(svg.includes('>area()<'), 'method compartment (name())');
// AC-6 box carries the SELECT ref (click → node detail via selectionModel)
assert.ok(svg.includes('data-ref="modelelement:AAA"'), 'box carries modelelement select ref');
// viewBox computed from extents
assert.ok(/viewBox="0 0 \d+ \d+"/.test(svg), 'viewBox computed');
// unresolved view-link skipped (safe build-ahead — 0 views → empty)
assert.equal(buildDiagramSvg([{ unit: 'modelelement:ZZZ', x: 0, y: 0, viewKind: 'class' }], () => null).count, 0, 'unresolved unit skipped');
assert.equal(buildDiagramSvg([], () => null).count, 0, '0 views → empty surface (build-ahead, R32.5 populates)');

// AC-1 surface = drawer detail-view (additive tagMap + self-import, NO fork); AC-8 existing entries intact
const drawer = fs.readFileSync(path.join(ROOT, 'src/public/ts/trace/rb-detail-drawer.ts'), 'utf-8');
assert.ok(drawer.includes("diagram: 'rb-diagram-detail'"), 'tagMap has diagram → rb-diagram-detail');
assert.ok(drawer.includes("import './rb-diagram-detail.js'"), 'drawer self-imports rb-diagram-detail (registration)');
assert.ok(drawer.includes("class: 'rb-class-detail'") && drawer.includes("usecase: 'rb-usecase-detail'") && drawer.includes("file: 'rb-file-detail'"), 'existing tagMap entries intact (additive — shared-drawer unregressed, AC-8)');

console.log('[r32.4-gate] GREEN — view-links→UML boxes✓ compartments(name/attr/method)✓ M-kind/stereotype✓ x,y-on-link✓ edges-excluded✓ box select-ref✓ viewBox✓ empty-safe✓ additive tagMap+import (no fork)✓');
