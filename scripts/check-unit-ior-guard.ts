/**
 * Sprint 41 GUARD #2 gate — the fully-qualified IOR is composed BY THE CLASS, with an origin, BY CONSTRUCTION.
 * composeUnitIor(className, uuid, origin) = ior:class:<Class>:rest:<origin>/scenario/<uuid>; an EMPTY origin THROWS
 * (a bare local ref is cross-server-unresolvable — the Sprint 26 federation property). Enforce, do NOT document.
 * stub-must-fail: remove the empty-origin throw → the guard#2 assertion stops throwing → this gate exits 1 (RED).
 */
import { composeUnitIor } from '../src/ts/scenario/file-unit.js';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const throws = (fn: () => void): boolean => { try { fn(); return false; } catch { return true; } };
const ORIGIN = 'https://prod.wo-da.de:4444';
const U = '13782f0c-28ab-460a-8469-2849363f08db';

// GUARD #2 BITE: an empty / whitespace origin is REFUSED for BOTH classes.
if (!throws(() => composeUnitIor('File', U, ''))) fail('GUARD#2: composeUnitIor(File, uuid, "") did NOT throw — a File minted without origin must be rejected (cross-server-unresolvable bare ref).');
if (!throws(() => composeUnitIor('Folder', U, '   '))) fail('GUARD#2: composeUnitIor(Folder, uuid, whitespace) did NOT throw — origin is load-bearing.');
if (!throws(() => composeUnitIor('File', '', ORIGIN))) fail('GUARD#2: composeUnitIor with an empty uuid did NOT throw.');

// COMPOSES the fully-qualified form (matches the minted Class File selfIor shape) + trims a trailing slash.
const fileIor = composeUnitIor('File', U, ORIGIN);
if (fileIor !== `ior:class:File:rest:${ORIGIN}/scenario/${U}`) fail(`GUARD#2 format: File IOR wrong (got "${fileIor}").`);
if (composeUnitIor('Folder', U, ORIGIN + '/') !== `ior:class:Folder:rest:${ORIGIN}/scenario/${U}`) fail('GUARD#2 format: Folder IOR wrong or trailing-slash not trimmed.');

console.log('✓ Sprint 41 guard#2 (fully-qualified IOR by construction): empty origin REFUSED for File+Folder; ior:class:<Class>:rest:<origin>/scenario/<uuid> composed correctly.');
