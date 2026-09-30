/**
 * T41.6 RANK-4 LIVE RECONCILE — WRITE (write:true) over src/ts/scenario/file.ts. Same deterministic deriveClassM2 as
 * the dry-run (dryrun-m2-file-reconcile.ts), only write:true persists. Captures the PRE-write persisted set, runs the
 * write, then computes the ACTUAL deltas vs pre-write and ASSERTS they MATCH the dry-run prediction EXACTLY:
 *   MINTS 14 · RESOLVED 10 · memberOf-changes 4 · RE-KEYS 0 · DELETIONS 0 · 0 Folder mints.
 * ANY divergence → prints ★DIVERGENCE + a non-zero exit so the caller STOPS BEFORE COMMIT (revert the M2 paths, report).
 * PO plan (2026-09-30, GO): commit-tree-first, write-matches-dry-run-exactly, path-limited M2 paths only, Folder excluded.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { TsToModel } from '../src/ts/scenario/TsToModel.js';

const REPO = path.resolve(new URL('..', import.meta.url).pathname);
const TRON = 'ior:instance:04e84ff9-a460-4c0a-8ab6-52793bebe9c4';
const FILE = `${REPO}/src/ts/scenario/file.ts`;
const idxRoot = `${REPO}/scenario/index`;

const persistedByKey = new Map<string, { uuid: string; memberOf: string }>();
const walk = (d: string) => { for (const e of readdirSync(d)) { const p = path.join(d, e); const s = statSync(p); if (s.isDirectory()) walk(p); else if (e.endsWith('.scenario.json')) { try { const m = JSON.parse(readFileSync(p, 'utf8')).model || {}; if (typeof m.derivationKey === 'string' && m.derivationKey.startsWith('src/ts/scenario/file.ts')) persistedByKey.set(m.derivationKey, { uuid: String(m.uuid), memberOf: String(m.memberOf || '') }); } catch { /* skip */ } } } };
walk(idxRoot);

const t = new TsToModel(REPO);
const { units, wrote, removed } = t.deriveClassM2([FILE], { ownerIor: TRON, write: true }); // ★ WRITE

let mints = 0, resolved = 0, memberChanges = 0, rekeys = 0, folderMints = 0;
for (const u of units) {
  const m: any = u.model || {};
  if (typeof m.derivationKey !== 'string' || !m.derivationKey.startsWith('src/ts/scenario/file.ts')) continue;
  const p = persistedByKey.get(m.derivationKey);
  if (!p) { mints++; if (String(m.name) === 'Folder' || String(m.derivationKey).includes('folder.ts')) folderMints++; continue; }
  if (String(m.uuid) !== p.uuid) rekeys++; else resolved++;
  if (String(m.memberOf || '') !== p.memberOf) memberChanges++;
}

console.log(`=== T41.6 RECONCILE WRITE (write:true) — ACTUAL DELTAS ===`);
console.log(`MINTS ${mints} · RESOLVED ${resolved} · memberOf-changes ${memberChanges} · RE-KEYS ${rekeys} · DELETIONS ${removed} · Folder-mints ${folderMints} · wrote ${wrote}`);
const ok = mints === 14 && resolved === 10 && memberChanges === 4 && rekeys === 0 && removed === 0 && folderMints === 0;
if (!ok) { console.error(`★DIVERGENCE from dry-run prediction (14/10/4/0/0/0-Folder) — STOP, do NOT commit; revert the M2 paths (git checkout) + report.`); process.exit(1); }
console.log(`✓ MATCHES dry-run EXACTLY (14 mints / 10 resolved / 4 memberOf / 0 re-key / 0 del / 0 Folder). Write is isolated + revertible; safe to path-limited-commit the M2 unit paths.`);
