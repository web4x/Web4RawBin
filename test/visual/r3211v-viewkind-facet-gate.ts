/**
 * [test:uuid:READY-ON-GREEN] BUG-B2 (Tron-caught by ASKING, not testing) — add-view must store + render the view with
 * the DROPPED ELEMENT'S OWN TYPE, not a hardcoded 'class'. server.ts:2093 pushes viewKind:'class' for EVERY drop, so a
 * UseCase is persisted (and can render) as a class box, not its R36.1 ellipse. My strip gate asserted the drop SUCCEEDED
 * (200) — this asserts the RESULT IS RIGHT. Run: /opt/node22/bin/node --import tsx test/visual/r3211v-viewkind-facet-gate.ts
 * RED until the server derives viewKind from the unit type + reuses renderFacet's routing (one type-map, diagram==detail).
 */
import fs from 'node:fs';
import { renderFacet } from '../../src/public/ts/trace/diagram-view-model.js';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const node = (kind: string) => ({ uuid: 'u', name: 'N', kind, attrs: [], methods: [], refs: [], signature: '' } as any);
const isEllipse = (svg: string) => /<ellipse|dm-facet-usecase/.test(svg);       // R36.1 UseCase facet = ellipse (NOT 'rx=' — a rounded class rect has that too)
const isBox = (svg: string) => /<rect|dm-box/.test(svg) && !isEllipse(svg);

const results: [string, boolean][] = [];

// (1) OWN-ORACLE renderFacet type-routing — the ONE shared lens must render each type as its facet (both directions)
results.push(['renderFacet usecase→ellipse', isEllipse(renderFacet({ unit: 'u', x: 0, y: 0 } as any, node('usecase')))]);
results.push(['renderFacet class→box', isBox(renderFacet({ unit: 'u', x: 0, y: 0 } as any, node('class')))]);

// (2) ★ THE BUG (measured, not assumed): a view the SERVER persisted as viewKind:'class' over a UseCase node — does it
//     still render as the UseCase facet? renderFacet:71 falls back to node.kind, so IF node.kind survives it is robust.
const persistedAsClassOverUseCase = renderFacet({ unit: 'u', x: 0, y: 0, viewKind: 'class' } as any, node('usecase'));
results.push(['UseCase persisted viewKind=class still renders ELLIPSE (node.kind survives)', isEllipse(persistedAsClassOverUseCase)]);

// (3) SOURCE-AUDIT — the views.push in add-view must DERIVE viewKind from the element type, NOT hardcode 'class'.
// Target the ACTUAL views.push (not the first 'viewKind:' token, which matched a comment/interface = my false-pass bug).
const srv = fs.readFileSync(`${REPO}/src/ts/server/server.ts`, 'utf8');
const pushLine = (srv.match(/views\.push\(\{[^}]*\}\)/) || [''])[0];
results.push(['add-view views.push viewKind DERIVED-not-hardcoded-class', pushLine.length > 0 && !/viewKind:\s*['"]class['"]/.test(pushLine)]);

// (5) AGREEMENT — diagram + detail use the SAME renderFacet routing (no second type-map that can drift)
const detail = fs.existsSync(`${REPO}/src/public/ts/trace/rb-modelelement-detail.ts`) ? fs.readFileSync(`${REPO}/src/public/ts/trace/rb-modelelement-detail.ts`, 'utf8') : '';
results.push(['diagram+detail agree (detail reuses renderFacet/kind, no rival map)', /renderFacet|\.kind\b/.test(detail)]);

for (const [n, ok] of results) console.log(`  ${ok ? '✓' : '✗'} ${n}`);
const green = results.every(([, ok]) => ok);
console.log('\n===== BUG-B2: add-view viewKind matches the dropped element TYPE (facet-correct, DET) =====');
console.log('OVERALL:', green ? 'GREEN — a dropped UseCase is stored+rendered as its own type, not class'
  : 'RED — assert-the-RESULT-is-right: a UseCase drop stores/renders as class, not its UseCase facet (server hardcodes viewKind:class)');
process.exitCode = green ? 0 : 1;
