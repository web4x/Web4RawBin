/**
 * [test:uuid:3b6b7389-3525-42db-94c4-b67a4c7d1789] R42.4 CiWorkflow.runSuites — a suite is green only if it passes AND leaves the tree clean
 */
import { describe, it, expect } from 'vitest';
import { runSuites, SUITES } from '../../scripts/ci-suites.mjs';

const statusSeq = (...snaps: string[][]) => { let i = 0; return () => snaps[Math.min(i++, snaps.length - 1)]; };

describe('R42.4 CiWorkflow.runSuites', () => {
  it('runs the named suite command and is ok when it passes with an unchanged tree', () => {
    const calls: string[] = [];
    const r = runSuites('unit', { run: (c, a) => { calls.push([c, ...a].join(' ')); return 0; }, status: statusSeq([' M x'], [' M x']) });
    expect(calls).toEqual(['npm test']);
    expect(r).toMatchObject({ suite: 'unit', code: 0, dirtied: [], ok: true });
  });

  it('is NOT ok when a passing run leaves new changes in the tree (reports only the new lines)', () => {
    const r = runSuites('e2e', { run: () => 0, status: statusSeq([' M x'], [' M x', ' M README.md', '?? scenario/alt/phone/p.json']) });
    expect(r.ok).toBe(false);
    expect(r.dirtied).toEqual([' M README.md', '?? scenario/alt/phone/p.json']);
  });

  it('passes extra args after -- and propagates a failing exit code', () => {
    let seen = '';
    const r = runSuites('e2e', { run: (c, a) => { seen = a.join(' '); return 3; }, status: () => [], extraArgs: ['--trace', 'off'] });
    expect(seen).toBe('run test:e2e -- --trace off');
    expect(r).toMatchObject({ code: 3, ok: false });
  });

  it('rejects an unknown suite and knows exactly unit + e2e', () => {
    expect(() => runSuites('visual', { run: () => 0, status: () => [] })).toThrow(/unknown suite/);
    expect(Object.keys(SUITES)).toEqual(['unit', 'e2e']);
  });
});
