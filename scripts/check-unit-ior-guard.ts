/**
 * [test:uuid:f22f164f] Test — GUARD#2 (Ior compose, impl 30e39639).
 * Sprint 41 GUARD #2 gate — the fully-qualified IOR is a VALUE-OBJECT (`Ior`), composed WITH an origin, BY CONSTRUCTION.
 * Ior.for(className, origin, uuid) = ior:class:<Class>:rest:<origin>/scenario/<uuid>; an EMPTY origin THROWS in the
 * constructor (you cannot build an ownerless-of-origin ref). File.ownIor()/Folder.ownIor() ASK the Ior (single format
 * owner — the free-fn composeUnitIor was deleted, its knowledge collapsed into Ior; assert 0 refs remain too).
 * stub-must-fail: remove the empty-origin throw in Ior → the guard#2 assertions stop throwing → this gate exits 1 (RED).
 */
import { Ior } from '../src/ts/scenario/ior.js';
import { File } from '../src/ts/scenario/file.js';
import { Folder } from '../src/ts/scenario/folder.js';
import { readFileSync } from 'node:fs';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const throws = (fn: () => void): boolean => { try { fn(); return false; } catch { return true; } };
const U = 'a264c6a3-9732-4796-9aaa-dbd3b8e67dd6';
const ORIGIN = 'https://prod.wo-da.de:4444';

// GUARD #2 BITE — an empty / whitespace origin is REFUSED (Ior constructor throws), for the value-object AND via the classes.
if (!throws(() => Ior.for('File', '', U))) fail('GUARD#2: Ior.for(File, "", uuid) did NOT throw — a ref without an origin is cross-server-unresolvable.');
if (!throws(() => Ior.for('Folder', '   ', U))) fail('GUARD#2: Ior.for(Folder, whitespace, uuid) did NOT throw — origin is load-bearing.');
if (!throws(() => Ior.for('File', ORIGIN, ''))) fail('GUARD#2: Ior.for(File, origin, "") did NOT throw — uuid required.');
if (!throws(() => new File({ uuid: U, origin: '' }).ownIor())) fail('GUARD#2: File.ownIor() with empty origin did NOT throw (the class must ask Ior, whose guard fires).');
if (!throws(() => new Folder({ uuid: U, origin: '' }).ownIor())) fail('GUARD#2: Folder.ownIor() with empty origin did NOT throw.');

// FORMAT — composed correctly + trailing slash trimmed; the class ownIor() equals the Ior string (ask-the-object, no drift).
const expectFile = `ior:class:File:rest:${ORIGIN}/scenario/${U}`;
if (Ior.for('File', ORIGIN, U).toString() !== expectFile) fail(`GUARD#2 format: Ior File wrong (got "${Ior.for('File', ORIGIN, U)}").`);
if (new File({ uuid: U, origin: ORIGIN }).ownIor() !== expectFile) fail('GUARD#2: File.ownIor() != Ior string — the class is not asking the single owner.');
if (Ior.for('Folder', ORIGIN + '/', U).toString() !== `ior:class:Folder:rest:${ORIGIN}/scenario/${U}`) fail('GUARD#2 format: Folder IOR wrong or trailing-slash not trimmed.');
if (new Folder({ uuid: U, origin: ORIGIN }).ownIor() !== `ior:class:Folder:rest:${ORIGIN}/scenario/${U}`) fail('GUARD#2: Folder.ownIor() != Ior string.');

// NO-SHIM: the deleted free-fn must not have crept back — 0 code references to composeUnitIor (a facade would re-own the format).
const iorSrc = readFileSync(new URL('../src/ts/scenario/ior.ts', import.meta.url), 'utf-8');
// import statements only (not comment mentions of "crypto/fs-free"): Ior must not pull a node builtin.
if (/^\s*import\b[^\n]*from\s*['"](node:|crypto|fs|path)/m.test(iorSrc) || /\brequire\(\s*['"](node:|crypto|fs|path)/.test(iorSrc)) fail('Ior must be PURE (crypto/fs/DOM-free) — it imports a node builtin.');

console.log('✓ Sprint 41 guard#2 (Ior value-object): empty origin REFUSED (Ior + File.ownIor + Folder.ownIor); format correct + trailing-slash trimmed; Ior pure.');
