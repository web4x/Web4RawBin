/**
 * R42.4 — the server's scenario location is configurable, so the isolated e2e server never writes the repo.
 */
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { scenarioRoot } from '../../src/ts/server/scenario-root.js';

describe('R42.4 scenarioRoot', () => {
  it('defaults to the repo scenario/ folder', () => {
    expect(scenarioRoot({})).toBe(path.resolve(__dirname, '../../scenario'));
  });
  it('honours RAWBIN_SCENARIO_ROOT (resolved to an absolute path)', () => {
    expect(scenarioRoot({ RAWBIN_SCENARIO_ROOT: '/tmp/x-scenario' })).toBe('/tmp/x-scenario');
    expect(path.isAbsolute(scenarioRoot({ RAWBIN_SCENARIO_ROOT: 'rel/dir' }))).toBe(true);
  });
  it('no server module hard-codes ../../../scenario/index any more', async () => {
    const fs = await import('node:fs');
    for (const f of ['server.ts', 'FeatureManager.ts', 'RoomKeys.ts']) {
      const src = fs.readFileSync(path.resolve(__dirname, '../../src/ts/server', f), 'latin1');
      expect(src, f).not.toMatch(/'\.\.\/\.\.\/\.\.\/scenario\/index'/);
    }
  });
});
