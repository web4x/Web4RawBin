/**
 * R42.4 visual-triage: the test/visual gates that talk to a server, need no browser, use only SystemTester (or no
 * identity at all) and are green against an isolated server. They run here, against the e2e suite's own isolated
 * server (https://localhost:4445, the default target of test/visual/_target.mjs), each as its own child process;
 * a gate is green when it exits 0. Everything else in test/visual is listed in test/visual/TRIAGE.md.
 */
import { test, expect } from './fixtures';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve('.'); // playwright runs from the repo root
export const SERVER_GATES = [
  'r224-clickable-png-gate.mjs',
  'r259-t261-federated-ior-gate.mjs',
  'r307-uniform-ref-guard-gate.mjs',
  'r364-trace-mechanism-gate.ts',
  'r40106-fixa-zero-vanished-probe.mjs',
  'r40106-inc7-delete-baseline-gate.mjs',
  'r88df8e4e-webitem-repair-gate.mjs',
  'rsw-post-cache-gate.mjs',
];

// [test:uuid:2e73d7f3-aaff-4b06-98e0-22d5a764be95] R42.4 visual server gates run in the e2e suite
test.describe('CiWorkflow.visualServerGates — R42.4 test/visual server gates (isolated server)', () => {
  for (const gate of SERVER_GATES) {
    test(gate, () => {
      const r = spawnSync('npx', ['tsx', path.join('test/visual', gate)], {
        cwd: ROOT, encoding: 'utf8', timeout: 90_000,
        env: { ...process.env, RAWBIN_TARGET: 'local' },
      });
      expect(r.status, `${gate} exited ${r.status}\n${(r.stdout || '').slice(-1500)}\n${(r.stderr || '').slice(-1500)}`).toBe(0);
    });
  }
});
