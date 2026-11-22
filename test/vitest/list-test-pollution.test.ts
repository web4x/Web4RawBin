/**
 * R42.1 no-prod-pollution — chain: R42.1 → UC testPollution.list → TestPollution.listTestPollution
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// @ts-expect-error — plain .mjs module without type declarations
import { listTestPollution, SYSTEM_TESTER } from '../../scripts/list-test-pollution.mjs';

const REAL = '0a0a0a0a-0000-4000-8000-000000000001';
const TEMP = '0a0a0a0a-0000-4000-8000-000000000002';
let dir = '';
const room = (owner: string, id: string, name: string) => {
  const d = path.join(dir, 'users', owner, 'rooms', id);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'room.json'), JSON.stringify({ ior: 'ior:class:Room', model: { name, state: 'active', createdAt: '2026-11-22T10:00:00Z' } }));
};

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pollution-'));
  fs.writeFileSync(path.join(dir, 'profiles.json'), JSON.stringify([
    { token: SYSTEM_TESTER, name: 'SystemTester', profileCommitted: true },
    { token: REAL, name: 'Alice', profileCommitted: true },
    { token: TEMP, profileCommitted: false },
  ]));
  room(SYSTEM_TESTER, 'r-sys', 'Anything');
  room(REAL, 'r-real', 'Alice Room');
  room(REAL, 'r-e2e', 'E2E-Room');
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

// [test:uuid:9e705ae9-0038-4abc-9783-01dc51c8148a] test:TestPollution.listTestPollution
describe('R42.1 TestPollution.listTestPollution', () => {
  it('lists SystemTester and unnamed uncommitted users, never a real user', () => {
    const { users } = listTestPollution(dir);
    expect(users.map((u: { token: string }) => u.token).sort()).toEqual([SYSTEM_TESTER, TEMP].sort());
  });

  it('lists rooms owned by test users or with test names, keeps real rooms out', () => {
    const ids = listTestPollution(dir).rooms.map((r: { id: string }) => r.id).sort();
    expect(ids).toEqual(['r-e2e', 'r-sys']);
  });

  it('is read-only: the data dir is unchanged after a run', () => {
    const snap = () => fs.readdirSync(dir, { recursive: true }).sort().join('\n');
    const before = snap();
    listTestPollution(dir);
    expect(snap()).toBe(before);
  });
});
