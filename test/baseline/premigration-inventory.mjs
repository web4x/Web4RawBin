// PRE-MIGRATION BASELINE — INVENTORY (Tron: FULL MIGRATION MODEL_STORE→scenario/index, NO REGRESSION).
// Captures every unit that exists TODAY by store, deduped by model.uuid, so post-migration we can prove NO unit was lost.
// The critical number = units living ONLY in MODEL_STORE (data/model-store/index): those are the data-loss risk — after the
// migration every one of them MUST exist in scenario/index. Symlinks share a uuid with their real unit → skipped (dedup).
// Output: a committed JSON artifact (test/baseline/premigration-inventory.json) — the before-picture 'no regression' is judged against.
import fs from 'node:fs';
import path from 'node:path';

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
        if (!byUuid.has(u)) byUuid.set(u, { uuid: u, name: String(j?.model?.name || ''), ior: String(j?.ior || ''), kind: String(j?.model?.kind || '') });
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
  modelStoreOnlyUnits: modelStoreOnly.map((u) => ms.byUuid.get(u)).sort((a, b) => a.uuid.localeCompare(b.uuid)),
};

fs.writeFileSync(path.join(ROOT, 'test/baseline/premigration-inventory.json'), JSON.stringify(artifact, null, 2) + '\n');

console.log('═══ PRE-MIGRATION INVENTORY (v' + artifact.servedVersion + ', HEAD ' + artifact.headSha + ') ═══');
console.log(`  scenario/index (the ONE store) : ${siU.size} unique uuids (${si.realFiles} files, ${si.symlinks} symlinks, ${si.parseErr} parseErr)`);
console.log(`  data/model-store/index (ELIMINATED): ${msU.size} unique uuids (${ms.realFiles} files, ${ms.symlinks} symlinks, ${ms.parseErr} parseErr)`);
console.log(`  in BOTH stores                 : ${both.length}`);
console.log(`  ★ ONLY in MODEL_STORE (data-loss risk): ${modelStoreOnly.length}  ← every one MUST exist in scenario/index after migration`);
console.log(`  only in scenario/index         : ${scenarioIndexOnly.length}`);
if (modelStoreOnly.length) {
  const byKind = {};
  for (const u of modelStoreOnly) { const k = ms.byUuid.get(u).kind || ms.byUuid.get(u).ior || '?'; byKind[k] = (byKind[k] || 0) + 1; }
  console.log(`  MODEL_STORE-only by kind/ior   : ${JSON.stringify(byKind)}`);
}
console.log('  → artifact: test/baseline/premigration-inventory.json');
