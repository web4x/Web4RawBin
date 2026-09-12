/**
 * R40.106 INC-4a — parentFolder is RETIRED as a containment source of truth. Enforce, do NOT document.
 *
 * Tron's model: containment is a many-to-many EDGE set (container children[] / room fileUnits holding ior refs),
 * NEVER a unit's own singular field. The legacy `parentFolder` (WebItem-only, 33 units) is demoted to inert
 * provenance: it must be touched ONLY where it is SET (WebItem.createWebItemUnit) and where its ref is kept valid
 * on federated import (federation-transfer ref-rewrite). It must NEVER be read to RESOLVE CONTAINMENT / RENDER —
 * that is the edge's job. This gate makes the retire structural: any NEW src reader of parentFolder = a containment
 * source creeping back = RED. That is the "0-render-delta" transparency proof by construction (nothing reads it, so
 * retiring/ignoring it changes nothing) + protection against a future regression re-coupling render to the field.
 */
import { execSync } from 'node:child_process';

const ALLOWED = new Set([
  'src/ts/scenario/WebItem.ts',              // SETS it (mint) — provenance only
  'src/ts/server/federation-transfer.ts',    // ref-rewrite keeps the provenance ref valid on import
]);
const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };

// every src (non-test) file that mentions parentFolder
const out = execSync(`grep -rl "parentFolder" src --include='*.ts' || true`, { encoding: 'utf8' }).trim();
const files = out ? out.split('\n').map((f) => f.replace(/^\.\//, '')).filter((f) => !/\.test\.ts$/.test(f)) : [];
const stray = files.filter((f) => !ALLOWED.has(f));

// SELF-BITE: the allow-list must be non-empty + the two known sites must still hold the field (else the gate is inert).
if (!files.includes('src/ts/scenario/WebItem.ts')) fail('SELF-BITE: WebItem.ts no longer references parentFolder — the gate lost its anchor (or the field moved); re-verify.');

if (stray.length) fail(`parentFolder is read/written OUTSIDE the 2 allowed provenance sites — a containment source is creeping back (R40.106 INC-4a): ${stray.join(', ')}. Containment must resolve from children[]/fileUnits EDGES, never parentFolder.`);

console.log(`✓ R40.106 INC-4a: parentFolder confined to ${files.length} provenance site(s) [${files.join(', ')}] — 0 containment/render readers, retire is 0-render-delta by construction.`);
