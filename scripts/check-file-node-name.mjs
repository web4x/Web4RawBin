/**
 * Sprint 41 (v0.8.238) — File nodes resolve their display name as name||title in BOTH sibling branches of rb-object-item
 * (the SAME root the v0.8.236 regression exposed): moved files carry the name via the TITLE attribute (name is null).
 *   • RENDER branch (:239): new File({ name: getAttribute('name') || getAttribute('title') || ... })
 *   • DRAG federated-ref (:173): buildFederatedRef({ name: getAttribute('name') || getAttribute('title') || uuid })
 * A name-ONLY read in EITHER branch = a moved file renders/drags as uuid = regression. This gate fails-loud on it.
 * stub-must-fail: revert either branch to getAttribute('name')-only → this gate exits 1 (RED).
 */
import { readFileSync } from 'node:fs';

const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
const src = readFileSync('src/public/ts/trace/rb-object-item.ts', 'utf8');

// the two File-name resolution sites — each MUST read name then fall back to title (order-sensitive)
const nameTitle = /getAttribute\('name'\)\s*\|\|\s*this\.getAttribute\('title'\)/;

const renderLine = src.split('\n').find((l) => /new File\(\{/.test(l) && /renderSelf\(\)/.test(l));
if (!renderLine) fail('render branch: no `new File({...}).renderSelf()` line found (structure changed — re-verify).');
if (!nameTitle.test(renderLine)) fail('RENDER branch reads name-ONLY — a moved File (name via title) renders uuid. Must be getAttribute(name)||getAttribute(title).');

const dragLine = src.split('\n').find((l) => /buildFederatedRef\(\{/.test(l));
if (!dragLine) fail('drag branch: no `buildFederatedRef({...})` line found (structure changed — re-verify).');
if (!nameTitle.test(dragLine)) fail('DRAG federated-ref reads name-ONLY — a moved File dragged cross-origin carries uuid/empty name into the import. Must be getAttribute(name)||getAttribute(title).');

console.log('✓ Sprint 41 file-node name: BOTH render (:239) + drag federated-ref (:173) resolve name||title (moved files keep their name in render AND cross-origin drag).');
