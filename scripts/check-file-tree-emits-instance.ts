/**
 * Sprint 41 (T41.1 inc-4b) — the /model unit tree emits M0 File INSTANCES: rb-object-item asks File.renderSelf() for a
 * file node's icon+name and maps the token via FILE_TOKEN_ICONS; the File-type derivation is DELETED from TRACE_ICONS
 * (no dormant duplicate). This is a REGRESSION-LOCK on the wiring (the RENDER itself is proved by a screenshot — a
 * source/DOM proxy shares the defect's blind spot; this only locks the code path).
 * stub-must-fail: re-add a 'file' entry to TRACE_ICONS OR drop the File.renderSelf routing → this gate exits 1 (RED).
 */
import { TRACE_ICONS, FILE_TOKEN_ICONS } from '../src/public/ts/trace/icons.js';
import { readFileSync } from 'node:fs';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };

// 1. the File icon derivation is DELETED from the type-map (lives only in FILE_TOKEN_ICONS now — no half-state).
if ('file' in TRACE_ICONS) fail("TRACE_ICONS still has a 'file' entry — the File icon derivation must live ONLY in FILE_TOKEN_ICONS (delete same increment).");
if (!('image' in FILE_TOKEN_ICONS) || !('generic' in FILE_TOKEN_ICONS)) fail('FILE_TOKEN_ICONS must own the File category glyphs.');

// 2. rb-object-item routes file-type through File.renderSelf → FILE_TOKEN_ICONS (ask-the-object), not TRACE_ICONS.
const src = readFileSync(new URL('../src/public/ts/trace/rb-object-item.ts', import.meta.url), 'utf-8');
if (!/type === 'file'/.test(src)) fail('rb-object-item must special-case file-type to ask the File object.');
if (!/new File\(/.test(src) || !/\.renderSelf\(\)/.test(src)) fail('rb-object-item must ask File.renderSelf() for a file node (ask-the-object).');
if (!/fileIconGlyph\(/.test(src)) fail('rb-object-item must map the File token via fileIconGlyph() (the /model glyph adapter METHOD, not a raw map index).');

console.log('✓ Sprint 41 T41.1 inc-4b (wiring lock): rb-object-item asks File.renderSelf → FILE_TOKEN_ICONS for file nodes; TRACE_ICONS.file deleted (no dormant map). RENDER proved separately by screenshot.');
