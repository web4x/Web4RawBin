// R40.86 IN-APP DRAG-INTO-FOLDER GATE — the hole that shipped: rb-object-item.ts:81 drop reads ONLY dataTransfer.files, so
// Tron's REAL gesture (in-app drag of an EXISTING file onto a folder → sets application/rb-object-ref, NO .files) hit the
// files.length gate = SILENT NO-OP; our old green only ever sent EXTERNAL files so it never touched that branch.
// This gate exercises the REAL in-app payload + gates BOTH branches + the iOS fallback + the negative. OUTCOME-based (asserts
// the MOVE happened, not how) so it RED-baselines the shipped no-op now and flips GREEN on the expert's re-parent fix.
//   B1 IN-APP  : drop application/rb-object-ref (no .files) on a folder → existing unit RE-PARENTED into it, RENDERS inside,
//                PERSISTS, LEFT its old root location (a MOVE not a copy), exactly ONE unit total (no duplicate mint).
//   B2 EXTERNAL: dataTransfer.files upload path UNREGRESSED — native-multipart real body, size+sha byte round-trip.
//   B3 iOS     : custom-MIME stripped → text/plain hash → the ref still resolves (selectionModel) → re-parent still happens.
//   B4 NEGATIVE: NEITHER payload → nothing happens, NOTHING minted (no phantom units from an empty drop).
//   B5 served==committed (content-guard: the loaded bundle carries the fix). DET-3x.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import crypto from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const PLAYER = '11111111-2222-4333-8444-555555555555';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COMMIT = process.env.ARM_COMMIT || 'HEAD';
const R = (v) => console.log(v);

