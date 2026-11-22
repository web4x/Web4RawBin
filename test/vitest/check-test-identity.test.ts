/**
 * R42.3 one-test-identity — chain: R42.3 → UC testIdentity.ensureSystemSession → TestIdentity.checkTestIdentity
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// @ts-expect-error — plain .mjs module without type declarations
import { checkTestIdentity } from '../../scripts/check-test-identity.mjs';

let dir = '';
const spec = (name: string, body: string) => fs.writeFileSync(path.join(dir, name), body);
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'identity-')); });
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

// [test:uuid:ec18036c-49a9-4f30-aee9-0e91129be62d] test:TestIdentity.checkTestIdentity
describe('R42.3 TestIdentity.checkTestIdentity', () => {
  it('passes a spec that logs in through loginAs only', () => {
    spec('ok.spec.ts', "await loginAs(page, 1);\nawait page.click('#pe-save');\n");
    expect(checkTestIdentity(dir)).toEqual([]);
  });

  it('flags per-name sign-up, fake device keys and user deletion', () => {
    spec('bad.spec.ts', "await ensureLobby(page, 'Foo');\nlocalStorage.setItem('k', 'e2e-bypass');\ncleanupTestUsers(/^Foo$/);\n");
    const f = checkTestIdentity(dir);
    expect(f).toHaveLength(3);
    expect(f.join('\n')).toMatch(/ensureLobby/);
  });

  it('flags a spec that signs a fresh visitor up, except the first-visit specs', () => {
    spec('rooms.spec.ts', "await page.fill('#pe-name', 'X');\nawait page.click('#pe-save');\n");
    spec('new-user.spec.ts', "await page.fill('#pe-name', 'X');\nawait page.click('#pe-save');\n");
    expect(checkTestIdentity(dir)).toEqual(['rooms.spec.ts — signs a fresh visitor up; log in with loginAs(page, 1|2) instead']);
  });

  it('the real test/e2e suite is clean', () => {
    expect(checkTestIdentity(path.resolve(__dirname, '../e2e'))).toEqual([]);
  });
});
