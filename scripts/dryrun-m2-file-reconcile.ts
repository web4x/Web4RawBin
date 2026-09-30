/**
 * T41.6 FIX-1/FIX-2 DRY-RUN (write:false, READ-ONLY — mutates NOTHING). Runs deriveClassM2(resolveByKey) over
 * src/ts/scenario/file.ts and compares the WOULD-WRITE unit set to the PERSISTED disk (by derivationKey): reports
 * RESOLVED (uuid reused), MINTS (new — the architect-cleared 14: FileModel/FileViewModel/MoveCommand/FileIconToken + attrs), memberOf CHANGES (the 4 attrs File→FileModel),
 * RE-KEYS (a matched key whose uuid changed — MUST be 0), DELETIONS (removed — MUST be 0). Folder EXCLUDED per Tron.
 * The reconcile write:true must match THIS exactly (any divergence = STOP + report).
 *
 * ★ FIX-2 SEQUENCING (PO ruling 2026-09-29): the `check-m2-persisted-equals-derived` gate is DELIBERATELY DEFERRED to
 * the reconcile increment — NOT an oversight. It is UNPROVABLE until persisted==derived: a gate must demonstrate
 * green→edit→RED, but until the reconcile lands the persisted disk != the derivation (14 mints + 4 memberOf pending),
 * so the gate can only sit permanently RED, which rots the suite (trains everyone that red is normal). It lands WITH
 * the reconcile — where it goes GREEN, gets its stub-must-fail proof, and is wired into ci:gates — and this script's
 * stale "expect FileModel only" message (below) is updated to persist-all-14 in that SAME pass.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { TsToModel } from '../src/ts/scenario/TsToModel.js';

const REPO = path.resolve(new URL('..', import.meta.url).pathname);
const TRON = 'ior:instance:04e84ff9-a460-4c0a-8ab6-52793bebe9c4';
const FILE = `${REPO}/src/ts/scenario/file.ts`;

// build persistedByKey (derivationKey → {uuid, memberOf, name}) by scanning the index for file.ts-keyed units
const idxRoot = `${REPO}/scenario/index`;
const persistedByKey = new Map<string, { uuid: string; memberOf: string; name: string }>();
const walk = (d: string) => { for (const e of readdirSync(d)) { const p = path.join(d, e); const s = statSync(p); if (s.isDirectory()) walk(p); else if (e.endsWith('.scenario.json')) { try { const m = JSON.parse(readFileSync(p, 'utf8')).model || {}; if (typeof m.derivationKey === 'string' && m.derivationKey.startsWith('src/ts/scenario/file.ts')) persistedByKey.set(m.derivationKey, { uuid: String(m.uuid), memberOf: String(m.memberOf || ''), name: String(m.name || '') }); } catch { /* skip */ } } } };
walk(idxRoot);

const t = new TsToModel(REPO);
const { units, wrote, removed } = t.deriveClassM2([FILE], { ownerIor: TRON, write: false });

const resolved: string[] = [], mints: string[] = [], memberChanges: string[] = [], rekeys: string[] = [];
for (const u of units) {
  const m: any = u.model || {};
  if (typeof m.derivationKey !== 'string' || !m.derivationKey.startsWith('src/ts/scenario/file.ts')) continue;
  const p = persistedByKey.get(m.derivationKey);
  if (!p) { mints.push(`${m.name} [${m.derivationKey}] uuid=${String(m.uuid).slice(0, 8)}`); continue; }
  if (String(m.uuid) !== p.uuid) rekeys.push(`${m.name} key=${m.derivationKey} persisted=${p.uuid.slice(0, 8)} derived=${String(m.uuid).slice(0, 8)}`);
  else resolved.push(`${m.name} uuid=${p.uuid.slice(0, 8)}`);
  if (String(m.memberOf || '') !== p.memberOf) memberChanges.push(`${m.name}: memberOf ${p.memberOf.slice(0, 24) || '(none)'} → ${String(m.memberOf || '').slice(0, 24)}`);
}

console.log('=== T41.6 DRY-RUN (write:false) over src/ts/scenario/file.ts — READ ONLY ===');
console.log(`derived units (file.ts-keyed): ${units.filter((u: any) => String(u.model?.derivationKey || '').startsWith('src/ts/scenario/file.ts')).length}`);
console.log(`RESOLVED (uuid reused, no re-key): ${resolved.length}`); resolved.forEach(r => console.log('  ✓ ' + r));
console.log(`MINTS (new units — persist-all-14, architect-cleared: FileModel/FileViewModel/MoveCommand interfaces + FileIconToken type + attrs + File.uuid property): ${mints.length}`); mints.forEach(r => console.log('  + ' + r));
console.log(`memberOf CHANGES (EXPECT the attrs → FileModel): ${memberChanges.length}`); memberChanges.forEach(r => console.log('  ~ ' + r));
console.log(`RE-KEYS (MUST be 0): ${rekeys.length}`); rekeys.forEach(r => console.log('  ★RE-KEY ' + r));
console.log(`DELETIONS (removed, MUST be 0): ${removed}`);
console.log(`wrote (would-write, write:false so 0 on disk): ${wrote}`);
console.log(`\nGATE: reconcile write:true must match EXACTLY — 0 re-keys (${rekeys.length}) + 0 deletions (${removed}); mints = the architect-cleared 14 (persist-all-14); the 4 attrs → FileModel. Any divergence = STOP. (Reconcile SHIPPED T41.6 2026-09-30; FIX-2 gate check:m2-persisted-equals-derived now asserts persisted==derived.)`);
