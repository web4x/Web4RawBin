/**
 * FIX-2 gate (T41.6) — the PERSISTED M2 units for src/ts/scenario/file.ts EQUAL what deriveClassM2 would DERIVE.
 * i.e. a fresh dry-run over file.ts produces 0 would-change: 0 MINTS, 0 memberOf-changes, 0 RE-KEYS, 0 DELETIONS
 * (every derived unit already persisted, by derivationKey, with the same uuid + memberOf). This is the reconcile's
 * standing invariant: if someone edits file.ts (adds a field/method) or a memberOf drifts, the derivation diverges
 * from disk → this gate goes RED, naming the reconcile owed. GREEN only when disk == derivation.
 *
 * DEFERRED-UNTIL-NOW (PO ruling): this gate is UNPROVABLE until the reconcile lands (before it, persisted != derived,
 * so it could only sit permanently RED). It ships GREEN in the reconcile increment (T41.6) with this stub-must-fail:
 *   stub-must-fail: edit file.ts to add a field/method (or change a memberOf on disk) → a MINT/memberOf-change
 *   appears → this gate exits 1 (RED). Restore → GREEN. (A permanently-red or un-failable gate is a convention, not a gate.)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { TsToModel } from '../src/ts/scenario/TsToModel.js';

const REPO = path.resolve(new URL('..', import.meta.url).pathname);
const TRON = 'ior:instance:04e84ff9-a460-4c0a-8ab6-52793bebe9c4';
const FILE = `${REPO}/src/ts/scenario/file.ts`;
const idxRoot = `${REPO}/scenario/index`;
const KEY = 'src/ts/scenario/file.ts';

const persistedByKey = new Map<string, { uuid: string; memberOf: string }>();
const walk = (d: string) => { for (const e of readdirSync(d)) { const p = path.join(d, e); const s = statSync(p); if (s.isDirectory()) walk(p); else if (e.endsWith('.scenario.json')) { try { const m = JSON.parse(readFileSync(p, 'utf8')).model || {}; if (typeof m.derivationKey === 'string' && m.derivationKey.startsWith(KEY)) persistedByKey.set(m.derivationKey, { uuid: String(m.uuid), memberOf: String(m.memberOf || '') }); } catch { /* skip */ } } } };
walk(idxRoot);

const t = new TsToModel(REPO);
const { units, removed } = t.deriveClassM2([FILE], { ownerIor: TRON, write: false });

const mints: string[] = [], memberChanges: string[] = [], rekeys: string[] = [];
for (const u of units) {
  const m: any = u.model || {};
  if (typeof m.derivationKey !== 'string' || !m.derivationKey.startsWith(KEY)) continue;
  const p = persistedByKey.get(m.derivationKey);
  if (!p) { mints.push(`${m.name} [${m.derivationKey}]`); continue; }
  if (String(m.uuid) !== p.uuid) rekeys.push(`${m.name} persisted=${p.uuid.slice(0, 8)} derived=${String(m.uuid).slice(0, 8)}`);
  if (String(m.memberOf || '') !== p.memberOf) memberChanges.push(`${m.name}: ${p.memberOf.slice(0, 20)} → ${String(m.memberOf || '').slice(0, 20)}`);
}

const fail = (m: string): never => { console.error(`✗ FIX-2 (persisted != derived): ${m}`); console.error('  → run the reconcile (scripts/apply-m2-file-reconcile.ts) so disk == derivation.'); process.exit(1); };
if (mints.length) fail(`${mints.length} unpersisted derived unit(s): ${mints.slice(0, 5).join(', ')}${mints.length > 5 ? ' …' : ''}`);
if (memberChanges.length) fail(`${memberChanges.length} memberOf drift(s): ${memberChanges.slice(0, 5).join(', ')}`);
if (rekeys.length) fail(`${rekeys.length} re-key(s): ${rekeys.slice(0, 5).join(', ')}`);
if (removed > 0) fail(`${removed} derived deletion(s) not reflected on disk.`);
console.log(`✓ FIX-2: persisted M2 == derived for ${KEY} (0 mints / 0 memberOf-changes / 0 re-keys / 0 deletions — disk matches the derivation).`);
