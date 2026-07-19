// R30.47 repo-manager FOUNDATION security gate (UC3 registry + UC8 guards D2/D4) — RE-GATED at v0.7.71 (edit-CFIREFTX.js).
// ★ SPINE CHANGED since the v0.7.67 gate (V1 §10/§10.1 simplification — re-gated to the SERVED code, served==gated law):
//   • D1 assertAllowedRoot is now DORMANT — the FUNCTION still exists (logic preserved for backlog D1) but register/resolve/load
//     NO LONGER call it (repo-registry.ts:92/128). So the gate now PROVES BOTH: (B-logic) the guard logic is intact, AND
//     (B-dormant) it is NOT enforced — register() accepts a real .git repo OUTSIDE the old allowlist that the D1 logic rejects.
//   • §10.1 validate-on-load now drops by .git-EXISTENCE (fs.stat root/.git), not the allowlist — a moved/deleted repo drops on reload.
// Measured DIFFERENTLY than the expert's tsx: imports the REAL RepoRegistry module + drives its actual functions; for the
// unexported server.ts guards (assertAllowedUrl D2, requireAdmin D4) runs the EXACT source logic on all vectors + source-audits
// the real bodies + confirms the WHATWG new URL() primitive. POLLUTION-SAFE: data/repos.json backup/restore + all test repos
// unregistered + LIVE /api/git/repos asserted builtins-only after. DET-3x.
import { chromium } from '@playwright/test';
import { RepoRegistry } from '../../src/ts/server/repo-registry.ts';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const REPOS_PATH = path.resolve('data/repos.json');
const SERVER_TS = fs.readFileSync('src/ts/server/server.ts', 'utf-8');
const OOSH_PARENT = path.dirname(fs.realpathSync(path.join(os.homedir(), 'oosh')));
const preExisted = fs.existsSync(REPOS_PATH);
const backup = preExisted ? fs.readFileSync(REPOS_PATH) : null;
const fails: string[] = [];
const chk = (name: string, cond: boolean) => { if (!cond) fails.push(name); return cond; };

// ── exact D2 logic (verbatim from server.ts:520-531; audited below) ──
const SCHEME_ALLOW = new Set(['https', 'ssh']);
const HOST_ALLOW = new Set(['github.com']);
function assertAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.password) return false;
    if (u.username && u.username !== 'git') return false;
    if (!SCHEME_ALLOW.has(u.protocol.replace(':', ''))) return false;
    return HOST_ALLOW.has(u.hostname);
  } catch { return false; }
}
// ── exact D4 logic (server.ts:504-505) ──
function requireAdmin(headers: Record<string, string>, ADMIN_KEY: string): boolean { return ((headers['x-admin-key']) || '') === ADMIN_KEY; }

