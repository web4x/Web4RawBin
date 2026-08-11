/**
 * R40.22 — STANDING INVARIANT: no tracked path string embeds a CREDENTIAL (auth-accepted token).
 * Composes with trace-pii-guard: pii-guard catches a token in a FIELD; this catches one in a PATH string
 * (e.g. unitLinks `../data/users/<token>/…`). A never-auth `storageId` in a path is fine — the criterion
 * is "is this segment a value that can AUTHENTICATE", not "is it uuid-shaped" (storageId is uuid-shaped too).
 *
 * Run: /opt/node22/bin/node --import tsx scripts/check-no-credential-path.ts   (exits 1 on any finding)
 *
 * Value-blind output: counts only, never a token value (same discipline as pii-guard).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAP_PATH = path.join(ROOT, 'data', 'token-storage-map.json');
const bare = (s: string) => String(s || '').replace('ior:instance:', '').split('@')[0];
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
const all = [...idx.list()].map(k => ({ k, u: idx.get(k)! })).filter(x => x.u);

// Credential token-set = every value that can AUTHENTICATE: Device/Room ownerToken, File/WebItem
// uploaderToken/ownerToken, User token, + the tokenToStorageId KEYS (raw tokens) if the map is present.
const creds = new Set<string>();
for (const { u } of all) {
  const m: any = u.model || {};
  for (const f of ['ownerToken', 'uploaderToken', 'token']) {
    const v = bare(m[f]); if (v && v.length === 36) creds.add(v);
  }
}
try { for (const t of Object.keys(JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8')))) creds.add(t); } catch { /* map optional */ }

// Scan every tracked unit's path-bearing strings (unitLinks + any string field containing data/users/)
const SEG = /data\/users\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//gi;
let scanned = 0, pathSegs = 0, credInPath = 0;
const offendingUnits = new Set<string>();
for (const { k, u } of all) {
  const m: any = u.model || {};
  const strings: string[] = [];
  const collect = (v: any) => {
    if (typeof v === 'string') strings.push(v);
    else if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === 'object') Object.values(v).forEach(collect);
  };
  collect(m);
  for (const s of strings) {
    let mm: RegExpExecArray | null;
    SEG.lastIndex = 0;
    while ((mm = SEG.exec(s))) { pathSegs++; if (creds.has(mm[1])) { credInPath++; offendingUnits.add(k); } }
  }
  scanned++;
}

console.log(`check-no-credential-path: ${scanned} tracked units, ${pathSegs} data/users/<uuid>/ path segments, credential-set size ${creds.size}`);
if (credInPath) {
  console.error(`✗ ${credInPath} path segment(s) embed a CREDENTIAL (auth token) across ${offendingUnits.size} unit(s) — must be a never-auth storageId. RED.`);
  process.exit(1);
}
console.log(`✓ no tracked path embeds a credential (all data/users/ segments are never-auth storageIds or none present).`);
