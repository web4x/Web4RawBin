/**
 * [test:uuid:aa84b7eb] Test — File.renderSelf (impl 48d04414).
 * Sprint 41 (T41.1 inc-2) — File.renderSelf() returns a PURE VIEW-MODEL (ask-the-object), NOT a bare string and NOT DOM.
 * The radical-OOP fix: the tree paints a File node from the File's OWN view-model, never rebuilds it from a synthetic
 * `file:<path>` string. This gate proves renderSelf yields {kind,uuid,icon,name,badges} with the object's own icon+name.
 * stub-must-fail: make renderSelf return a bare string / drop the icon → this gate exits 1 (RED).
 */
import { File } from '../src/ts/scenario/file.js';
import { readFileSync } from 'node:fs';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const U = 'a264c6a3-9732-4796-9aaa-dbd3b8e67dd6';

// view-model SHAPE (object, not a string data-bag) + kind + uuid carried
const vm = new File({ uuid: U, name: 'notes.md', mimeType: 'text/markdown' }).renderSelf();
if (typeof vm !== 'object' || vm === null || Array.isArray(vm)) fail('renderSelf must return a view-model OBJECT, not a bare string/array (radical-OOP: ask-the-object, no synthetic string).');
if (vm.kind !== 'file') fail(`renderSelf kind must be 'file' (got ${JSON.stringify(vm.kind)}).`);
if (vm.uuid !== U) fail('renderSelf must carry the uuid.');
if (!Array.isArray(vm.badges)) fail('renderSelf.badges must be an array.');

// NAME — the object's own name; falls back to uuid when absent (never blank)
if (vm.name !== 'notes.md') fail(`renderSelf.name must be the file name (got ${JSON.stringify(vm.name)}).`);
if (new File({ uuid: U }).renderSelf().name !== U) fail('renderSelf.name must fall back to uuid when name is absent (never blank).');

// ICON — the FILE owns its icon CATEGORY as a semantic TOKEN, NOT a concrete glyph (PO ruling: glyph is the adapter's job).
const tokenOf = (name: string, mimeType?: string) => new File({ uuid: U, name, mimeType }).renderSelf().iconToken;
if (tokenOf('p.png', 'image/png') !== 'image') fail('image/* → token "image"');
if (tokenOf('doc.pdf', 'application/pdf') !== 'document') fail('application/pdf → token "document"');
if (tokenOf('mod.ts') !== 'code') fail('.ts ext → token "code" (ext fallback when no mime)');
if (tokenOf('data.json') !== 'data') fail('.json ext → token "data"');
if (tokenOf('photo.jpg') !== 'image') fail('image ext → token "image"');
if (tokenOf('mystery.zzz') !== 'generic') fail('unknown → token "generic" (never blank)');
// NO CONCRETE GLYPH in the view-model — the token is a lowercase category word, never an emoji/SVG (the leak inc-2 shipped).
const ALLOWED = ['image', 'audio', 'video', 'document', 'archive', 'code', 'data', 'generic'];
if (!ALLOWED.includes(vm.iconToken)) fail(`iconToken must be a semantic category (got ${JSON.stringify(vm.iconToken)}).`);
if (/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]|<svg|<path/u.test(JSON.stringify(vm))) fail('view-model must contain NO concrete glyph (emoji/SVG) — the object owns the category, the adapter owns the glyph.');

// PURE — file.ts must not import a node builtin / DOM (the ONE class runs both sides)
const src = readFileSync(new URL('../src/ts/scenario/file.ts', import.meta.url), 'utf-8');
if (/^\s*import\b[^\n]*from\s*['"](node:|crypto|fs|path)/m.test(src)) fail('File must be PURE (crypto/fs/DOM-free) — it imports a node builtin.');

console.log('✓ Sprint 41 T41.1 inc-2: File.renderSelf returns a pure view-model {kind,uuid,icon,name,badges}; icon by mime/ext (ask-the-object); name falls back to uuid; File pure.');
