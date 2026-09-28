/**
 * R0 CONTAINMENT gate (oopPO-ranked 2026-09-28). The legacy generate (resolveByKey UNSET), which the /api/model/generate
 * and /api/model/generate-project endpoints run into modelDir()=PROD, MINTS DUPLICATES over a scenario clean-class (chain
 * uuids are ARBITRARY ≠ keyToUuid). This gate proves (A) the guard REFUSES a clean-class target, and (B) — on a TEMP
 * FIXTURE, NEVER Tron's live scenario dir — a legacy generate DUPS (RED) while resolveByKey does NOT (GREEN).
 * stub-must-fail: neuter legacyGenHitsCleanClassR0 (return false for a clean-class) → assertion (A) fails → RED.
 */
import { legacyGenHitsCleanClassR0 } from '../src/ts/server/clean-class-guard.js';
import { TsToModel, keyToUuid } from '../src/ts/scenario/TsToModel.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const abs = (p: string) => path.resolve(REPO, p);

// (A) GUARD LOGIC — refuses clean-class file + a dir containing one; allows unrelated; (failable: neuter → these flip)
if (!legacyGenHitsCleanClassR0(REPO, abs('src/ts/scenario/file.ts'), false)) fail('guard must REFUSE the clean-class file.ts');
if (!legacyGenHitsCleanClassR0(REPO, abs('src/ts/scenario/folder.ts'), false)) fail('guard must REFUSE folder.ts');
if (legacyGenHitsCleanClassR0(REPO, abs('src/ts/scenario/index-store.ts'), false)) fail('guard must ALLOW a non-clean-class .ts');
if (!legacyGenHitsCleanClassR0(REPO, abs('src/ts/scenario'), true)) fail('guard must REFUSE a dir CONTAINING a clean-class (the default generate-project dir)');
if (legacyGenHitsCleanClassR0(REPO, abs('src/ts/server'), true)) fail('guard must ALLOW a dir with no clean-class');

// (B) DUP-HAZARD FIXTURE — temp dir ONLY (never Tron's scenario/index)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r0guard-'));
fs.writeFileSync(path.join(tmp, 'fixture.ts'), 'export class Widget { foo(): void {} }\n');
const KEY = 'fixture.ts::Widget';
const SEED_UUID = 'aaaa1111-2222-4333-a444-555566667777'; // an ARBITRARY chain uuid (≠ keyToUuid), like the real File chain
const shard = (root: string, u: string) => path.join(root, ...u.slice(0, 5).split(''), `${u}.scenario.json`);
const seedWidget = (idxDir: string) => { const f = shard(idxDir, SEED_UUID); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify({ ior: 'ior:class:ModelElement', ownerIor: 'ior:instance:tron', model: { uuid: SEED_UUID, name: 'Widget', metaLevel: 'M1', kind: 'class', sourceFile: 'fixture.ts', qualifiedName: 'Widget', derivationKey: KEY, instanceOf: [] } }, null, 2) + '\n'); };
const countWidget = (idxDir: string): number => { let n = 0; const st = [idxDir]; while (st.length) { const d = st.pop()!; if (!fs.existsSync(d)) continue; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { st.push(p); continue; } if (!e.name.endsWith('.scenario.json')) continue; try { const u = JSON.parse(fs.readFileSync(p, 'utf-8')); if (u.model?.metaLevel === 'M1' && u.model?.name === 'Widget') n++; } catch { /* */ } } } return n; };

if (keyToUuid(KEY) === SEED_UUID) fail('fixture invalid: keyToUuid(KEY) must differ from the arbitrary seed uuid (else no hazard).');
const exists = (idxDir: string, u: string) => fs.existsSync(shard(idxDir, u));

// RED: LEGACY generate (resolveByKey UNSET) over the fixture DESTROYS the chain identity — it mints keyToUuid(KEY)
// (a NEW arbitrary uuid, the "duplicate" model) and the reconcile drops the chain-seed (has a derivationKey, absent from
// the legacy keyToUuid live-set). So the referenced chain uuid is GONE, replaced by a different one = the live-model hazard.
const idxLegacy = path.join(tmp, 'legacy');
seedWidget(idxLegacy);
new TsToModel(tmp).generate([path.join(tmp, 'fixture.ts')], { indexDir: idxLegacy, write: true, diagram: false });
if (exists(idxLegacy, SEED_UUID)) fail('RED-proof: legacy generate should NOT preserve the chain-seed uuid (the hazard replaces/deletes it); it survived — hazard not reproduced.');
if (!exists(idxLegacy, keyToUuid(KEY))) fail('RED-proof: legacy generate should mint a keyToUuid replacement (the duplicate identity); none found.');

// GREEN: resolveByKey (FIX-1 direction) over the same fixture RESOLVES to the chain-seed — its uuid is PRESERVED (no
// replacement, identity intact), and no keyToUuid replacement is minted.
const idxResolve = path.join(tmp, 'resolve');
seedWidget(idxResolve);
new TsToModel(tmp).deriveClassM2([path.join(tmp, 'fixture.ts')], { ownerIor: 'ior:instance:tron', indexDir: idxResolve, write: true });
const seedKept = exists(idxResolve, SEED_UUID), replacementMinted = exists(idxResolve, keyToUuid(KEY));
fs.rmSync(tmp, { recursive: true, force: true });
if (!seedKept) fail('GREEN-proof: resolveByKey should PRESERVE the chain-seed uuid (identity kept); it was lost.');
if (replacementMinted) fail('GREEN-proof: resolveByKey should NOT mint a keyToUuid replacement (that would be the dup); one was minted.');

console.log('✓ R0 guard: refuses a clean-class file + a containing dir (allows unrelated); FIXTURE proves legacy generate DESTROYS the chain identity (RED: seed uuid gone, keyToUuid replacement minted) while resolveByKey PRESERVES it (GREEN: seed kept, no replacement) — never touched Tron live scenario dir.');
