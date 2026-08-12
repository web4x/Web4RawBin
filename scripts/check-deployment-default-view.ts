/**
 * R40.11 slice-3 gate (AC-3 + AC-4 data contract). The drawer's ONE GENERIC type-driven default view renders a
 * unit's SCALAR FIELDS from /api/trace/children's `fields` (the M2 type determines which fields exist). This gate
 * asserts the DATA CONTRACT that makes the render possible + the fail-loud precondition — the browser pixel proof
 * (AC-5 @390) is the tester's device gate (never headless-green).
 *
 * Run: /opt/node22/bin/node --import tsx scripts/check-deployment-default-view.ts   (exits 1 on any failure)
 *
 * AC-3: every resolved deployment typed-unit yields ≥1 renderable scalar field beyond identity (so the generic
 *       view shows CONTENT, not an empty/Loading pane) INCLUDING its type-distinguishing field.
 * AC-4: an unresolvable ref resolves to NO unit → the view fail-louds (never a silent perpetual Loading).
 * stub-must-fail: the field-extraction MUST return empty for an identity-only unit (proves it can fail).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));

// MIRROR of the server extraction (server.ts /api/trace/children `fields`): scalar model fields minus identity.
const IDENTITY_FIELDS = new Set(['uuid', 'name', 'sourceFile', 'sourceLine']);
function scalarFields(model: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(model || {})) {
    if (IDENTITY_FIELDS.has(k) || v === null || v === undefined || v === '' || typeof v === 'object') continue;
    out[k] = String(v);
  }
  return out;
}

// The 5 slice-1 typed deployment units (ConfigFile/Service/KeyFile/EnvValue/Certificate) + their type-key.
const UNITS: Array<{ pfx: string; typeKey: string }> = [
  { pfx: '71bd2de9', typeKey: 'manifestsAs' }, // ConfigFile
  { pfx: 'fb4de69d', typeKey: 'configuredBy' }, // Service
  { pfx: '9a67e869', typeKey: 'manifestsAs' }, // KeyFile
  { pfx: 'b49a18ff', typeKey: 'fragment' },     // EnvValue
  { pfx: '0e6884ef', typeKey: 'manifestsAs' }, // Certificate
];

const fails: string[] = [];
const keys = [...idx.list()];
for (const { pfx, typeKey } of UNITS) {
  const key = keys.find(k => k.startsWith(pfx));
  if (!key) { fails.push(`typed unit ${pfx} MISSING from scenario/index (slice-1 regressed)`); continue; }
  const model = (idx.get(key)!.model || {}) as Record<string, unknown>;
  const f = scalarFields(model);
  if (Object.keys(f).length === 0) fails.push(`unit ${pfx} has NO renderable scalar field → generic view would show empty/Loading (AC-3)`);
  if (!(typeKey in f)) fails.push(`unit ${pfx} missing its type-distinguishing field '${typeKey}' (AC-3 type-driven)`);
}

// AC-4: an unresolvable ref must resolve to NO unit (→ client fail-louds, not silent Loading).
const BOGUS = 'depunit-unresolved-00000000-0000-0000-0000-000000000000';
if (idx.get(BOGUS)) fails.push(`AC-4: a bogus ref unexpectedly resolved to a unit`);

// stub-must-fail: the extraction MUST yield empty for an identity-only model (proves the AC-3 check can fail).
if (Object.keys(scalarFields({ uuid: 'x', name: 'y' })).length !== 0) fails.push(`stub-must-fail broken: identity-only model yielded fields`);

if (fails.length) {
  console.error('✗ check-deployment-default-view FAILED:');
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log(`✓ check-deployment-default-view PASS — ${UNITS.length} typed units yield type-driven scalar fields (AC-3); unresolvable→no-unit (AC-4); stub-must-fail holds.`);