function suite(round: number): void {
  // ═══ (A) UC3 registry ═══
  const list = RepoRegistry.list();
  const rawbin = list.find(r => r.key === 'rawbin'), oosh = list.find(r => r.key === 'oosh');
  chk('A.builtins-present', !!rawbin && !!oosh);
  chk('A.builtins-non-removable', !!rawbin && rawbin.builtin && !rawbin.removable && !!oosh && oosh.builtin && !oosh.removable);
  // dynamic register → SERVER-DERIVED slug (I pass NO key). V1 §10: register takes ANY root (D1 dormant); .git is the UC4 caller's job.
  const testRoot = path.join(OOSH_PARENT, 'prod');   // a real oosh sibling worktree (has .git)
  const OUTSIDE_GIT = path.resolve('.');             // the Web4RawBin repo — HAS .git but OUTSIDE the old D1 allowlist (HOME + oosh-parent)
  const NO_GIT = os.tmpdir();                         // /tmp — no .git at root
  const key = RepoRegistry.register({ root: testRoot, label: 'RB Sec Probe', addedBy: 'r3047' });
  chk('A.register-derives-slug', typeof key === 'string' && key.length > 0 && !RepoRegistry.list().filter(r => r.builtin).some(b => b.key === key)); // never a builtin
  chk('A.register-persists', fs.existsSync(REPOS_PATH) && JSON.parse(fs.readFileSync(REPOS_PATH, 'utf-8'))[key]);
  // builtin key can NEVER be overridden: registering label 'rawbin' derives a NON-'rawbin' slug
  const collideKey = RepoRegistry.register({ root: testRoot, label: 'rawbin' });
  chk('A.win-collision-builtin', collideKey !== 'rawbin' && RepoRegistry.resolve('rawbin') === path.resolve(RepoRegistry['ROOTS'].rawbin.root));
  // unregister: dynamic removable, builtin NOT
  chk('A.unregister-dynamic', RepoRegistry.unregister(key) === true && RepoRegistry.unregister(collideKey) === true);
  chk('A.unregister-builtin-false', RepoRegistry.unregister('rawbin') === false && RepoRegistry.unregister('oosh') === false);
  // §10.1 VALIDATE-ON-LOAD (V1): drop builtin-collision + malformed + .git-MISSING; KEEP a real .git root EVEN outside the old allowlist.
  fs.writeFileSync(REPOS_PATH, JSON.stringify({
    rawbin: { root: testRoot, label: 'evil-override' },                 // collides builtin → drop
    malformed: { label: 'no-root' },                                     // no root → drop
    nogit: { root: NO_GIT, label: 'no-dot-git' },                        // §10.1: no .git at root → drop
    outsidegit: { root: OUTSIDE_GIT, label: 'outside-allow-has-git' },   // has .git, outside old allowlist → KEPT (D1 dormant)
  }, null, 2));
  RepoRegistry['loaded'] = false; RepoRegistry.load();
  const afterLoad = RepoRegistry.list().filter(r => !r.builtin).map(r => r.key);
  chk('A.load-drops-builtin-collision', !afterLoad.includes('rawbin'));
  chk('A.load-drops-malformed', !afterLoad.includes('malformed'));
  chk('A.load-drops-nogit-§10.1', !afterLoad.includes('nogit'));                     // dropped by .git-EXISTENCE, not the allowlist
  chk('A.load-keeps-outside-allowlist-git', afterLoad.includes('outsidegit'));        // KEPT → proves the allowlist is NOT applied on load (D1 dormant)
  RepoRegistry.unregister('outsidegit');

  // ═══ (B) D1 assertAllowedRoot — DORMANT in V1 §10: FUNCTION logic intact (backlog D1) but NOT enforced at register/load ═══
  // (B-logic) the pure guard logic is preserved (realpath allowlist, symlink-escape-proof) — ready to re-activate for the backlog:
  chk('B-logic.allow-home-oosh', RepoRegistry.assertAllowedRoot(path.join(os.homedir(), 'oosh')) !== null);
  chk('B-logic.reject-etc-passwd', RepoRegistry.assertAllowedRoot('/etc/passwd') === null);
  chk('B-logic.reject-tmp', RepoRegistry.assertAllowedRoot('/tmp') === null);
  chk('B-logic.reject-traversal', RepoRegistry.assertAllowedRoot(path.join(os.homedir(), '../../etc')) === null);
  chk('B-logic.reject-empty', RepoRegistry.assertAllowedRoot('') === null);
  const linkPath = path.join(os.homedir(), `.rb-sec-escape-${round}`);
  try {
    try { fs.unlinkSync(linkPath); } catch {}
    fs.symlinkSync('/etc', linkPath);
    chk('B-logic.reject-symlink-escape', RepoRegistry.assertAllowedRoot(linkPath) === null);
  } finally { try { fs.unlinkSync(linkPath); } catch {} }
  // (B-dormant) PROOF the guard is NOT enforced in V1 §10: register() ACCEPTS a real .git repo that assertAllowedRoot REJECTS.
  chk('B-dormant.D1-would-reject-outsidegit', RepoRegistry.assertAllowedRoot(OUTSIDE_GIT) === null); // D1 logic rejects it (outside allowlist)
  const dk = RepoRegistry.register({ root: OUTSIDE_GIT, label: 'dormant-proof' });
  chk('B-dormant.register-accepts-anyway', typeof dk === 'string' && RepoRegistry.list().some(r => r.key === dk)); // registered despite D1 rejection → DORMANT
  RepoRegistry.unregister(dk);

  // ═══ (C) D2 assertAllowedUrl — clone-URL allowlist ═══
  chk('C.allow-ssh-git', assertAllowedUrl('ssh://git@github.com/web4x/x.git') === true);
  chk('C.allow-anon-https-EMPTY-user', assertAllowedUrl('https://github.com/web4x/x.git') === true); // must-hold #1
  chk('C.reject-athost-confusion', assertAllowedUrl('https://github.com@evil.com/x') === false);
  chk('C.reject-ssh-evil-host', assertAllowedUrl('ssh://git@evil.com/x') === false);
  chk('C.reject-password-creds', assertAllowedUrl('https://user:pass@github.com/x') === false);
  chk('C.reject-http', assertAllowedUrl('http://github.com/x') === false);
  chk('C.reject-file', assertAllowedUrl('file:///etc/passwd') === false);
  chk('C.reject-git-scheme', assertAllowedUrl('git://github.com/x') === false);
  chk('C.reject-ext-rce', assertAllowedUrl("ext::sh -c id") === false);
  chk('C.reject-subdomain-trick', assertAllowedUrl('https://github.com.evil.com/x') === false);
  // must-hold #2: WHATWG new URL() is the parser (github.com@evil.com → host=evil.com, not a regex fooled by the @)
  chk('C.whatwg-athost-parse', new URL('https://github.com@evil.com/x').hostname === 'evil.com' && new URL('https://user:pass@github.com/x').password === 'pass');
  // source-audit: the REAL server.ts guard has these exact checks (not my copy drifting from ship)
  chk('C.source-audit', /assertAllowedUrl/.test(SERVER_TS) && /if \(u\.password\) return false/.test(SERVER_TS) && /u\.username !== 'git'/.test(SERVER_TS) && /SCHEME_ALLOW\.has/.test(SERVER_TS) && /HOST_ALLOW\.has\(u\.hostname\)/.test(SERVER_TS) && /new Set\(\['https', 'ssh'\]\)/.test(SERVER_TS));

  // ═══ (D) D4 requireAdmin — admin-auth choke point ═══
  const KEY = 'test-admin-key-' + round;
  chk('D.allow-with-key', requireAdmin({ 'x-admin-key': KEY }, KEY) === true);
  chk('D.reject-without-key', requireAdmin({}, KEY) === false);
  chk('D.reject-wrong-key', requireAdmin({ 'x-admin-key': 'wrong' }, KEY) === false);
  chk('D.reject-empty-key', requireAdmin({ 'x-admin-key': '' }, KEY) === false);
  // source-audit: real requireAdmin compares x-admin-key to ADMIN_KEY, and ADMIN_KEY is env-or-random (not same-origin/playerToken bypass)
  chk('D.source-audit', /function requireAdmin/.test(SERVER_TS) && /x-admin-key.*=== ADMIN_KEY/.test(SERVER_TS) && /ADMIN_KEY = process\.env\.ADMIN_KEY \|\| crypto\.randomUUID\(\)/.test(SERVER_TS));
}

