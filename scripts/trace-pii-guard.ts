/**
 * trace-pii-guard (design aff9bd973 / f051f44b9) — REPORT-ONLY-LOUD (Step 1). Field-level credential/PII exposure sweep
 * over ALL TRACKED scenario units. Derives scope by PATTERN over field NAMES (PO ruling: stop working from a list — an
 * enumerated list has been wrong 4× tonight; a pattern finds the field nobody thought of, e.g. uploaderToken). Prints
 * field-name + count + ior-type breakdown per bucket, CREDENTIAL loudest.
 *
 * ★ ABSOLUTE: field NAME + COUNT only — a VALUE (token/ip/phone/key/body) is NEVER printed. Read-only (git metadata +
 * ior/field parse), NO prod mutation, NO chokepoint (R40.31). MODE='report' → always exit 0 (blocks nobody). Step 2
 * (git rm --cached + MODE='block') is HELD for Tron GO.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MODE: 'report' | 'block' = 'report'; // Step-1 committed constant. Flip to 'block' ONLY in Step 2 on Tron GO.
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// Field-NAME patterns (semantic buckets). Value-blind — we classify by the KEY, never inspect the value.
const BUCKETS: { name: string; sev: string; re: RegExp }[] = [
  { name: 'CREDENTIAL (rotate)', sev: '🔴', re: /token|secret|credential|password|passwd|apikey|api_key|bearer|sessionid|session_id/i },
  { name: 'KEY (public halves — note)', sev: '🟠', re: /publickey|public_key|privatekey|private_key|pubkey|sshkey|ssh_key/i },
  { name: 'PII', sev: '🟡', re: /(^|_)ip$|ip_?addr|ipaddress|phone|email|(^|_)body$|address|(^|_)lat(itude)?$|(^|_)lon(gitude)?$|(^|_)geo/i },
];
function bucketOf(field: string): number { return BUCKETS.findIndex((b) => b.re.test(field)); }

// Tracked scenario units only (git ls-files = the PUBLIC surface; untracked local mints are out of the leak).
const tracked = execSync('git ls-files scenario', { cwd: ROOT, encoding: 'utf-8', maxBuffer: 1 << 26 })
  .split('\n').filter((f) => f.endsWith('.scenario.json'));

// bucketIdx → fieldName → { count, types:Map<iorType,count> }
const agg: Map<string, { count: number; types: Map<string, number> }>[] = BUCKETS.map(() => new Map());
let scanned = 0;
for (const rel of tracked) {
  let unit: any; try { unit = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf-8')); } catch { continue; }
  scanned++;
  const type = String(unit.ior || '').replace('ior:class:', '') || '?';
  const model = unit.model && typeof unit.model === 'object' ? unit.model : {};
  for (const [field, val] of Object.entries(model)) {
    if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) continue; // POPULATED only
    const bi = bucketOf(field);
    if (bi < 0) continue;
    const m = agg[bi];
    const e = m.get(field) ?? { count: 0, types: new Map() };
    e.count++; e.types.set(type, (e.types.get(type) ?? 0) + 1);
    m.set(field, e);
  }
}

console.log(`\n=== trace-pii-guard (MODE=${MODE}, REPORT-ONLY-LOUD) — ${scanned} tracked scenario units swept ===`);
console.log(`(field NAME + COUNT only — values are NEVER printed)`);
let credTotal = 0;
BUCKETS.forEach((b, bi) => {
  const entries = [...agg[bi].entries()].sort((a, c) => c[1].count - a[1].count);
  const bucketTotal = entries.reduce((s, [, e]) => s + e.count, 0);
  if (b.name.startsWith('CREDENTIAL')) credTotal = bucketTotal;
  console.log(`\n${b.sev} ${b.name} — ${bucketTotal} populated field-instances across ${entries.length} field name(s):`);
  for (const [field, e] of entries) {
    const types = [...e.types.entries()].sort((a, c) => c[1] - a[1]).map(([t, n]) => `${t}:${n}`).join(', ');
    console.log(`    ${field} = ${e.count}   [${types}]`);
  }
  if (!entries.length) console.log('    (none)');
});
console.log(`\n🔴 CREDENTIAL rotation scope (loudest) = ${credTotal} populated credential-field instances on the public surface.`);
process.exit(0); // report mode: block nobody
