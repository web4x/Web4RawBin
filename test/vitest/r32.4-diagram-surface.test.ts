// R32.4 gate (vitest — tester/CI; expert measured via tsx). SVG diagram surface render logic (pure
// diagram-view-model) + additive drawer registration. DOM/pan-zoom/click/resize = tester playwright.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { buildDiagramSvg } from '../../src/public/ts/trace/diagram-view-model.js';

const ROOT = path.resolve(__dirname, '..', '..');
const nodes: Record<string, { name: string; kind: string; attrs: string[]; methods: string[] }> = {
  AAA: { name: 'Circle', kind: 'class', attrs: ['center', '_r'], methods: ['area'] },
  BBB: { name: 'Shape', kind: 'interface', attrs: [], methods: ['area'] },
};
const views = [
  { unit: 'modelelement:AAA', x: 20, y: 30, viewKind: 'class' },
  { unit: 'modelelement:BBB', x: 200, y: 60, viewKind: 'interface' },
  { unit: 'modelelement:CCC', x: 0, y: 0, viewKind: 'relationship' },
];

describe('R32.4 SVG diagram surface + nodes', () => {
  const { svg, count } = buildDiagramSvg(views, (u) => nodes[u] || null);
  it('AC-2/7: view-links → UML boxes, relationship (edge) excluded (R32.6)', () => {
    expect(count).toBe(2);
    expect(svg).toContain('>Circle<');
    expect(svg).toContain('«interface» Shape');
  });
  it('AC-2: compartments (name/attributes/methods) from members', () => {
    expect(svg).toContain('>center<');
    expect(svg).toContain('>_r<');
    expect(svg).toContain('>area()<');
  });
  it('AC-3: box positioned by x,y on the view-LINK (unit untouched, R25.7)', () => {
    expect(svg).toContain('translate(20,30)');
    expect(svg).toContain('translate(200,60)');
    expect(svg).toMatch(/viewBox="0 0 \d+ \d+"/);
  });
  it('AC-6: box carries the modelelement select-ref (click → node detail)', () => {
    expect(svg).toContain('data-ref="modelelement:AAA"');
  });
  it('build-ahead safe: 0 / unresolved views → empty surface', () => {
    expect(buildDiagramSvg([], () => null).count).toBe(0);
    expect(buildDiagramSvg([{ unit: 'modelelement:ZZZ', x: 0, y: 0, viewKind: 'class' }], () => null).count).toBe(0);
  });
  it('AC-1/8: surface = drawer detail-view via ADDITIVE tagMap + self-import (no fork); existing entries intact', () => {
    const drawer = fs.readFileSync(path.join(ROOT, 'src/public/ts/trace/rb-detail-drawer.ts'), 'utf-8');
    expect(drawer).toContain("diagram: 'rb-diagram-detail'");
    expect(drawer).toContain("import './rb-diagram-detail.js'");
    expect(drawer).toContain("class: 'rb-class-detail'");
    expect(drawer).toContain("file: 'rb-file-detail'");
  });
});
