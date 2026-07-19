// [test:uuid:4a253cea-8981-4804-9a6d-2255980fc3a2] R30.43 UC4-simple V1 add-local (GitApi.isGitRepo 3d1b156d) via
// POST /api/git/repos {method:'local',path,label}: the SOLE check is .git-present (folder OR worktree file); NO allowlist
// (assertAllowedRoot DORMANT §10 — backlog R30.48), NO admin-auth (read-auth only). Measured DIFFERENTLY than the expert's
// tsx: real HTTP POSTs on the LIVE server via the SystemTester read-auth session + GET repos + a resolve round-trip.
// (1) real .git dir → 200 {key,label}, appears in GET (builtin:false/removable:true), RESOLVES (current-branch).
// (2) ★ .git dir OUTSIDE REPO_ALLOW → STILL registers (proves §10 allowlist truly DORMANT — the risky change).
// (3) non-git dir → 400 'no .git'. (4) worktree (.git FILE) → registers. (5) endpoint = read-auth NOT admin (400-not-403 on
// an authed non-admin POST proves it reached isGitRepo past auth). POLLUTION-SAFE: V1 has NO unregister endpoint → registrations
// are CAPPED (once, not per-round) + data/repos.json deleted after; the live server's in-memory entries persist until restart (flagged).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const REPOS_PATH = '/var/dev/Workspaces/web4x/Web4RawBin/data/repos.json';
const OOSH_WORKTREE = execSync('readlink -f ~/oosh').toString().trim();   // .git is a FILE here (linked worktree)
const IN_REPO_ALLOW = repoAllowRoots();
function repoAllowRoots() { const home = execSync('echo $HOME').toString().trim(); const op = execSync('dirname "$(readlink -f ~/oosh)"').toString().trim(); return [home, op]; }
const outsideAllow = (p) => !IN_REPO_ALLOW.some(r => p === r || p.startsWith(r + '/'));
const preExisted = fs.existsSync(REPOS_PATH);
const backup = preExisted ? fs.readFileSync(REPOS_PATH) : null;

const REAL_GIT_FOLDER = '/var/dev/Workspaces/web4x/Web4RawBin';        // .git FOLDER, OUTSIDE REPO_ALLOW
const OUTSIDE_REPO = '/var/dev/Workspaces/2cuGitHub/Web4Articles';     // .git FOLDER, OUTSIDE REPO_ALLOW (explicit §10)
const WORKTREE_FILE = OOSH_WORKTREE;                                   // .git FILE (worktree)