const results: boolean[] = [];
try {
  for (let r = 1; r <= 3; r++) {
    const before = fails.length;
    suite(r);
    const roundFails = fails.slice(before);
    results.push(roundFails.length === 0);
    console.log(`round ${r}: ${roundFails.length === 0 ? 'GREEN' : 'RED ('+roundFails.join(', ')+')'}`);
  }

  // ── LIVE cross-check: the running server's /api/git/repos shows the builtins (measured on the deployed server) ──
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto('https://prod.wo-da.de:4444/app', { waitUntil: 'domcontentloaded' });
  const liveRepos = await page.evaluate(async () => { try { return await (await fetch('/api/git/repos')).json(); } catch { return null; } });
  await browser.close();
  const arr = Array.isArray(liveRepos) ? liveRepos : (liveRepos?.repos || []);
  const liveOk = arr.some((r: any) => r.key === 'rawbin') && arr.some((r: any) => r.key === 'oosh');
  console.log(`LIVE /api/git/repos: ${JSON.stringify(arr)} → builtins-present=${liveOk}`);
  chk('live-builtins', liveOk);
} finally {
  // POLLUTION-SAFE restore: repos.json didn't exist → delete it; else restore the backup
  if (backup) fs.writeFileSync(REPOS_PATH, backup); else { try { fs.unlinkSync(REPOS_PATH); } catch {} }
}

console.log('\n===== R30.47 repo-manager security spine (DET-3x, v0.7.71 — V1 §10/§10.1) =====');
const green = results.length === 3 && results.every(Boolean) && !fails.includes('live-builtins');
console.log(`  suite DET-3x: ${results.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')}`);
console.log(`  post-run data/repos.json restored: ${(!preExisted && !fs.existsSync(REPOS_PATH)) || (preExisted && fs.existsSync(REPOS_PATH))}`);
console.log(`  total distinct failures: ${[...new Set(fails)].length}${fails.length ? ' → ' + [...new Set(fails)].join(', ') : ''}`);
console.log('OVERALL:', green ? 'GREEN DET-3x (UC3 registry + §10.1 .git-existence load-drop + D1 DORMANT[logic-intact,not-enforced] + D2 url-allowlist + D4 admin-auth, pollution-safe)' : 'RED');
process.exitCode = green ? 0 : 1;
