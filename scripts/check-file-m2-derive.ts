/**
 * Sprint 41 T41.6 inc-1 — TsToModel.deriveClassM2 derives the CLEAN File M2 element set from the TS source with the
 * clean-class shape: EVERY derived ModelElement carries a NON-NULL ownerIor (owner-never-null), and the real elements
 * are present (File+Ior classes, FileModel interface, and members incl. File.ownIor / FileModel.uuid / Ior.for) — NOT
 * the 0-member/null-owner lowercase stub. The derivation ENUMERATES from TS (flat ModelElement units per class/member),
 * so File's fields live on the FileModel interface (File is `model`+methods) — structurally accurate, not a gap.
 * Reuses generate() (no fork); file-unit.ts UNTOUCHED. stub-must-fail: deriveClassM2 w/o ownerIor → throws; a null-owner
 * derived unit or a missing element → RED.
 */
import { TsToModel } from '../src/ts/scenario/TsToModel.js';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const OWNER = 'ior:instance:tron-root-owner'; // gate tests the MECHANISM (owner stamped non-null); the real caller supplies Tron's ior
const t = new TsToModel(ROOT);

// owner-never-null enforced
let threw = false; try { (t as unknown as { deriveClassM2: (f: string[], o: object) => unknown }).deriveClassM2(['src/ts/scenario/file.ts'], { write: false }); } catch { threw = true; }
if (!threw) fail('deriveClassM2 without ownerIor did NOT throw — clean-class shape requires owner-never-null.');

const { units } = t.deriveClassM2([`${ROOT}/src/ts/scenario/file.ts`, `${ROOT}/src/ts/scenario/ior.ts`], { ownerIor: OWNER, write: false });
const has = (kind: string, name: string) => units.some(u => (u.model as { kind?: string; name?: string }).kind === kind && (u.model as { name?: string }).name === name);

// the CLEAN-CLASS SHAPE core: every derived ModelElement is owner-stamped (NOT the null-owner stub)
const nullOwner = units.filter(u => !u.ownerIor);
if (nullOwner.length) fail(`${nullOwner.length} derived unit(s) have a NULL owner (e.g. ${(nullOwner[0].model as {name?:string}).name}) — clean-class shape = owner-never-null on EVERY element.`);
if (!units.every(u => u.ior === 'ior:class:ModelElement')) fail('every derived M2 unit must be an ior:class:ModelElement.');

// the real element set (enumerated from TS — File is a class with methods; its fields are on FileModel)
if (!has('class', 'File')) fail('no UmlClass File derived (M1).');
if (!has('class', 'Ior')) fail('no collaborator UmlClass Ior derived.');
if (!has('interface', 'FileModel')) fail('no FileModel interface derived (File\'s fields live here — File is `model`+methods).');
for (const m of ['ownIor', 'renderSelf', 'moveTo', 'displayName', 'iconToken']) if (!has('method', m)) fail(`File method '${m}' not derived.`);
for (const a of ['uuid', 'origin', 'name', 'mimeType']) if (!has('attribute', a)) fail(`FileModel attribute '${a}' not derived.`);
for (const m of ['for', 'toString']) if (!has('method', m)) fail(`Ior method '${m}' not derived.`);

console.log(`✓ Sprint 41 T41.6 inc-1: deriveClassM2 derives the File M2 element set (${units.length} units: File+Ior classes, FileModel interface, methods+attributes) — EVERY unit owner-stamped (owner-never-null), no null-owner stub.`);
