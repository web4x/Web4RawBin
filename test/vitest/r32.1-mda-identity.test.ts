/**
 * R32.1 — MDA identity gate (the 5 correct-by-construction assertions over the M3/M2 seed).
 * [test:uuid:75e525ad-c016-4487-811e-5d9f7a7c1119] R32.1 identity-gate (multi-impl: ModelValidator.validate
 *   4d0883ad-d3a6-4663-97ce-ea8defb207e0 + SeedMdaModel.seedModel f65c9b50-8577-4f2c-b53e-361108149d6a)
 *
 * Three gates, MEASURED (not invented):
 *   A. validate(seed) = 0 violations         → the seeded M3/M2 model is identity-clean.
 *   B. planted M1→M3 skip → level-integrity   → the gate BITES (a bad unit is rejected).
 *   C. seedModel() re-run = 0 written          → idempotent (pinned UUIDs; the 0-churn determinism law).
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModelValidator, type UnitIndex } from '../../src/ts/scenario/ModelValidator.js';
import { seedModel } from '../../scripts/seed-mda-model.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SHARD = path.join(REPO, 'scenario/index/a/1/d/2/e'); // all ior:class:ModelElement seed units live here

function diskIndex(): UnitIndex {
  const units = new Map<string, { ior?: string; model?: Record<string, unknown> }>();
  for (const f of fs.readdirSync(SHARD)) {
    if (!f.endsWith('.scenario.json')) continue;
    const u = JSON.parse(fs.readFileSync(path.join(SHARD, f), 'utf-8'));
    if (u.ior === 'ior:class:ModelElement') units.set(String(u.model.uuid), u);
  }
  return { list: () => [...units.keys()], get: (uuid) => units.get(uuid) || null };
}

describe('R32.1 MDA identity gate', () => {
  it('A: validate(seed) has ZERO violations (seeded M3/M2 model is identity-clean)', () => {
    const v = new ModelValidator().validate(diskIndex());
    expect(v).toEqual([]);
  });

  it('B: a planted M1→M3 skip is REJECTED (level-integrity bites)', () => {
    const idx = diskIndex();
    const units = new Map<string, { ior?: string; model?: Record<string, unknown> }>(idx.list().map((u) => [u, idx.get(u)!]));
    const bad = 'b0000000-0000-4000-8000-000000000099';
    units.set(bad, { ior: 'ior:class:ModelElement', model: { uuid: bad, name: 'BadSkip', metaLevel: 'M1', kind: 'class', instanceOf: ['ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000001'], instances: [] } });
    const planted: UnitIndex = { list: () => [...units.keys()], get: (u) => units.get(u) || null };
    const v = new ModelValidator().validate(planted).filter((x) => x.uuid === bad);
    expect(v.length).toBeGreaterThan(0);
    expect(v.some((x) => x.assertion === 'level-integrity')).toBe(true);
  });

  it('C: seedModel() is idempotent — a re-run writes ZERO files (pinned-UUID determinism)', () => {
    expect(seedModel()).toBe(0); // units already committed → nothing written/changed
  });

  it('has 19 seed units (2 M3 reflexive + 17 M2)', () => {
    const idx = diskIndex();
    expect(idx.list().length).toBe(19);
  });
});