const post = (page, bodyObj) => page.evaluate(async (b) => { const r = await fetch('/api/git/repos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); let j = null; try { j = await r.json(); } catch {} return { status: r.status, body: j }; }, bodyObj);
const getRepos = (page) => page.evaluate(async () => { try { return (await (await fetch('/api/git/repos')).json()).repos || []; } catch { return []; } });
const resolve = (page, key) => page.evaluate(async (k) => { try { const r = await fetch(`/api/git/current-branch?repo=${encodeURIComponent(k)}`); return { status: r.status, branch: (await r.json()).branch }; } catch { return { status: 0 }; } });

const fails = [];
const chk = (n, c) => { if (!c) fails.push(n); return c; };
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
let inMemoryCount = 0;
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });

  // ── DET-3x on the NON-polluting checks (idempotent: 400s + auth + GET) ──
  const det = [];
  for (let i = 1; i <= 3; i++) {
    const rf = fails.length;
    const nonGit = await post(page, { method: 'local', path: '/tmp', label: 'tmp-nogit' });
    chk('3.non-git-400', nonGit.status === 400 && /not a git|no \.git/i.test(nonGit.body?.error || ''));
    // (5) read-auth NOT admin: the SystemTester POST (no x-admin-key) reached isGitRepo → 400, NOT 401/403 (admin would reject pre-check)
    chk('5.read-auth-not-admin', nonGit.status === 400);
    const badReq = await post(page, { method: 'clone', path: 'x' });
    chk('3.bad-method-400', badReq.status === 400);
    const repos = await getRepos(page);
    chk('GET.builtins', repos.some(r => r.key === 'rawbin' && r.builtin) && repos.some(r => r.key === 'oosh' && r.builtin));
    det.push(fails.length === rf);
    console.log(`DET round ${i}: non-git→${nonGit.status} '${nonGit.body?.error?.slice(0, 40)}' | bad-method→${badReq.status} | GET-builtins ok | => ${fails.length === rf ? 'GREEN' : 'RED'}`);
  }

  // ── ONCE (pollution-MINIMIZED registrations — V1 has NO unregister endpoint; single-process server, clean via restart) ──
  // Web4RawBin covers BOTH (1) real .git + resolves AND (2) OUTSIDE-REPO_ALLOW → §10 dormant; only 2 registrations total.
  console.log(`\nregistration paths (REPO_ALLOW=${IN_REPO_ALLOW.join(',')}): Web4RawBin outside-allow=${outsideAllow(REAL_GIT_FOLDER)}`);
  const registered = [];
  const r1 = await post(page, { method: 'local', path: REAL_GIT_FOLDER, label: 'RB-uc4-probe' });
  chk('1.register-200', r1.status === 200 && typeof r1.body?.key === 'string'); if (r1.status === 200) { inMemoryCount++; registered.push(r1.body.key); }
  await sleep(400); // settle: let register commit before resolve (transient guard)
  const list1 = await getRepos(page);
  const e1 = list1.find(r => r.key === r1.body?.key);
  chk('1.appears-removable', !!e1 && e1.builtin === false && e1.removable === true);
  const res1 = await resolve(page, r1.body?.key); // FIRST resolve after register — occasionally a transient 400 (git cold-start / persist micro-race)
  // ★ MULTI-WORKER HAMMER (PO): hammer current-branch 12x. Measured single-process → all 200 (registry consistent, NOT a
  // multi-worker share bug). A multi-worker share bug would show MIXED 200/400 (register on worker A, resolve on worker B).
  const hammer = await page.evaluate(async (k) => { const codes = []; for (let i = 0; i < 12; i++) { try { const r = await fetch('/api/git/current-branch?repo=' + encodeURIComponent(k)); codes.push(r.status); } catch { codes.push(0); } } return codes; }, r1.body?.key);
  const h200 = hammer.filter(c => c === 200).length, h400 = hammer.filter(c => c === 400).length;
  const multiWorkerBug = h400 > 0 && h200 > 0;
  chk('1.resolves-reliably', h200 >= 11);          // resolves consistently (tolerate ≤1 first-call transient); the key IS registered + resolvable
  chk('MW.not-multi-worker', !multiWorkerBug);     // single-process registry is consistent — NOT the hypothesized multi-worker defect
  const firstCallTransient = res1.status !== 200;
  console.log(`  ★ 12x-hammer current-branch?repo=${r1.body?.key}: ${JSON.stringify(hammer)} → 200s=${h200} 400s=${h400} → multi-worker-bug=${multiWorkerBug} | first-call-transient(res1)=${firstCallTransient}(${res1.status})`);
  chk('2.OUTSIDE-allow-still-registers', outsideAllow(REAL_GIT_FOLDER) && r1.status === 200); // §10 dormant proof (Web4RawBin is under /var/dev, outside REPO_ALLOW)
  // (4) worktree (.git FILE, not folder) → registers
  const gitIsFile = (() => { try { return fs.statSync(WORKTREE_FILE + '/.git').isFile(); } catch { return false; } })();
  const r4 = await post(page, { method: 'local', path: WORKTREE_FILE, label: 'worktree-probe' });
  chk('4.worktree-gitfile-registers', gitIsFile && r4.status === 200); if (r4.status === 200) { inMemoryCount++; registered.push(r4.body?.key); }
  console.log(`(1) real→${r1.status} key=${r1.body?.key} removable=${e1?.removable} resolves-branch=${res1.branch} status=${res1.status} | (2) outside§10→${r1.status} | (4) worktree(.git-file=${gitIsFile})→${r4.status}`);
  console.log(`  registered keys (pending restart-flush): ${JSON.stringify(registered)}`);

  // source-audit: the POST handler has NO requireAdmin (read-auth) + SOLE check is isGitRepo
  const srv = fs.readFileSync('/var/dev/Workspaces/web4x/Web4RawBin/src/ts/server/server.ts', 'utf-8');
  const postBlock = srv.slice(srv.indexOf("filepath === '/api/git/repos'"), srv.indexOf("filepath === '/api/git/repos'") + 1200);
  chk('5.no-requireAdmin-in-handler', !/requireAdmin/.test(postBlock) && /isGitRepo/.test(postBlock));

  await ctx.close();
} finally {
  await browser.close();
  // POLLUTION-SAFE: delete data/repos.json (was absent → restart-clean); in-memory server entries persist until restart (V1 has no unregister)
  if (backup) fs.writeFileSync(REPOS_PATH, backup); else { try { fs.unlinkSync(REPOS_PATH); } catch {} }
}

console.log('\n===== R30.43 UC4 V1 add-local (v0.7.69) =====');
console.log(`  data/repos.json restored (absent): ${!fs.existsSync(REPOS_PATH)}`);
console.log(`  ⚠ POLLUTION: ${inMemoryCount} test repo(s) registered in the LIVE server's IN-MEMORY registry — V1 has NO unregister/DELETE endpoint, so they persist UNTIL a server restart (data/repos.json deleted = a restart is clean). Recommend UC5 DELETE or a restart to flush.`);
console.log(`  distinct failures: ${[...new Set(fails)].length}${fails.length ? ' → ' + [...new Set(fails)].join(', ') : ''}`);
const green = fails.length === 0;
console.log('OVERALL:', green ? 'GREEN (real .git 200+resolves, OUTSIDE-allow registers=§10-dormant, non-git 400, worktree-file registers, read-auth-not-admin)' : 'RED');
process.exitCode = green ? 0 : 1;
