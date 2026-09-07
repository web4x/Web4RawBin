// 3 DnD-tail ONE-MEASUREMENT confirms (planner) — does the SHIPPED path do it end-to-end? SystemTester, live 0.8.211.
// (1) T-dnd-file-chain 7fca98ae: drop a file on #rrc-drop → FileUnit created + in Files tree + R40.81 one-store symlink (shard is a symlink).
// (2) T-dropzone-highlight 5658ccd9: dragenter → #rrc-drop gets 'rrc-drop-active'; dragleave → cleared (class toggles).
// (3) T-upload-status-bar 1443877c: drop → #rrc-upload-status surfaces 'Uploading NAME…' / 'NAME pct%' (status updates).
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { lstatSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const shard = (u) => `${REPO}/scenario/index/${u[0]}/${u[1]}/${u[2]}/${u[3]}/${u[4]}/${u}.scenario.json`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (u) => new Promise(res => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch { res(null); } }); }).on('error', () => res(null)); });
const roomFiles = async (id) => ((await get(id))?.unit?.model?.files || []).map(String);

const browser = await webkit.launch();
const R = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 850 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  R.served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  const roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('DnD-tail confirms', 'SystemTester'); for (let k = 0; k < 60; k++) { await new Promise(r => setTimeout(r, 250)); const el = document.getElementById('room-tree'); if (el?.getAttribute('data-seed-ior')) return el.getAttribute('data-seed-ior'); } return null; });
  if (!roomId) throw new Error('no room');
  R.roomId = roomId.slice(0, 12);
  await sleep(800);

  // ── (2) HIGHLIGHT: dragenter adds 'rrc-drop-active', dragleave removes it ──
  R.highlight = await page.evaluate(() => {
    const dz = document.getElementById('rrc-drop'); if (!dz) return { err: 'no #rrc-drop' };
    dz.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
    const onEnter = dz.classList.contains('rrc-drop-active');
    dz.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
    const clearedOnLeave = !dz.classList.contains('rrc-drop-active');
    return { onEnter, clearedOnLeave };
  });
  R.c2 = R.highlight.onEnter === true && R.highlight.clearedOnLeave === true;

  // ── (3)+(1): observe status bar, then REAL file drop on #rrc-drop ──
  const before = new Set(await roomFiles(roomId));
  const drop = await page.evaluate(async () => {
    const dz = document.getElementById('rrc-drop'); const sb = document.getElementById('rrc-upload-status');
    const texts = [];
    const mo = new MutationObserver(() => { const t = (sb?.textContent || '').trim(); if (t) texts.push(t); });
    if (sb) mo.observe(sb, { childList: true, characterData: true, subtree: true });
    // build a ~200KB file so an intermediate pct callback can fire; drop it via the real #rrc-drop handler
    const seed = document.getElementById('room-tree')?.getAttribute('data-seed-ior')?.slice(0, 8) || String(performance.now());
    const bytes = new Uint8Array(200 * 1024); for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 7 + seed.charCodeAt(i % seed.length)) & 255; // room-unique bytes → no content-hash dedup
    const file = new File([bytes], `dndtail-drop-${seed}.bin`, { type: 'application/octet-stream' });
    const dt = new DataTransfer(); dt.items.add(file);
    const filesCarried = dt.files.length;
    dz.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await new Promise(r => setTimeout(r, 6000));
    mo.disconnect();
    return { filesCarried, texts };
  });
  R.filesCarried = drop.filesCarried;
  R.statusTexts = drop.texts;
  R.c3 = drop.texts.some(t => /upload/i.test(t)); R.c3pct = drop.texts.some(t => /\d+%/.test(t));

  // find the new file unit
  let newRef = null;
  for (let i = 0; i < 20; i++) { const now = await roomFiles(roomId); const fresh = now.find(f => !before.has(f)); if (fresh) { newRef = fresh; break; } await sleep(500); }
  R.newUuid = newRef ? newRef.replace('ior:instance:', '') : null;
  if (R.newUuid) {
    const unit = await get(R.newUuid);
    R.unitResolves = !!unit?.unit;
    R.className = String(unit?.unit?.ior || '').split(':')[2] || '';
    R.inFilesTree = (await roomFiles(roomId)).some(f => f.includes(R.newUuid));
    // R40.81 one-store symlink = a unitLinks[] path (the room Files-dir link) is a SYMLINK → the canonical shard.
    // (the primary shard is correctly the canonical regular file; the symlink is the alt/Files-tree link.)
    let links = []; try { links = JSON.parse(readFileSync(shard(R.newUuid), 'utf8')).model?.unitLinks || []; } catch {}
    const scenarioRoot = `${REPO}/scenario`;
    const isLink = (l) => { try { return lstatSync(path.join(scenarioRoot, l)).isSymbolicLink(); } catch { return false; } };
    R.filesTreeSymlink = links.some(l => /rooms\/[^/]+\/files\//.test(String(l)) && isLink(l)); // the room Files-tree symlink
    R.oneStoreSymlink = links.some(isLink);
  }
  R.c1 = !!R.newUuid && R.unitResolves && R.className === 'File' && R.inFilesTree && R.filesTreeSymlink;
} catch (e) { R.error = String(e.message || e); }
finally { await browser.close(); }

console.log(`=== DnD-tail confirms — served ${R.served} room ${R.roomId} ===`);
console.log(`(2) highlight 5658ccd9: dragenter→active=${R.highlight?.onEnter} dragleave→cleared=${R.highlight?.clearedOnLeave} => ${R.c2 ? 'GREEN' : 'RED'}`);
console.log(`(3) status-bar 1443877c: filesCarried=${R.filesCarried} texts=${JSON.stringify(R.statusTexts)} hasUpload=${R.c3} hasPct=${R.c3pct} => ${R.c3 ? 'GREEN' : 'RED'}`);
console.log(`(1) file-chain 7fca98ae: newUnit=${R.newUuid ? R.newUuid.slice(0, 8) : 'NONE'} class=${R.className} inFilesTree=${R.inFilesTree} filesTreeSymlink=${R.filesTreeSymlink} (oneStoreSymlink=${R.oneStoreSymlink}) => ${R.c1 ? 'GREEN' : 'RED'}`);
if (R.error) console.log('ERROR:', R.error);
process.exit(R.c1 && R.c2 && R.c3 ? 0 : 1);
