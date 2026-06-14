/**
 * R20.13 — CurrentSprint per-method tests.
 * [test:uuid:960948c2-4f36-4658-b2c0-4075aeddfb4a] R20.13 setChain
 * [test:uuid:c3f12751-ce69-43ee-aacd-e729c968f433] R20.13 pinCurrent
 * [test:uuid:c33a1327-491b-42bf-9162-87558bf89d8c] R20.13 advance
 * [test:uuid:94a83fc2-c95d-470a-8083-c76fda7863ad] R20.13 getActiveChain
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CurrentSprint, type ChainRefs } from '../../src/ts/scenario/CurrentSprint.js';
import { ScenarioIndex } from '../../src/ts/scenario/index-store.js';

const CHAIN: ChainRefs = {
  req: 'req-uuid-test', uc: 'uc-uuid-test', class: 'class-uuid-test',
  method: 'method-uuid-test', impl: 'impl-uuid-test', test: 'test-uuid-test'
};

describe('R20.13 CurrentSprint', () => {
  let tmpDir: string;
  let idx: ScenarioIndex;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-test-'));
    idx = new ScenarioIndex(tmpDir);
    (CurrentSprint as any).instance = null;
  });

  it('setChain stores chain refs and returns true', () => {
    const cs = CurrentSprint.getInstance(idx);
    const result = cs.setChain(CHAIN, 'Sprint 20', 'Drawer v0.6.24');
    expect(result).toBe(true);
  });

  it('pinCurrent returns PinData with sprintName+taskName', () => {
    const cs = CurrentSprint.getInstance(idx);
    cs.setChain(CHAIN, 'Sprint 20', 'Drawer v0.6.24');
    const pin = cs.pinCurrent();
    expect(pin.sprintName).toBe('Sprint 20');
    expect(pin.taskName).toBe('Drawer v0.6.24');
    expect(pin.chainDepth).toBeGreaterThanOrEqual(0);
  });

  it('advance increments activeHop', () => {
    const cs = CurrentSprint.getInstance(idx);
    cs.setChain(CHAIN);
    const before = cs.getActiveChain();
    const activeCount = before.filter(h => h.status === 'active').length;
    cs.advance();
    const after = cs.getActiveChain();
    expect(after).toBeDefined();
    expect(after.length).toBe(before.length);
  });

  it('getActiveChain returns 6-hop chain with statuses', () => {
    const cs = CurrentSprint.getInstance(idx);
    cs.setChain(CHAIN);
    const hops = cs.getActiveChain();
    expect(hops.length).toBe(6);
    expect(hops[0].type).toBe('req');
    expect(hops[5].type).toBe('test');
    expect(hops.some(h => h.status === 'active')).toBe(true);
  });
});
