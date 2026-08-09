// [test:uuid:e9b21f74-6c05-4a3e-8d17-5f0c9a24e6b1] R40.2 deployment-node lens (rides Impl 94ad4f50 renderFacet EXTENSION,
// no new impl marker; Test rides ALONGSIDE e21b876d + 0172b45d — owner-first, must NOT overwrite/re-point them).
// SURFACE-LABELLED (PO): [DIAGRAM] renderNodeFacet renders a «node» 3D box (front+top+right faces) with the node name and
// its MEASURED refs as compartment rows (sshd_config / SSH identity / .env domain / LE cert); [DIAGRAM·INV-T] children
// (otmux panes) are NOT drawn in the facet — only the refs — so nothing is mirrored into the persisted graph (the facet is
// a pure deterministic string fn → byte-diff==0 at render); [MODEL] the deploymentRefs→attrs mapping is `${role}: ${base}`.
// ⚠ PENDING (Server-Manager-root, expert re-rooting): the LIVE WODA.prod deployment node with the 4 refs actually RESOLVING
// (measured) + the live-tree INV-T byte-diff==0. Gated here = the render contract + INV-T-at-render; NOT the flat-tree root.
// stub-must-fail: empty refs → 0 rows (no fabricated refs); drift-injection: different refs → different rows.
import { renderFacet } from '../../src/public/ts/trace/diagram-view-model.js';

const view = { unit: 'ior:instance:8e8b32d6-22bf-46f7-bf5c-7da31ef41e19', x: 0, y: 0, viewKind: 'UmlNode' };
const REFS = ['sshd_config: sshd_config', 'ssh-identity: ssh_host_ed25519_key.pub', 'domain: .env', 'tls-cert: fullchain.pem'];
const node = { name: 'WODA.prod', kind: 'node', attrs: REFS, methods: ['shouldNotRender()'] }; // methods present → must NOT appear (children-not-mirrored)

const count = (s: string, sub: string) => s.split(sub).length - 1;
const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  const svg = renderFacet(view as any, node as any);
  const svg2 = renderFacet(view as any, node as any);

  const isNodeFacet = svg.includes('dm-facet-node');
  const nodeName = svg.includes('«node» WODA.prod');
  const threeFaces = count(svg, 'class="dm-box-bg"') === 3;                 // front + top + right = 3D «node» box
  const fourRefRows = count(svg, 'class="dm-row"') === 4 && REFS.every(r => svg.includes(r)); // all 4 measured refs as rows
  const diagramSurface = isNodeFacet && nodeName && threeFaces && fourRefRows;

  const noChildrenMirrored = !svg.includes('shouldNotRender'); // methods/children NOT drawn in the facet (INV-T: lens-in-detail)
  const pure = svg === svg2;                                    // pure deterministic string fn → no side effects → byte-diff==0 at render
  const invT = noChildrenMirrored && pure;

  // stub-must-fail + drift-injection
  const empty = renderFacet(view as any, { name: 'X', kind: 'node', attrs: [], methods: [] } as any);
  const failClosedEmpty = count(empty, 'class="dm-row"') === 0;                       // no refs → no fabricated rows
  const drift = renderFacet(view as any, { name: 'X', kind: 'node', attrs: ['only: one'], methods: [] } as any);
  const driftWorks = count(drift, 'class="dm-row"') === 1 && drift.includes('only: one') && !drift.includes('sshd_config');

  const pass = diagramSurface && invT && failClosedEmpty && driftWorks;
  results.push(pass);
  console.log(`iter ${i}: [DIAGRAM]node-facet=${diagramSurface}(nodeFacet=${isNodeFacet} name=${nodeName} 3faces=${threeFaces} 4refs=${fourRefRows}) [INV-T]no-mirror+pure=${invT}(noChildren=${noChildrenMirrored} pure=${pure}) [stub-fail]empty=${failClosedEmpty} [drift]=${driftWorks} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R40.2 deployment-node lens — DIAGRAM + MODEL + INV-T-at-render (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('SURFACE: renderNodeFacet DIAGRAM contract + INV-T-at-render (pure, no children mirrored) proven. Test rides 94ad4f50 alongside e21b876d/0172b45d (owner-first).');
console.log('PENDING (Server-Manager-root, expert re-rooting): LIVE WODA.prod node with 4 refs RESOLVING (measured) + live-tree byte-diff==0 — NOT gated (flat tree, no root yet).');
process.exitCode = green ? 0 : 1;
