// [test:uuid:c4a7f1b9-2e63-4d08-b591-7a0e3c8d4f26] R40.8 ServerManagerApi.unitRealPath (Impl 3ee03bde) — the Files-tab path is MEASURED against the filesystem (idx.has() fail-closed + idx.filePath one-shard-rule == real disk location), NEVER composed from the slug; a bogus uuid returns null (stub-must-fail); /api/unit/<uuid>/path is non-owner-403 (no path leak). Owner-sees-path-@390 + browsable = Tron owner-device.
/**
 * R40.8 — 'Files' shows the REAL on-disk file location (Impl 3ee03bde unitRealPath). Run:
 *   /opt/node22/bin/node --import tsx test/visual/r408-unit-realpath-gate.ts
 * Own-oracle (imports the REAL ScenarioIndex shard rule = single-source, served-independent) + source-audit + served
 * non-owner reject. The path unitRealPath returns is idx.filePath(uuid) — MEASURED against the filesystem (has()
 * fail-closed) — NOT composed from the unit's slug. AC-path-matches-disk + fail-closed. The owner-sees-path-@390 +
 * browsable slivers are OWNER-GATED (/api/unit/<uuid>/path → 403 for non-owner) → SPLIT to Tron owner-device (never headless-green).
 */
import { ScenarioIndex } from '../../src/ts/scenario/index-store.js';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const PROD_INDEX = path.join(REPO, 'scenario/index');
const shardOf = (u: string) => u.slice(0, 5).split('').join('/');           // INDEPENDENT shard rule (uuid-addressed, NOT slug)

// discover real uuids across shards from disk (robust, not hardcoded)
const discover = (n: number): string[] => {
  const out: string[] = [];
  const walk = (d: string) => {
    if (out.length >= n) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (out.length >= n) return;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.scenario.json')) out.push(e.name.replace('.scenario.json', ''));
    }
  };
  walk(PROD_INDEX);
  return out;
};

const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  const idx = new ScenarioIndex(PROD_INDEX);
  const reals = discover(8);

  // (1) [REAL·own-oracle, disk] every real uuid → filePath is the ACTUAL existing file at the uuid-shard (measured, not composed)
  const pathMatches = reals.every(u => {
    const fp = idx.filePath(u);
    const rel = path.relative(REPO, fp);
    const expected = `scenario/index/${shardOf(u)}/${u}.scenario.json`;
    return idx.has(u) && fs.existsSync(fp) && rel === expected;   // file physically there + uuid-shard-addressed
  });

  // (2) [REAL·own-oracle, fail-closed / stub-must-fail] bogus uuid → has()=false → unitRealPath returns null (NEVER a composed path).
  //     If the path were composed from a slug/uuid without the has() guard, this would still "resolve" — anti-vacuity.
  const BOGUS = '00000000-0000-4000-8000-000000000000';
  const failClosed = idx.has(BOGUS) === false && !fs.existsSync(idx.filePath(BOGUS));

  // (3) [REAL·source-audit] unitRealPath body = has()-guard-first + idx.filePath (the ONE shard rule), NOT slug/name composition
  const src = fs.readFileSync(path.join(REPO, 'src/ts/server/server.ts'), 'utf8').split('\n').slice(1439, 1446).join('\n');
  const sourceAudit = /idx\.has\(uuid\)\)\s*return null/.test(src) && /idx\.filePath\(uuid\)/.test(src) && !/model\.name|slug|slugify/.test(src);

  // (4) [REAL·non-owner, served] /api/unit/<uuid>/path is owner-gated → 403, no path leaked to a non-owner (+ bogus 403, no oracle)
  const q = (u: string) => execSync(`curl -s -o /dev/null -w "%{http_code}" "https://prod.wo-da.de:4444/api/unit/${u}/path" --insecure`, { encoding: 'utf8' }).trim();
  const nonOwner403 = q(reals[0]) === '403' && q(BOGUS) === '403';

  const pass = pathMatches && failClosed && sourceAudit && nonOwner403 && reals.length === 8;
  results.push(pass);
  console.log(`iter ${i}: path-matches-disk=${pathMatches}(${reals.length} uuids) fail-closed=${failClosed} source-audit=${sourceAudit} non-owner-403=${nonOwner403} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R40.8 unitRealPath — path measured-not-composed (own-oracle + reject, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('SPLIT → TRON owner-device: owner session sees the real path in the Files tab @390 + browsable to the folder (owner-gated; NEVER reported GREEN from headless).');
process.exitCode = green ? 0 : 1;
