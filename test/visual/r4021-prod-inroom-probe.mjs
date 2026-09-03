// CAN I REACH A REAL ROOM at /app on prod? (PO 2026-09-03) — the ONLY surface that counts for the in-room Add-folder button.
// NO /trace substitute. If I cannot enter a real room + reach its Files folder action bar, the answer is INCONCLUSIVE (ask Tron).
import { webkit } from '@playwright/test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' });
  await sleep(2500);
  const state = await page.evaluate(() => {
    const bodyText = (document.body.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    const roomCards = [...document.querySelectorAll('[data-room-id],[data-roomid],.room-card,.room-item,[class*="room-card"],[class*="roomCard"]')];
    const gate = /profile|sign in|log in|create your|identify|enrol|device/i.test(bodyText); // an identity/profile gate?
    return { bodyText, roomCardCount: roomCards.length, roomSamples: roomCards.slice(0, 5).map((e) => (e.textContent || '').slice(0, 30)), profileGate: gate };
  });
  R(`/app render: profileGate=${state.profileGate} roomCards=${state.roomCardCount} samples=${JSON.stringify(state.roomSamples)}`);
  R(`  bodyText: "${state.bodyText}"`);

  let entered = false, inRoom = null;
  if (state.roomCardCount > 0) {
    entered = await page.evaluate(() => { const c = [...document.querySelectorAll('[data-room-id],.room-card,.room-item,[class*="room"]')].find((e) => (e.textContent || '').trim().length > 0); if (c) { c.click(); return true; } return false; }).catch(() => false);
    await page.waitForSelector('#room-tree', { timeout: 10000 }).catch(() => {});
    await sleep(1500);
    inRoom = await page.evaluate(() => {
      const tree = document.getElementById('room-tree'); if (!tree) return { roomTree: false };
      const filesNode = [...tree.querySelectorAll('rb-object-item,[ref],.tt-row')].find((n) => /files/i.test(n.textContent || '') || [...n.attributes].some((a) => /:files/i.test(a.value)));
      if (filesNode) (filesNode.closest('.tt-row') || filesNode).click();
      return { roomTree: true, filesNodeFound: !!filesNode };
    });
  }
  R(`\n═══ IN-ROOM REACHABILITY VERDICT ═══`);
  if (state.profileGate && state.roomCardCount === 0) R(`  INCONCLUSIVE — /app shows an identity/profile gate + no room cards WITHOUT auth. I CANNOT reach a real room read-only (needs a real user identity = the auth boundary). Ask Tron: does the in-room Files folder now show 📁 Add folder? I did NOT substitute /trace.`);
  else if (state.roomCardCount === 0) R(`  INCONCLUSIVE — /app rendered NO room cards read-only (rooms need identity/membership). Cannot reach a real room. Ask Tron. No /trace substitute.`);
  else if (!entered || !inRoom?.roomTree) R(`  INCONCLUSIVE — room cards present (${state.roomCardCount}) but could not enter a real room / no #room-tree rendered. Ask Tron rather than substitute.`);
  else R(`  REACHED A REAL ROOM: #room-tree rendered, Files node found=${inRoom.filesNodeFound}. (Then read the in-room action bar for add-folder — see next.)`);
} finally { await browser.close().catch(() => {}); }
