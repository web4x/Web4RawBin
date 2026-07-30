// R32.4 diagram-view PURE core (DOM-free → unit-testable in node/tsx; the R32.1/R32.2 pure-core pattern).
// Builds UML class-box SVG from Layer-2 view-links + resolved element nodes. NO DOM/fetch here — rb-diagram-detail.ts
// (the custom element) does the fetch + mount + pan/zoom + click; this module is the render logic it calls.

export interface ViewLink { unit: string; x: number; y: number; w?: number; h?: number; viewKind?: string; }
export interface DiagramNode { name: string; kind: string; attrs: string[]; methods: string[]; }

export const stripRef = (r: string): string => String(r || '').replace(/^ior:instance:/, '').replace(/^modelelement:/, '');
export const esc = (s: string): string => String(s).replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'));

export const BOX_W = 180, HEAD_H = 26, ROW_H = 18, PAD = 8;

// One UML class box (SVG <g>) at the view-link's x,y. Compartments: name (+«interface» stereotype), attributes,
// methods; height derives from row counts. data-ref carries the SELECT target for box-click → node detail.
export function buildBox(view: ViewLink, node: DiagramNode): string {
  const w = view.w || BOX_W;
  const attrH = node.attrs.length * ROW_H, methH = node.methods.length * ROW_H;
  const h = HEAD_H + (attrH || ROW_H) + (methH || ROW_H);
  const stereo = node.kind === 'interface' ? '«interface» ' : '';
  const rows = (items: string[], y0: number): string => items.map((t, i) =>
    `<text x="6" y="${y0 + i * ROW_H + 13}" class="dm-row">${esc(t)}</text>`).join('');
  const y1 = HEAD_H, y2 = HEAD_H + (attrH || ROW_H);
  return `<g class="dm-box" data-ref="modelelement:${stripRef(view.unit)}" transform="translate(${view.x},${view.y})" tabindex="0">`
    + `<rect class="dm-box-bg" width="${w}" height="${h}" rx="4"/>`
    + `<text x="${w / 2}" y="17" text-anchor="middle" class="dm-name">${stereo}${esc(node.name)}</text>`
    + `<line x1="0" y1="${y1}" x2="${w}" y2="${y1}" class="dm-sep"/>${rows(node.attrs, y1)}`
    + `<line x1="0" y1="${y2}" x2="${w}" y2="${y2}" class="dm-sep"/>${rows(node.methods.map((m) => m + '()'), y2)}`
    + `</g>`;
}

// [impl:uuid:ba96a744-13f9-42ea-b1cf-746e87481a18] DiagramViewModel.buildDiagramSvg (Method 3fc6ed5b, Class 09730090, off UC 6a155572)
// Assemble the surface SVG from the ordered view-links + a resolver. Returns svg + box count. Member sub-views
// render inside their class; relationship views = R32.6 (both skipped here). Unresolved units skipped.
export function buildDiagramSvg(views: ViewLink[], nodeOf: (uuid: string) => DiagramNode | null): { svg: string; count: number } {
  const boxes: string[] = []; let maxX = 0, maxY = 0;
  for (const v of views) {
    if (v.viewKind && v.viewKind !== 'class' && v.viewKind !== 'interface') continue;
    const node = nodeOf(stripRef(v.unit));
    if (!node) continue;
    boxes.push(buildBox(v, node));
    maxX = Math.max(maxX, v.x + (v.w || BOX_W) + PAD);
    maxY = Math.max(maxY, v.y + HEAD_H + (node.attrs.length + node.methods.length) * ROW_H + PAD + ROW_H);
  }
  const vb = `0 0 ${Math.max(maxX, 100)} ${Math.max(maxY, 100)}`;
  return { svg: `<svg class="dm-svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${boxes.join('')}</svg>`, count: boxes.length };
}
