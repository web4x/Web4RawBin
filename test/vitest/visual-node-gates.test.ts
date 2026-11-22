/**
 * R42.4 visual-triage: the test/visual gates that need NO browser, NO WebSocket and NO server are unit checks in
 * disguise. They run here, inside the unit suite (and so in CI), each as its own child process; a gate is green when
 * it exits 0. Browser/server gates are triaged separately (test/visual/TRIAGE.md).
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');
export const NODE_GATES = [
  'r-test-room-single-source-lint.mjs',
  'r3018-requirements-view-gate.mjs',
  'r3720-inc1-verb-dispatch-lint.mjs',
  'r3736-qa-switch-state-lint.mjs',
  'r405-dedup-facet-gate.mjs',
  'r4050-sprint-order-invariant.mjs',
  'r4055-boot-currency-gate.mjs',
  'r4057-bareuuid-property.mjs',
  'r4059-badge-glyph-single-source-lint.mjs',
  'r4081-one-physical-store-lint.mjs',
  'r4081d-splitbrain-write-lint.mjs',
  'r4081t3720-openclosed-lint.mjs',
  'r4081t3720-render-openclosed-lint.mjs',
  'r4084-render-ownership-lint.mjs',
  'rc2-reconcile-all-write-gate.mjs',
  'rc2b-prune-orphans-gate.mjs',
  'rdiagram-addview-strip-gate.mjs',
  'marker-reconcile.ts',
  'r318fm-server-gate.ts',
  'r3211v-viewkind-facet-gate.ts',
  'r322-ts-to-model-gate.ts',
  'r325-golive-oracle-gate.ts',
  'r326-edges-gate.ts',
  'r327-puml-roundtrip-gate.ts',
  'r3741-selfheal-onread-gate.ts',
  'r3742-unit-controller-gate.ts',
  'r3743c-orphaned-verdict-scan.ts',
  'r376-autoregen-oncommit-gate.ts',
  'r401-resolvecr-gate.ts',
  'r4018b-stale-steer-log-gate.ts',
  'r401d-rollup-parent-gate.ts',
  'r402-deployment-node-gate.ts',
  'r4037-context-actions-gate.ts',
  'r4059-actions-applicability-gate.ts',
  'r406-buildtypedmodel-gate.ts',
  'r40x-pin-derivation-gate.ts',
  'rc1-sprintpin-resolver-gate.ts',
  'rc1refine-frozen-cancelled-metabite.ts',
  'rc3-consistency-guard-metabite.ts',
  'rc5-taskstatus-bite-gate.ts',
  'rc7-migrate-board-bite-gate.ts',
  'rc7b-provecomplete-failclosed-bite-gate.ts',
  'rc7c-atomicity-scope-bite-gate.ts',
  'rc7e-extractids-prose-crossref-bite.ts',
  'rc7f-narrative-preservation-bite.ts',
  'rcd-singularchain-excludes-gate.ts',
  'rcd-templates-bug-changerequest-gate.ts',
];

// [test:uuid:40c7c11b-8efb-48a6-8739-2c75bbad87fe] R42.4 visual node gates run in the unit suite
describe('CiWorkflow.visualNodeGates — R42.4 test/visual node-only gates', () => {
  it.each(NODE_GATES)('%s exits 0', (gate) => {
    const r = spawnSync('npx', ['tsx', path.join('test/visual', gate)], { cwd: ROOT, encoding: 'utf8', timeout: 110_000 });
    if (r.status !== 0) console.error(`--- ${gate} ---\n${(r.stdout || '').slice(-2000)}\n${(r.stderr || '').slice(-2000)}`);
    expect(r.status, gate).toBe(0);
  }, 120_000);
});
