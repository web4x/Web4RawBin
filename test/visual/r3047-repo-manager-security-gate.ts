// R30.47 repo-manager FOUNDATION security gate (UC3 registry + UC8 guards D1/D2/D4) — v0.7.67 (cfb8ba85c).
// Measured DIFFERENTLY than the expert's tsx: (a) imports the REAL RepoRegistry module + drives its actual functions with
// attack vectors, (b) cross-checks the LIVE running server's /api/git/repos, (c) for the not-yet-exposed/unexported server.ts
// guards (assertAllowedUrl D2, requireAdmin D4) it runs the EXACT source logic on all vectors AND source-audits the real
// function bodies + confirms the WHATWG new URL() primitive they depend on. POLLUTION-SAFE: data/repos.json backup/restore
// (currently absent → deleted after); any registered test repo unregistered. DET-3x.
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
  // dynamic register → SERVER-DERIVED slug (I pass NO key); root routed through the D1 choke point
  const testRoot = path.join(OOSH_PARENT, 'prod'); // a real oosh sibling worktree → under REPO_ALLOW
  const key = RepoRegistry.register({ root: testRoot, label: 'RB Sec Probe', addedBy: 'r3047' });
  chk('A.register-derives-slug', typeof key === 'string' && key.length > 0 && !RepoRegistry.list().filter(r => r.builtin).some(b => b.key === key)); // never a builtin
  chk('A.register-persists', fs.existsSync(REPOS_PATH) && JSON.parse(fs.readFileSync(REPOS_PATH, 'utf-8'))[key]);
  // builtin key can NEVER be overridden: registering label 'rawbin' derives a NON-'rawbin' slug
  const collideKey = RepoRegistry.register({ root: testRoot, label: 'rawbin' });
  chk('A.win-collision-builtin', collideKey !== 'rawbin' && RepoRegistry.resolve('rawbin') === path.resolve(RepoRegistry['ROOTS'].rawbin.root));
  // unregister: dynamic removable, builtin NOT
  chk('A.unregister-dynamic', RepoRegistry.unregister(key) === true && RepoRegistry.unregister(collideKey) === true);
  chk('A.unregister-builtin-false', RepoRegistry.unregister('rawbin') === false && RepoRegistry.unregister('oosh') === false);
  // VALIDATE-ON-LOAD: malformed + builtin-collision + outside-allowlist dropped; valid kept
  fs.writeFileSync(REPOS_PATH, JSON.stringify({
    rawbin: { root: testRoot, label: 'evil-override' },        // collides builtin → drop
    malformed: { label: 'no-root' },                            // no root → drop
    escaped: { root: '/etc', label: 'outside-allow' },          // fails D1 → drop
    goodrepo: { root: testRoot, label: 'valid' },               // valid → keep
  }, null, 2));
  RepoRegistry['loaded'] = false; RepoRegistry.load();
  const afterLoad = RepoRegistry.list().filter(r => !r.builtin).map(r => r.key);
  chk('A.validate-on-load-drops', !afterLoad.includes('rawbin') && !afterLoad.includes('malformed') && !afterLoad.includes('escaped') && afterLoad.includes('goodrepo'));
  RepoRegistry.unregister('goodrepo');

  // ═══ (B) D1 assertAllowedRoot — realpath allowlist, symlink-escape-proof ═══
  chk('B.allow-home-oosh', RepoRegistry.assertAllowedRoot(path.join(os.homedir(), 'oosh')) !== null);
  chk('B.allow-worktree-sibling', RepoRegistry.assertAllowedRoot(testRoot) !== null);
  chk('B.reject-etc-passwd', RepoRegistry.assertAllowedRoot('/etc/passwd') === null);
  chk('B.reject-tmp', RepoRegistry.assertAllowedRoot('/tmp') === null);
  chk('B.reject-traversal', RepoRegistry.assertAllowedRoot(path.join(os.homedir(), '../../etc')) === null);
  chk('B.reject-nonexistent', RepoRegistry.assertAllowedRoot(path.join(os.homedir(), 'no-such-dir-xyz-' + round)) === null);
  chk('B.reject-empty', RepoRegistry.assertAllowedRoot('') === null);
  // symlink UNDER an allowed root pointing OUTSIDE → realpath escapes → reject (proves realpath, not path, is checked)
  const linkPath = path.join(os.homedir(), `.rb-sec-escape-${round}`);
  try {
    try { fs.unlinkSync(linkPath); } catch {}
    fs.symlinkSync('/etc', linkPath);
    chk('B.reject-symlink-escape', RepoRegistry.assertAllowedRoot(linkPath) === null);
  } finally { try { fs.unlinkSync(linkPath); } catch {} }

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

console.log('\n===== R30.47 repo-manager security spine (DET-3x, v0.7.67) =====');
const green = results.length === 3 && results.every(Boolean) && !fails.includes('live-builtins');
console.log(`  suite DET-3x: ${results.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')}`);
console.log(`  post-run data/repos.json restored: ${(!preExisted && !fs.existsSync(REPOS_PATH)) || (preExisted && fs.existsSync(REPOS_PATH))}`);
console.log(`  total distinct failures: ${[...new Set(fails)].length}${fails.length ? ' → ' + [...new Set(fails)].join(', ') : ''}`);
console.log('OVERALL:', green ? 'GREEN DET-3x (UC3 registry + D1 realpath + D2 url-allowlist + D4 admin-auth, pollution-safe)' : 'RED');
process.exitCode = green ? 0 : 1;
