// T30.49 repo-delete R40.106-INTEGRITY gate (planner-requested, pre-Tron-accept). r3049 already proves
// gone-from-selector+registry-LIST; THIS proves the DURABLE-DELETE integrity r3049 doesn't:
//   after DELETE /api/git/repos?key= → (1) gone from /api/git/repos list, (2) ★ GONE from the durable store
//   data/repos.json ON DISK (what RepoRegistry.load() reads on startup = the restart-survival proof, non-disruptive),
//   (3) 0 refs (no scenario/index unit references the key), (4) /api/ior null (repos aren't ior units — N/A confirmed).
// SURFACE NOTE: a dynamic repo is NOT a scenario/index unit; its canonical durable store is data/repos.json — so the
// room-surface's 'canonical scenario/index unit GONE' maps here to 'key GONE from data/repos.json'.
// FAILABLE: if the key survives in data/repos.json after DELETE (in-memory-only removal = the room-delete pattern) → RED.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import https from 'node:https';
const BASE = 'https://prod.wo-da.de:4444';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const REPOS_JSON = `${REPO}/data/repos.json`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// a real .git worktree to register (same source r3049 uses; fallback to the RawBin repo root)
let PROD_WT; try { PROD_WT = execSync('readlink -f ~/oosh', { encoding: 'utf8' }).trim().replace(/mcdonges\.latest$/, 'prod'); } catch { PROD_WT = REPO; }
try { execSync(`test -d ${PROD_WT}/.git`); } catch { PROD_WT = REPO; }
const diskKeys = () => { try { return Object.keys(JSON.parse(readFileSync(REPOS_JSON, 'utf8')) || {}); } catch { return []; } };
const refsInIndex = (key) => { try { return execSync(`grep -rl ${JSON.stringify(key)} ${REPO}/scenario/index 2>/dev/null | wc -l`, { encoding: 'utf8' }).trim(); } catch { return '0'; } };
const iorResolves = (key) => new Promise(res => { https.get(`${BASE}/api/ior/ior:instance:${key}`, { rejectUnauthorized: false }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(!!JSON.parse(d)?.unit); } catch { res(false); } }); }).on('error', () => res(false)); });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
  const list = () => page.evaluate(async () => { const j = await (await fetch('/api/git/repos')).json(); return (Array.isArray(j) ? j : j.repos || []).map(r => r.key); });
  const register = (p, l) => page.evaluate(async ([p, l]) => { const r = await fetch('/api/git/repos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'local', path: p, label: l }) }); const j = await r.json(); return { status: r.status, key: j.key, error: j.error }; }, [p, l]);
  const del = (k) => page.evaluate(async (k) => { const r = await fetch(`/api/git/repos?key=${encodeURIComponent(k)}`, { method: 'DELETE' }); const j = await r.json().catch(() => ({})); return { status: r.status, ok: j.ok }; }, k);

  for (let i = 1; i <= 3; i++) {
    const reg = await register(PROD_WT, `rbintegrity${i}`);
    await sleep(400);
    const key = reg.key;
    const presentList = (await list()).includes(key);
    const presentDisk = diskKeys().includes(key); // landed in the durable store
    // DELETE
    const d = await del(key);
    await sleep(600);
    const goneList = !(await list()).includes(key);
    const goneDisk = !diskKeys().includes(key);         // ★ durable removal (restart-survival)
    const refs = refsInIndex(key);
    const iorGone = !(await iorResolves(key));
    const pass = reg.status === 200 && presentList && presentDisk && d.status === 200 && goneList && goneDisk && refs === '0' && iorGone;
    rows.push(pass);
    console.log(`iter ${i}: reg=${key} present(list=${presentList},disk=${presentDisk}) | DELETE→ list-gone=${goneList} ★DISK-gone=${goneDisk} refs=${refs} iorNull=${iorGone} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n=== T30.49 repo-delete R40.106-INTEGRITY (DET-3x) ===');
const green = rows.length === 3 && rows.every(Boolean);
console.log(`  durable store = data/repos.json (what RepoRegistry.load reads on startup). disk keys now: [${diskKeys().join(', ') || '(empty)'}]`);
console.log(green ? "GREEN — DELETE durably removes the repo from data/repos.json (survives restart), 0 refs, no ior unit. R40.106 HOLDS on the repo surface." : 'RED — repo survives in the durable store (in-memory-only removal = the room-delete pattern).');
process.exit(green ? 0 : 1);
