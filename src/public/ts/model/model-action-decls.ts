// R40.37 — the model view's action DECLARATIONS in a PURE, browser-dep-free module (no rb-trace-tree/rb-detail-drawer
// side-effect imports) so a node gate can import the REAL decls, not a representative copy (same 'test the code not a
// replica' split as inc-1's universal-actions → action-applicability). model.ts imports MODEL_DECLS from here.
import type { ActionDecl } from '../trace/action-applicability.js';

// AC3: container actions never on leaf item types. AC4 (INTERIM): add-diagram off leaves — PRECISE 'only the diagrams
// container BY KIND' is inc-3 (the container is a synthetic mofFolder ref; the drawer synthetic-ref key/kind path needs
// alignment first — likely a SHARED ROOT with Tron's A3 '/model detail shows nothing'). R33.9 membership → when:hasActiveDiagram.
export const MODEL_DECLS: ActionDecl[] = [
  { verb: 'add-folder', label: '📁 Add folder', appliesTo: { notTypes: ['task', 'file', 'webitem', 'member', 'user', 'puml', 'pumlartifact'] } },
  { verb: 'import-puml', label: '⇩ Import PUML', appliesTo: { notTypes: ['task', 'file', 'webitem', 'member', 'user'] } },
  { verb: 'add-diagram', label: '＋ Add Diagram', appliesTo: { kinds: ['diagrams'] } }, // inc-3 AC4: PRECISE — offered ONLY on the diagrams container BY KIND (ensureViewUnit sets kind='diagrams' on rawbin:diagram; resolveRefUnit feeds it to the bar). Was notTypes:[…] (INTERIM, leaked onto every non-leaf).
  { verb: 're-sync', label: '⟳ Re-Sync', appliesTo: { types: ['diagram'] } },
  { verb: 'compile-puml', label: '⚙ Compile → SVG', appliesTo: { types: ['diagram'] } },
  { verb: 'new-element', label: '✚ New class', appliesTo: { types: ['modelelement'] } },
  { verb: 'rename-element', label: '✎ Rename', appliesTo: { types: ['modelelement'] } },
  { verb: 'delete-element', label: '🗑 Delete class', appliesTo: { types: ['modelelement'] } },
  { verb: 'add-to-diagram', label: '＋ Add to diagram', appliesTo: { types: ['modelelement'], when: (ctx) => !!ctx.hasActiveDiagram } },
  { verb: 'discover', label: '⌗ Discover related', appliesTo: { types: ['modelelement'], when: (ctx) => !!ctx.hasActiveDiagram } },
  { verb: 'remove-from-diagram', label: '✕ Remove from diagram', appliesTo: { types: ['modelelement'], when: (ctx) => !!ctx.hasActiveDiagram } },
];
