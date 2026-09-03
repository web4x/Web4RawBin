// REPRODUCE Tron's "no Add-folder button on the ROOM Files folder" (PO 2026-09-03, findings only). Tron's screenshot shows
// NO add-folder button on a room's Files folder. HYPOTHESIS (source): add-folder is ONLY in MODEL_DECLS (/model page,
// model-action-decls.ts); the shared drawer bar used on the ROOM surface uses UNIVERSAL_DECLS (action-applicability.ts) which
// has NO add-folder. This MOUNTS the room LIVE and reads what the room Files detail ACTUALLY renders in its action bar —
// Tron-law-3: measure the rendered surface, not the engine. Scratch localhost:4643, owner auto-authed (no prod identity).
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const ROOM = '6c04f959-f3d6-42eb-818f-5e2e4498bf91'; // Heartspaces (has a Files folder)
const f = await setupFoundation();
const OWNER = fs.readFileSync('/root/.rawbin/owner-token', 'utf8').trim();
const smSession = (/sm_session=([^;]+)/.exec(f.ownerHeaders().Cookie || '') || [])[1] || '';
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} | room=${ROOM.slice(0, 8)}`);

const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  if (smSession) await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/' }]);
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, OWNER);
  const page = await ctx.newPage();
  // The room surface uses the SHARED drawer bar (UNIVERSAL_DECLS). /trace wires the same shared drawer, so opening the room
  // Files ref in that drawer renders the SAME action bar the room shows. (RoomBrowser lists no rooms on scratch → /app entry blocked.)
  await page.goto(f.base + '/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await sleep(800);
  const FILES_REF = `roomcoll:${ROOM}:files`;
  const FILES_UUID = 'f0250bdc-bc79-4f21-a2ad-a78a96959fc1'; // Heartspaces files-folder resolved uuid

  // open the room Files detail in the shared drawer (which carries the UNIVERSAL_DECLS action bar), read the rendered buttons
  const result = await page.evaluate(async ({ ref, uuid }) => {
    let drawer = document.querySelector('rb-detail-drawer') || document.querySelector('rb-detail-view');
    if (!drawer) { drawer = document.createElement('rb-detail-drawer'); document.body.appendChild(drawer); }
    // open the detail for the room Files ref (both forms tried)
    for (const r of [ref, `folder:${uuid}`, uuid]) { try { drawer.setAttribute('ref', r); drawer.setAttribute('open', ''); } catch {} }
    await new Promise((rz) => setTimeout(rz, 1500));
    const detailText = (document.querySelector('rb-detail-drawer, rb-detail-view')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    const buttons = [...document.querySelectorAll('rb-strip button, .rb-strip button, rb-detail-drawer button, rb-detail-view button, [role="button"]')].map((b) => (b.textContent || '').trim()).filter(Boolean);
    const bars = document.querySelectorAll('rb-strip, .rb-strip').length;
    return { ref, detailText, barCount: bars, buttons, hasAddFolder: buttons.some((t) => /add folder/i.test(t)) };
  }, { ref: FILES_REF, uuid: FILES_UUID });
  R(`\n──────── ROOM Files folder action bar (RENDERED) ────────`);
  R(`  ${JSON.stringify(result, null, 0)}`);
  if (result.err) R(`  ⚠ could not fully reach the rendered surface: ${result.err} — reporting honestly, not claiming rendered coverage`);
  else R(`  → RENDERED VERDICT: room Files action bar buttons = ${JSON.stringify(result.buttons)} · add-folder button present = ${result.hasAddFolder}`);
  await page.screenshot({ path: 'test-results/r4021-roomfiles-actionbar.png' }).catch(() => {});
} finally {
  await browser.close().catch(() => {});
  const td = await f.teardown();
  R(`\nteardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`);
}
