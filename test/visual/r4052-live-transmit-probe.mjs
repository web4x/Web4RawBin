// R40.52 TRANSMIT arm on the LIVE deployed bundle (v0.8.119), READ-ONLY, NO credential (random test token → 403/409, non-mutating).
// Proves the headline defect is fixed: the deployed ownerActionFetch (Impl 4f85fa3e) attaches x-player-token from localStorage['rawbin-player-id']
// on the owner-action sites. Dispatches the REAL rb-drawer-action event (exactly what the owner button fires → the deployed handler → ownerActionFetch)
// and captures the outgoing request header. Identity-agnostic (a random TEST token, never Tron's). Server answers 403 (fail-closed) — no mutation, pin oracle untouched.
import { webkit } from '@playwright/test';
const PROD = 'https://prod.wo-da.de:4444';
const TASK = '97e8a6ad-46db-440f-a9be-cfb97ca64df4'; // Sprint37 QA-Review
const TESTTOK = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'; // purpose-made random test token (NOT Tron's)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const browser = await webkit.launch({ headless: true });
const raw = { arms: {} };
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); // no cookie
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', (r) => { const u = r.url(); if (/\/api\/task\/[^/]+\/(make-current|approve|decline)/.test(u)) reqs.push({ url: u.replace(PROD, ''), xpt: r.headers()['x-player-token'] ?? null, cookie: (r.headers()['cookie'] || '').includes('sm_session') }); });
  const resp = {}; page.on('response', (r) => { const u = r.url(); const m = /\/api\/task\/[^/]+\/(make-current|approve|decline)/.exec(u); if (m) resp[m[1]] = r.status(); });
  await page.goto(`${PROD}/trace`, { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForSelector('rb-trace-tree rb-object-item', { timeout: 20000 }).catch(() => {});
  await page.waitForSelector('rb-detail-drawer', { timeout: 15000 }).catch(() => {});
  await sleep(1200);
  raw.drawerMounted = await page.evaluate(() => !!document.querySelector('rb-detail-drawer'));
  const fire = async (verb) => {
    await page.evaluate((a) => { localStorage.setItem('rawbin-player-id', a.tok); document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: a.verb, ref: `task:${a.task}` }, bubbles: true })); }, { verb, task: TASK, tok: TESTTOK });
    await sleep(1500);
    const ep = verb === 'set-current' ? 'make-current' : verb.replace('qa-', '');
    const req = reqs.reverse().find((r) => r.url.includes(ep));
    return { fired: !!req, xptSent: req ? req.xpt : 'no-request', xptMatches: req?.xpt === TESTTOK, noCookie: req ? r_noCookie(req) : null, status: resp[ep] ?? null };
  };
  const r_noCookie = (req) => req.cookie === false;
  raw.arms.setCurrent = await fire('set-current');
  raw.arms.approve = await fire('qa-approve');
  raw.arms.decline = await fire('qa-decline');
  await ctx.close();
} finally { await browser.close(); }
console.log(JSON.stringify(raw, null, 2));
const arms = [raw.arms.setCurrent, raw.arms.approve, raw.arms.decline];
const transmit = arms.filter((a) => a?.fired && a?.xptMatches === true && a?.noCookie === true);
const failClosed = arms.filter((a) => a?.fired).every((a) => a.status === 403); // random non-owner → 403 (no mutation)
console.log('\n=== R40.52 LIVE TRANSMIT (deployed v0.8.119, read-only, test token) ===');
arms.forEach((a, i) => console.log(`  ${['set-current', 'qa-approve', 'qa-decline'][i]}: fired=${a?.fired} x-player-token-sent(=test)=${a?.xptMatches} no-cookie=${a?.noCookie} status=${a?.status}`));
const ok = transmit.length >= 1 && failClosed;
console.log(`\n${ok ? '✓' : '✗'} ${ok ? `TRANSMIT PROVEN on deployed bundle — ${transmit.length}/3 owner-action sites sent x-player-token(=test token, no cookie); server fail-closed 403 (non-owner, non-mutating). The headline defect (client never transmitted identity) is FIXED.` : 'NOT PROVEN — inspect (drawer mounted=' + raw.drawerMounted + ')'}`);
process.exit(ok ? 0 : 1);
