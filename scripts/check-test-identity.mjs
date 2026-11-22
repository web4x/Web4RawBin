#!/usr/bin/env node
// R42.3 one-test-identity guard (Tron 2026-11-22: "two test users are acceptable, random temp user
// creation is not"). E2E specs log in ONLY as SystemTester / SystemTester2 via test/e2e/identities.ts.
// FAILS on: the removed per-name sign-up helper, fake 'e2e-bypass' device keys, deleting users, or a
// spec that drives the sign-up gate (#pe-save on a fresh visitor) outside the first-visit allowlist.
// Usage: node scripts/check-test-identity.mjs [dir]   (default test/e2e)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Specs whose SUBJECT is the first-visit sign-up flow itself — the only place a fresh visitor signs up.
export const FIRST_VISIT_SPECS = new Set(['new-user.spec.ts', 'device-enrollment.spec.ts', 'negative-cases.spec.ts', 'returning-user-unlock.spec.ts']);
const RULES = [
  { re: /\bensureLobby\s*\(/, why: 'ensureLobby() minted a new user per name — use loginAs(page, 1|2)' },
  { re: /e2e-bypass/, why: "fake 'e2e-bypass' device keys — the testers carry real keys" },
  { re: /\bcleanupTestUsers\s*\(/, why: 'specs never delete users — the two testers are fixed' },
];

// [impl:uuid:a724a5c4-3d90-4159-88c7-5b4e204c9856] TestIdentity.checkTestIdentity
export function checkTestIdentity(dir) {
  const findings = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.spec.ts')).sort()) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    src.split('\n').forEach((line, i) => {
      for (const r of RULES) if (r.re.test(line)) findings.push(`${f}:${i + 1} — ${r.why}`);
    });
    const signsUp = /#pe-save/.test(src) && !/\bloginAs\s*\(/.test(src);
    if (signsUp && !FIRST_VISIT_SPECS.has(f)) findings.push(`${f} — signs a fresh visitor up; log in with loginAs(page, 1|2) instead`);
  }
  return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] || 'test/e2e';
  const findings = checkTestIdentity(dir);
  if (findings.length) {
    console.error(`FAIL: ${findings.length} test-identity violation(s) in ${dir}:`);
    for (const x of findings) console.error('  ' + x);
    process.exit(1);
  }
  console.log(`PASS: e2e specs use only SystemTester / SystemTester2 (${dir})`);
}
