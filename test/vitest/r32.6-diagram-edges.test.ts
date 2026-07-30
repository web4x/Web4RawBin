// R32.6 gate (vitest — pure diagram-view-model core; component RbPanZoom/live-faa4acad + visual = tester/Tron @390).
// relatesTo→edges (both endpoints on-diagram), arrowhead by M2 kind, edges behind boxes in one svg, de-dup
// idempotent, R32.4 boxes unregressed, edge-click data present.
import { describe, it, expect } from 'vitest';
import { buildDiagramSvg, buildEdges, type ViewLink, type DiagramNode } from '../../src/public/ts/trace/diagram-view-model.js';

const SHAPE = 'aaaaaaaa-0000-4000-8000-000000000001';
const POINT = 'aaaaaaaa-0000-4000-8000-000000000002';
const CIRCLE = 'aaaaaaaa-0000-4000-8000-000000000003';
const OFF = 'aaaaaaaa-0000-4000-8000-0000000000ff';

const views: ViewLink[] = [
  { unit: CIRCLE, x: 40, y: 200, viewKind: 'class' },
  { unit: POINT, x: 320, y: 40, viewKind: 'class' },
  { unit: SHAPE, x: 320, y: 320, viewKind: 'interface' },
];
const nodes: Record<string, DiagramNode> = {
  [CIRCLE]: { name: 'Circle', kind: 'class', attrs: ['center', '_r'], methods: ['area'], relations: [
    { to: SHAPE, kind: 'generalization' }, { to: POINT, kind: 'association' },
    { to: OFF, kind: 'dependency' }, { to: SHAPE, kind: 'generalization' } ] },
  [POINT]: { name: 'Point', kind: 'class', attrs: ['x', 'y'], methods: [], relations: [] },
  [SHAPE]: { name: 'Shape', kind: 'interface', attrs: [], methods: ['area'], relations: [] },
};
const nodeOf = (u: string): DiagramNode | null => nodes[u] || null;

describe('R32.6 relationship edges', () => {
  it('edges only between on-diagram boxes; off-diagram + dup dropped', () => {
    const e = buildEdges(views, nodeOf);
    expect(e.count).toBe(2);
    expect(e.svg).not.toContain(OFF);
  });
  it('arrowhead marker by M2 kind', () => {
    const { svg } = buildDiagramSvg(views, nodeOf);
    expect(svg).toContain('url(#dm-arrow-generalization)');
    expect(svg).toContain('url(#dm-arrow-association)');
    expect(svg).toContain('id="dm-arrow-generalization"'); // one <defs> set
  });
  it('edges behind boxes, in ONE svg group (RbPanZoom-transformed together)', () => {
    const { svg, count, edges } = buildDiagramSvg(views, nodeOf);
    expect(count).toBe(3); // R32.4 unregressed
    expect(edges).toBe(2);
    expect(svg.indexOf('class="dm-edge')).toBeLessThan(svg.indexOf('class="dm-box"'));
    expect((svg.match(/<svg/g) || []).length).toBe(1);
  });
  it('edge carries click data (from/to/kind)', () => {
    const { svg } = buildDiagramSvg(views, nodeOf);
    expect(svg).toContain(`data-rel-to="modelelement:${SHAPE}"`);
    expect(svg).toMatch(/data-rel-from=.*data-rel-kind=/);
  });
  it('idempotent — re-render byte-identical', () => {
    expect(buildDiagramSvg(views, nodeOf).svg).toBe(buildDiagramSvg(views, nodeOf).svg);
  });
});
