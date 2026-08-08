// Count-agreement reconcile (INV-T3) — now via the expert's SHARED single-source scanTestMarkers (fix 012c844a3).
// Running the SAME scanner over the SAME root ⇒ identical buckets by construction = the count-agreement BITE.
// Confirms my earlier blind-spot is fixed: script/DET gates (r*/rc7*/*-gate.mjs, 0 it()-blocks) are UNPROVEN, not FICTIONAL.
import { scanTestMarkers } from '../../src/ts/scenario/test-marker-attach.ts';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';

// nameOf: resolve a Test-unit uuid → its model.name from the sharded scenario index (for attachment matching)
const nameOf = (uuid: string): string => {
  try {
    const shard = path.join(ROOT, 'scenario/index', ...uuid.slice(0, 5).split(''));
    const f = (fs.readdirSync(shard) as string[]).find((n) => n.startsWith(uuid));
    return f ? (JSON.parse(fs.readFileSync(path.join(shard, f), 'utf8')).model?.name || '') : '';
  } catch { return ''; }
};

const r = scanTestMarkers(ROOT, nameOf, { readdirSync: fs.readdirSync, readFileSync: fs.readFileSync }, path.join);
console.log(`SHARED scanTestMarkers: total=${r.markerTotal} files=${r.fileCount} → COMPLETE=${r.complete.length} UNPROVEN=${r.unproven.length} FICTIONAL=${r.fictional.length} outsideScope=${r.outsideScope.length}`);
const match = r.markerTotal === 674 && r.complete.length === 45 && r.unproven.length === 486 && r.fictional.length === 141 && r.outsideScope.length === 2;
console.log(`expert self-test: 674 → 45/486/141 +2 outside. MATCH? ${match ? 'YES — ★ COUNT-AGREEMENT BITE GREEN (single-source, baseline==gate)' : 'NO — investigate root/file-set'}`);

// confirm the 3 known-real gate markers are now UNPROVEN (were false-FICTIONAL before the fix)
for (const id of ['705e8a53', '57829ccc', 'd82ebcf5']) {
  const bucket = r.fictional.find((m) => m.uuid.startsWith(id)) ? 'FICTIONAL (STILL WRONG!)'
    : r.unproven.find((m) => m.uuid.startsWith(id)) ? 'UNPROVEN (fixed ✓)'
      : r.complete.find((m) => m.uuid.startsWith(id)) ? 'COMPLETE'
        : 'absent';
  console.log(`  ${id}: ${bucket}`);
}