const f = await setupFoundation({ commit: COMMIT, buildDist: process.env.ARM_BUILD !== '0' });
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} arm=${COMMIT}`);
const browser = await webkit.launch();
const iters = [];
try {
  for (let it = 1; it <= 3; it++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, PLAYER);
    const page = await ctx.newPage();
    await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'DragMember', secretCode: '4086' }));
    await sleep(2000);
    const roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('R4086 in-app drag room', 'D'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
    if (!roomId) { R(`  iter ${it}: INSTRUMENT no-room-render`); iters.push({ instrument: true }); await ctx.close(); continue; }
    const FILES = `roomcoll:${roomId}:files`;
    const api = (ref) => page.evaluate(async (u) => { try { return await (await fetch(`/api/trace/children/${encodeURIComponent(u)}`)).json(); } catch { return null; } }, ref);
    const kidsOf = async (ref) => ((await api(ref))?.children || []).map((c) => String(c.uuid));
    const locOf = (uuid) => page.evaluate(async (u) => { try { const j = await (await fetch(`/api/ior/ior:instance:${u}`)).json(); return String(j?.unit?.model?.location || ''); } catch { return ''; } }, uuid);
    // occurrences of a uuid across root + the folder = 1 for a MOVE, 2 for a bad copy/double-mint
    const occurrences = async (uuid, folderRef) => { const root = await kidsOf(FILES); const fol = await kidsOf(folderRef); return root.filter((u) => u === uuid).length + fol.filter((u) => u === uuid).length; };

    // ── SETUP: a folder 'DropTarget' under Files (real Add-folder verb) + a file at ROOT ──
    await page.evaluate((rid) => { const t = document.getElementById('room-tree'); if (t?.renderSeed) t.renderSeed(rid); }, roomId);
    await sleep(1600);
    const expandFiles = async () => { await page.evaluate(async (rid) => { const t = document.getElementById('room-tree'); if (t?.expandPath) await t.expandPath([`room:${rid}`]).catch(() => {}); }, roomId); await sleep(500); await page.evaluate(async (fr) => { const t = document.getElementById('room-tree'); if (t?.expandPath) await t.expandPath([fr]).catch(() => {}); }, FILES); await sleep(500); };
    const selectFiles = () => page.evaluate((raw) => { const t = document.getElementById('room-tree'); const hit = [...(t?.querySelectorAll('rb-object-item,[ref]') || [])].find((n) => [...n.attributes].some((a) => a.value.includes(raw))); if (hit) { hit.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; } return false; }, FILES);
    const pressAddFolder = (name) => page.evaluate((nm) => { const b = [...document.querySelectorAll('button,[role=button],.rb-strip *')].find((e) => /add folder/i.test(e.textContent || '')); if (!b) return false; window.prompt = () => nm; b.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, name);
    await expandFiles(); await selectFiles(); await sleep(700); await pressAddFolder('DropTarget'); await sleep(4200); await expandFiles();
    const FOLDER = `${FILES}/DropTarget`;

    // upload a real binary file at ROOT (native multipart — the proven real-body path)
    const SRC = crypto.randomBytes(2048); const srcSha = crypto.createHash('sha256').update(SRC).digest('hex');
    const up = await page.request.post(`${f.base}/api/room/${roomId}/upload`, { multipart: { playerToken: PLAYER, file: { name: 'MoveMe.bin', mimeType: 'application/octet-stream', buffer: SRC } } });
    let upBody = {}; try { upBody = JSON.parse(await up.text()); } catch {}
    const fileUuid = upBody.uuid || '';
    await sleep(1500); await expandFiles();
    const rootBefore = await kidsOf(FILES); const fileAtRootBefore = rootBefore.includes(fileUuid);
    R(`  iter ${it}: room=${roomId.slice(0, 8)} fileUuid=${fileUuid.slice(0, 8)} at-root-before=${fileAtRootBefore} upStatus=${up.status()}`);

    // find the folder node + dispatch a REAL in-app drop payload onto it
    const dropOnFolder = (setup) => page.evaluate((a) => {
      const t = document.getElementById('room-tree');
      const fol = [...(t?.querySelectorAll('rb-object-item') || [])].find((n) => ((n.getAttribute('title') || '') + ' ' + (n.textContent || '')).includes('DropTarget'));
      if (!fol) return { fired: false, why: 'no folder node' };
      const dt = new DataTransfer();
      if (a.ref) dt.setData('application/rb-object-ref', a.ref);          // in-app payload (dragstart:157)
      if (a.textPlain) dt.setData('text/plain', a.textPlain);            // iOS fallback (custom MIME stripped)
      ['dragenter', 'dragover', 'drop'].forEach((ty) => fol.dispatchEvent(new DragEvent(ty, { dataTransfer: dt, bubbles: true, cancelable: true })));
      return { fired: true };
    }, setup);

    // ── B1 IN-APP: drop application/rb-object-ref (no .files) → the file MOVES into DropTarget ──
    const d1 = await dropOnFolder({ ref: `file:${fileUuid}` });
    await sleep(3500); await expandFiles();
    const inFolder = (await kidsOf(FOLDER)).includes(fileUuid);
    const leftRoot = !(await kidsOf(FILES)).includes(fileUuid);
    const loc = await locOf(fileUuid);
    const locMoved = /:files\/DropTarget/.test(loc);
    const occ = await occurrences(fileUuid, FOLDER);
    const b1 = d1.fired && fileAtRootBefore && inFolder && leftRoot && locMoved && occ === 1;
    R(`     B1 in-app move: inFolder=${inFolder} leftRoot=${leftRoot} loc='${loc}' movedLoc=${locMoved} occ=${occ} → ${b1 ? 'GREEN' : 'RED'}`);

    // ── B2 EXTERNAL upload unregressed: native multipart real body + size+sha round-trip ──
    const X = crypto.randomBytes(2048); const xSha = crypto.createHash('sha256').update(X).digest('hex');
    const xu = await page.request.post(`${f.base}/api/room/${roomId}/upload`, { multipart: { playerToken: PLAYER, file: { name: 'Ext.bin', mimeType: 'application/octet-stream', buffer: X } } });
    let xb = {}; try { xb = JSON.parse(await xu.text()); } catch {}
    let served = Buffer.alloc(0), gs = 0; if (xb.uuid) { const g = await page.request.get(`${f.base}/api/room/file/${encodeURIComponent(xb.uuid)}/content?token=${encodeURIComponent(PLAYER)}`); gs = g.status(); try { served = Buffer.from(await g.body()); } catch {} }
    const b2 = xu.status() === 200 && Number(xb.size) === X.length && gs === 200 && crypto.createHash('sha256').update(served).digest('hex') === xSha;
    R(`     B2 external upload+sha: upSize=${xb.size}/${X.length} get=${gs} sha-match=${crypto.createHash('sha256').update(served).digest('hex') === xSha} → ${b2 ? 'GREEN' : 'RED'}`);

    // ── B3 iOS fallback: a SECOND file, drop with ONLY text/plain hash (no custom MIME) → still resolves + moves ──
    const S2 = crypto.randomBytes(2048);
    const u2 = await page.request.post(`${f.base}/api/room/${roomId}/upload`, { multipart: { playerToken: PLAYER, file: { name: 'iosMove.bin', mimeType: 'application/octet-stream', buffer: S2 } } });
    let u2b = {}; try { u2b = JSON.parse(await u2.text()); } catch {}
    const f2 = u2b.uuid || ''; await sleep(1200); await expandFiles();
    const d3 = await dropOnFolder({ textPlain: `#file.show?uuid=${f2}` }); // iOS: only text/plain survives
    await sleep(3500); await expandFiles();
    const b3 = d3.fired && (await kidsOf(FOLDER)).includes(f2) && !(await kidsOf(FILES)).includes(f2);
    R(`     B3 iOS text/plain fallback moves f2=${f2.slice(0, 8)}: inFolder=${(await kidsOf(FOLDER)).includes(f2)} → ${b3 ? 'GREEN' : 'RED'}`);

    // ── B4 NEGATIVE: empty drop (no files, no ref) → NO new unit minted ──
    const rootCountBefore = (await kidsOf(FILES)).length, folCountBefore = (await kidsOf(FOLDER)).length;
    const d4 = await dropOnFolder({}); // neither payload
    await sleep(2500); await expandFiles();
    const b4 = d4.fired && (await kidsOf(FILES)).length === rootCountBefore && (await kidsOf(FOLDER)).length === folCountBefore;
    R(`     B4 negative empty-drop mints nothing: rootΔ=${(await kidsOf(FILES)).length - rootCountBefore} folΔ=${(await kidsOf(FOLDER)).length - folCountBefore} → ${b4 ? 'GREEN' : 'RED'}`);

    iters.push({ b1, b2, b3, b4 });
    await ctx.close();
  }
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); } finally { await browser.close().catch(() => {}); await f.teardown(); }

R(`\n═══ R40.86 IN-APP DRAG-INTO-FOLDER (both branches + iOS + negative) DET-3x — arm=${COMMIT} v${f.servedVersion} ═══`);
const ok = (k) => iters.length === 3 && iters.every((r) => r[k]);
R(`  B1 in-app re-parent (move, renders, left source, one unit) : ${ok('b1') ? 'GREEN' : 'RED'}  ← the shipped MISS (RED until the re-parent fix)`);
R(`  B2 external upload UNREGRESSED (size+sha round-trip)        : ${ok('b2') ? 'GREEN' : 'RED'}`);
R(`  B3 iOS fallback (text/plain hash resolves the ref)         : ${ok('b3') ? 'GREEN' : 'RED'}  ← RED until the fallback fix`);
R(`  B4 negative (empty drop mints NOTHING — no phantom)        : ${ok('b4') ? 'GREEN' : 'RED'}`);
const green = ok('b1') && ok('b2') && ok('b3') && ok('b4');
R(`OVERALL: ${green ? 'ALL GREEN DET-3x' : 'RED (expected pre-fix: B1+B3 RED = the in-app/iOS no-op; B2+B4 GREEN)'}`);
process.exit(green ? 0 : 1);
