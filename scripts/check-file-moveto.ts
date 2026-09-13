/**
 * [test:uuid:eeab2deb] Test — File.moveTo (impl 65b154c8).
 * Sprint 41 (T41.1 inc-3) — File.moveTo(target) returns a PURE move COMMAND (intent), not an effect. The File moves
 * ITSELF (ask-the-object); a thin client transport adapter dispatches the command via the EXISTING move-unit route
 * (no new route, no fork). This gate proves moveTo yields {verb:'move', unit, target, source?} — data, not a call.
 * stub-must-fail: make moveTo perform the fetch / return something not a move-command → this gate exits 1 (RED).
 */
import { File } from '../src/ts/scenario/file.js';
import { readFileSync } from 'node:fs';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const U = 'a264c6a3-9732-4796-9aaa-dbd3b8e67dd6';
const f = new File({ uuid: U, name: 'notes.md' });

const cmd = f.moveTo('roomcoll:R:files/Target');
if (typeof cmd !== 'object' || cmd === null) fail('moveTo must return a command OBJECT (pure intent), not a call/void.');
if (cmd.verb !== 'move') fail(`moveTo.verb must be 'move' (got ${JSON.stringify(cmd.verb)}).`);
if (cmd.unit !== U) fail('moveTo.unit must be the File\'s own uuid (ask-the-object).');
if (cmd.target !== 'roomcoll:R:files/Target') fail('moveTo.target must carry the target ref.');
if ('source' in cmd) fail('moveTo without a source arg must NOT invent a source key.');

const cmd2 = f.moveTo('roomcoll:R:files/Target', 'roomcoll:R:files/From');
if (cmd2.source !== 'roomcoll:R:files/From') fail('moveTo(target, source) must carry source (per-edge unlink).');

// PURE — File must not import transport/node/DOM (the command is dispatched by the adapter, not the class)
const src = readFileSync(new URL('../src/ts/scenario/file.ts', import.meta.url), 'utf-8');
const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''); // strip comments (they document reuse; only CODE must be pure)
if (/^\s*import\b[^\n]*from\s*['"](node:|crypto|fs|path)/m.test(code)) fail('File must be PURE — it imports a node builtin.');
if (/\bfetch\s*\(|XMLHttpRequest/.test(code)) fail('File.moveTo must be PURE intent — no fetch/transport call in the class (the adapter dispatches).');

console.log('✓ Sprint 41 T41.1 inc-3: File.moveTo returns a pure move-command {verb,unit,target,source?}; File contributes only what it knows; no transport in the class.');
