// PRE-MIGRATION BASELINE — INVENTORY (Tron: FULL MIGRATION MODEL_STORE→scenario/index, NO REGRESSION).
// Captures every unit that exists TODAY by store, deduped by model.uuid, so post-migration we can prove NO unit was lost.
// The critical number = units living ONLY in MODEL_STORE (data/model-store/index): those are the data-loss risk — after the
// migration every one of them MUST exist in scenario/index. Symlinks share a uuid with their real unit → skipped (dedup).
// Output: a committed JSON artifact (test/baseline/premigration-inventory.json) — the before-picture 'no regression' is judged against.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const STORES = {
  scenarioIndex: path.join(ROOT, 'scenario/index'),
  modelStore: path.join(ROOT, 'data/model-store/index'),
};

function scan(dir) {
  const byUuid = new Map(); // uuid → {uuid,name,ior,kind}
  let realFiles = 0, symlinks = 0, parseErr = 0, noUuid = 0;
  const walk = (d) => {
    let ents; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isSymbolicLink()) { symlinks++; continue; }         // dedup: a symlink shares its target's uuid
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.isFile() || !e.name.endsWith('.scenario.json')) continue;
      realFiles++;
      try {
        const j = JSON.parse(fs.readFileSync(p, 'utf8'));
        const u = j?.model?.uuid;
        if (!u) { noUuid++; continue; }
        if (!byUuid.has(u)) byUuid.set(u, { uuid: u, name: String(j?.model?.name || ''), ior: String(j?.ior || ''), kind: String(j?.model?.kind || ''), file: p });
      } catch { parseErr++; }
    }
  };
  walk(dir);
  return { byUuid, realFiles, symlinks, parseErr, noUuid };
}

const si = scan(STORES.scenarioIndex);
const ms = scan(STORES.modelStore);
const siU = new Set(si.byUuid.keys());
const msU = new Set(ms.byUuid.keys());
const both = [...msU].filter((u) => siU.has(u));
const modelStoreOnly = [...msU].filter((u) => !siU.has(u));      // ★ DATA-LOSS RISK
const scenarioIndexOnly = [...siU].filter((u) => !msU.has(u));

// ── RISK SPLIT (PO): (A) GENERATED/re-derivable by TsToModel from source — low risk; (B) AUTHORED/irreplaceable — total risk.
// class A = model elements TsToModel regenerates; class B = everything else in MODEL_STORE-only (authored artefacts).
const GENERATED_KINDS = new Set(['attribute', 'method', 'function', 'interface', 'class', 'type', 'property']);
const isGenerated = (unit) => GENERATED_KINDS.has(unit.kind);
const relOf = (p) => (p || '').replace(ROOT + '/', '');
const sha256File = (p) => { try { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } catch { return null; } };

const moUnits = modelStoreOnly.map((u) => ms.byUuid.get(u));
const generated = moUnits.filter(isGenerated);                                   // (A) 628 expected
const authored = moUnits.filter((u) => !isGenerated(u))                          // (B) 41 expected — the REAL data-loss surface
  .map((u) => ({ uuid: u.uuid, name: u.name, ior: u.ior, kind: u.kind, relPath: relOf(u.file), contentSha: sha256File(u.file) }))
  .sort((a, b) => a.uuid.localeCompare(b.uuid));
const genByKind = {}; for (const u of generated) genByKind[u.kind || u.ior] = (genByKind[u.kind || u.ior] || 0) + 1;
const authByKind = {}; for (const u of authored) authByKind[u.kind || u.ior] = (authByKind[u.kind || u.ior] || 0) + 1;

const artifact = {
  capturedAt: process.env.CAPTURED_AT || 'unstamped',
  servedVersion: process.env.SERVED_VERSION || 'unknown',
  headSha: process.env.HEAD_SHA || 'unknown',
  stores: {
    scenarioIndex: { path: 'scenario/index', realFiles: si.realFiles, symlinks: si.symlinks, uniqueUuids: siU.size, parseErr: si.parseErr, noUuid: si.noUuid },
    modelStore: { path: 'data/model-store/index', realFiles: ms.realFiles, symlinks: ms.symlinks, uniqueUuids: msU.size, parseErr: ms.parseErr, noUuid: ms.noUuid },
  },
  overlap: {
    inBoth: both.length,
    modelStoreOnly: modelStoreOnly.length,       // MUST all land in scenario/index post-migration
    scenarioIndexOnly: scenarioIndexOnly.length,
  },
  // reconcile architect 784 vs my 669: 784 raw entries = 702 real files + 82 symlinks (symlinks share their target's uuid →
  // deduped); 702 unique uuids − 33 that ALSO live in scenario/index (in-both) = 669 MODEL_STORE-only. 82 + 33 = 115 = 784 − 669.
  reconciliation: { architectRawEntries: 784, modelStoreRealFiles: ms.realFiles, modelStoreSymlinks: ms.symlinks, modelStoreUniqueUuids: msU.size, inBothStores: both.length, modelStoreOnly: modelStoreOnly.length, note: '784 raw = 702 real + 82 symlinks (deduped by uuid); 702 unique − 33 in-both = 669 model-store-only; gap 115 = 82 symlinks + 33 in-both' },
  riskSplit: {
    generatedRederivable: { count: generated.length, byKind: genByKind, note: 'TsToModel regenerates these from source — present-or-regenerable suffices post-migration' },
    authoredIrreplaceable: { count: authored.length, byKind: authByKind, note: 'NOT re-derivable — each MUST be present by uuid AND content-intact (contentSha equal) post-migration; total-loss risk', units: authored },
  },
  modelStoreOnlyUnits: moUnits.map((u) => ({ uuid: u.uuid, name: u.name, ior: u.ior, kind: u.kind })).sort((a, b) => a.uuid.localeCompare(b.uuid)),
};

fs.writeFileSync(path.join(ROOT, 'test/baseline/premigration-inventory.json'), JSON.stringify(artifact, null, 2) + '\n');

console.log('═══ PRE-MIGRATION INVENTORY (v' + artifact.servedVersion + ', HEAD ' + artifact.headSha + ') ═══');
console.log(`  scenario/index (the ONE store) : ${siU.size} unique uuids (${si.realFiles} files, ${si.symlinks} symlinks, ${si.parseErr} parseErr)`);
console.log(`  data/model-store/index (ELIMINATED): ${msU.size} unique uuids (${ms.realFiles} files, ${ms.symlinks} symlinks, ${ms.parseErr} parseErr)`);
console.log(`  in BOTH stores                 : ${both.length}`);
console.log(`  ★ ONLY in MODEL_STORE (data-loss risk): ${modelStoreOnly.length}  ← every one MUST exist in scenario/index after migration`);
console.log(`  only in scenario/index         : ${scenarioIndexOnly.length}`);
console.log(`  reconcile architect 784 vs mine 669: 702 real + 82 symlinks = 784; 702 unique − 33 in-both = 669 (gap 115 = 82 symlinks + 33 in-both)`);
console.log(`  ── RISK SPLIT of the 669 ──`);
console.log(`  (A) GENERATED/re-derivable (TsToModel): ${generated.length}  ${JSON.stringify(genByKind)}  [LOW risk — regenerate recreates]`);
console.log(`  (B) AUTHORED/IRREPLACEABLE            : ${authored.length}  ${JSON.stringify(authByKind)}  [TOTAL risk — must be present by uuid + contentSha intact]`);
console.log('  → artifact: test/baseline/premigration-inventory.json (all 669 by uuid; the ' + authored.length + ' authored carry relPath+contentSha)');
