#!/usr/bin/env node
/**
 * node20+ preflight — runs the given command under a node20+ binary, re-using node22/node20 if the current node is
 * too old. Same self-healing principle as scripts/start.mjs, but for vitest/rolldown + ci:gates (which need node20.19+/
 * 22.12+, a higher bar than tsx's node18). So `npm test` / `npm run ci:gates` NEVER fail on wrong-node by construction —
 * run them under node16 and they auto-use node22. Usage: node scripts/with-node20.mjs <command…>
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { findNode, major, nodeVersion as ver } from './find-node.mjs'; // THE ONE node-finder (shared; do NOT re-fork the logic here)

const MIN = 20;

const node = findNode(MIN); // findNode already realpath-resolves the chosen binary
if (!node) { console.error(`✗ need node${MIN}+ (vitest/rolldown/ci:gates). Install node22 side-by-side (see scripts/start.mjs + the web4rawbin node-toolchain note) or expose node22 on PATH.`); process.exit(1); }

const cmd = process.argv.slice(2).join(' ');
if (!cmd) { console.error('usage: node scripts/with-node20.mjs <command…>'); process.exit(1); }

// prepend the chosen node's REAL bindir so `node`/`npm`/`npx`/node_modules/.bin shims all resolve to node20+
const env = { ...process.env, PATH: `${path.dirname(node)}:${process.env.PATH}` };
if (major(process.version) < MIN) console.log(`↻ node ${process.version} <${MIN} → running under ${ver(node)} @ ${node}`);
const r = spawnSync(cmd, { shell: true, stdio: 'inherit', env });
process.exit(r.status ?? 1);
