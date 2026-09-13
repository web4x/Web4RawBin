/**
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

// ICON — the FILE owns its icon (mime lens first, ext fallback, default 📄)
const iconOf = (name: string, mimeType?: string) => new File({ uuid: U, name, mimeType }).renderSelf().icon;
if (iconOf('p.png', 'image/png') !== '🖼') fail('image/* → 🖼');
if (iconOf('doc.pdf', 'application/pdf') !== '📕') fail('application/pdf → 📕');
if (iconOf('link', 'text/uri-list') !== '🔗') fail('text/uri-list → 🔗');
if (iconOf('mod.ts') !== '⚡') fail('.ts ext → ⚡ (ext fallback when no mime)');
if (iconOf('mystery.zzz') !== '📄') fail('unknown → 📄 default');

// PURE — file.ts must not import a node builtin / DOM (the ONE class runs both sides)
const src = readFileSync(new URL('../src/ts/scenario/file.ts', import.meta.url), 'utf-8');
if (/^\s*import\b[^\n]*from\s*['"](node:|crypto|fs|path)/m.test(src)) fail('File must be PURE (crypto/fs/DOM-free) — it imports a node builtin.');

console.log('✓ Sprint 41 T41.1 inc-2: File.renderSelf returns a pure view-model {kind,uuid,icon,name,badges}; icon by mime/ext (ask-the-object); name falls back to uuid; File pure.');
