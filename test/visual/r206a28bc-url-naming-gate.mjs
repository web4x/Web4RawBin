// BUG 206a28bc naming fix (live 0.8.211, SystemTester) — a FRESH URL with no displayName must be named by
// its CLASS ('Youtube Watch'), NOT the raw URL tail ('watch?v='). Behavioural: drop a unique youtube URL via
// the app's own #rrc-drop, find the newly-created unit in the room files[], assert its name. DET-3x.
// RED if the name contains 'watch?v=' / equals the raw URL / is not the class name.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = (u) => new Promise((r) => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, (s) => { let d = ''; s.on('data', c => d += c); s.on('end', () => { try { r(JSON.parse(d)); } catch { r(null); } }); }).on('error', () => r(null)); });
const roomFiles = async (id) => ((await get(id))?.unit?.model?.files || []).map(String);

async function dropOne(browser, tag) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  const out = { tag };
  try {
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
    out.served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
    await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
    await sleep(1500);
    const roomId = await page.evaluate(async (t) => { const c = window.__rawbinClient; c.createRoom('B206 url-naming ' + t, 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const el = document.getElementById('room-tree'); if (el?.getAttribute('data-seed-ior')) return el.getAttribute('data-seed-ior'); } return null; }, tag);
    if (!roomId) throw new Error('no room');
    out.roomId = roomId.slice(0, 12);
    await sleep(800);
    const before = new Set(await roomFiles(roomId));
    // fresh unique youtube URL, NO displayName
    const url = `https://www.youtube.com/watch?v=GATE${tag}${roomId.slice(0, 6)}`;
    out.url = url;
    await page.evaluate((u) => { const dz = document.getElementById('rrc-drop'); if (!dz) return; const dt = new DataTransfer(); dt.setData('text/uri-list', u); dt.setData('text/plain', u); dz.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); }, url);
    // find the NEW file unit
    let newRef = null;
    for (let i = 0; i < 30; i++) { await sleep(500); const now = await roomFiles(roomId); const fresh = now.find(f => !before.has(f)); if (fresh) { newRef = fresh; break; } }
    if (!newRef) throw new Error('no new file unit after URL drop');
    const unit = await get(newRef.replace('ior:instance:', ''));
    out.name = unit?.unit?.model?.name;
    // PASS = class-named, not the raw-URL tail
    out.pass = out.name === 'Youtube Watch' && !String(out.name).includes('watch?v=') && !String(out.name).includes(url);
  } catch (e) { out.error = String(e.message || e); out.pass = false; }
  finally { await ctx.close(); }
  return out;
}

const browser = await webkit.launch();
const runs = [];
for (let i = 1; i <= 3; i++) { const r = await dropOne(browser, `r${i}`); runs.push(r); console.log(`run ${i}: served=${r.served} room=${r.roomId} name=${JSON.stringify(r.name)} => ${r.pass ? 'GREEN' : 'RED'}${r.error ? ' err=' + r.error : ''}`); }
await browser.close();
const green = runs.length === 3 && runs.every(r => r.pass);
console.log('\n=== BUG 206a28bc URL naming fix (DET-3x) ===');
console.log(green ? "GREEN — a fresh URL is named by its class 'Youtube Watch', not 'watch?v='" : 'RED');
process.exit(green ? 0 : 1);
