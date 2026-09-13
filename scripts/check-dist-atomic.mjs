/**
 * DIST ATOMICITY gate (PO 2026-09-13, the v0.8.236 phantom-deploy gap): a deploy commits "artifacts WITH source",
 * but that is NOT "served==committed for EVERY asset". The server serves the working-tree dist; if a bundle that
 * build-manifest references is UNTRACKED (rebuilt-not-committed) or MISSING, prod serves an uncommitted/absent asset
 * = a phantom. This gate asserts EVERY build-manifest-referenced bundle is present on disk AND git-tracked.
 * stub-must-fail: leave a manifest-referenced bundle untracked / delete it → this gate exits 1 (RED).
 */
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
const DIST = 'src/public/dist';
let manifest;
try { manifest = JSON.parse(readFileSync(`${DIST}/build-manifest.json`, 'utf8')); }
catch (e) { fail(`cannot read ${DIST}/build-manifest.json: ${e.message}`); }

// collect every referenced bundle basename (values that look like a built .js file)
const refs = new Set();
for (const v of Object.values(manifest)) {
  if (typeof v === 'string' && /\.js$/.test(v)) refs.add(v.replace(/^.*\//, ''));
}
if (refs.size === 0) fail('build-manifest references no .js bundles — unexpected shape.');

for (const bundle of refs) {
  const rel = `${DIST}/${bundle}`;
  if (!existsSync(rel)) fail(`manifest references ${bundle} but it is MISSING on disk — prod would 404 (phantom/broken deploy).`);
  try { execSync(`git ls-files --error-unmatch ${rel}`, { stdio: 'ignore' }); }
  catch { fail(`manifest references ${bundle} but it is UNTRACKED in git — served != committed (phantom deploy). Commit the full dist state.`); }
}

console.log(`✓ dist atomicity: all ${refs.size} build-manifest-referenced bundles present on disk AND git-tracked (served==committed for every asset).`);
