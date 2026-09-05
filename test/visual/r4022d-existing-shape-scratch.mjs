// A5b PRE-DEPLOY on SCRATCH — does OLD-PATH-SHAPED existing data render NESTED through the new resolver? This is NOT A5a
// renamed: it seeds a folder unit with the EXACT shape Tron's real 'duplicates' has (measured from prod 3344ade1), which the
// NEW create path does NOT produce. THE DISCRIMINATOR: Tron's nested folder has an EMPTY parent children[] — its nesting is
// expressed ONLY by the `parent` pointer + the location-path (roomcoll:<room>:files/Trash/<name>), and it sits in the room's
// FLAT files[]. A5a's new folders instead carry a populated parent.children[] (server.ts:2485). So if the new resolver nested
// by children[] it would render A5a nested but Tron's OLD data FLAT — exactly the false-green the PO refuses to deploy on.
// Faithful fixture: reuse Tron's REAL room 3231db71 (present in the committed scratch index) with its REAL 'Trash' (3e041bff,
// children:[]); seed ONE old-shape child under it (empty children[], parent=Trash, in the room files[]); render the items-tree
// on the target build; assert the seeded child draws INDENTED under Trash (structural depth, same method as A5a/A5b). Screenshot.
// Dual arm: default HEAD (should render FLAT = reproduces the bug, validates the fixture); ARM_COMMIT=<sha> ARM_BUILD=1 = the fix.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';
const ROOM = '3231db71-d834-435a-a7f9-a801680ccd62';
const TRASH = '3e041bff-cce4-4c70-a355-12bd8062937c'; // Tron's real Trash folder (committed), children:[]
const DUP = 'd0d0d0d0-1111-4222-8333-444444444444';   // seeded OLD-SHAPE child (fixture) — distinct name so it's never mistaken for real data
const DUP_NAME = 'A5bOldShapeDup';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };

const COMMIT = process.env.ARM_COMMIT || 'HEAD';
const shard = (root, u) => path.join(root, 'scenario/index', ...u.slice(0, 5).split(''), `${u}.scenario.json`);
// ── SEED the OLD-SHAPE fixture PRE-BOOT (so the room's boot-time files[] snapshot includes it, matching prod's flat 24). ──
// duplicates: location under Trash, EMPTY children[], parent=Trash pointer, ownerIor=room, IN the room files[] — prod 3344ade1 shape.
let seeded = false;
const seedExtra = (root) => {
  const dupUnit = { ior: 'ior:class:Folder', model: { uuid: DUP, name: DUP_NAME, kind: 'folder',
    location: `roomcoll:${ROOM}:files/Trash/${DUP_NAME}`, children: [], parent: `ior:instance:${TRASH}` }, ownerIor: `ior:instance:${ROOM}` };
  const dp = shard(root, DUP); fs.mkdirSync(path.dirname(dp), { recursive: true }); fs.writeFileSync(dp, JSON.stringify(dupUnit, null, 2) + '\n');
  const rp = shard(root, ROOM); const room = JSON.parse(fs.readFileSync(rp, 'utf8'));
  room.model.files = Array.isArray(room.model.files) ? room.model.files : [];
  if (!room.model.files.includes(`ior:instance:${DUP}`)) room.model.files.push(`ior:instance:${DUP}`);
  fs.writeFileSync(rp, JSON.stringify(room, null, 2) + '\n');
  seeded = true;
};
const f = await setupFoundation({ commit: COMMIT, buildDist: process.env.ARM_BUILD === '1', seedExtra });
const scratchDir = fs.readdirSync('/tmp').filter((d) => d.startsWith(`r4031-scratch-${process.pid}-`)).map((d) => path.join('/tmp', d))[0] || null;
console.log(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} arm=${COMMIT} | scratchDir=${scratchDir}`);
console.log(`  seeded old-shape fixture '${DUP_NAME}' PRE-BOOT under Trash (empty children[], parent-pointer, in files[]) = ${seeded}`);

let result = {};
const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${f.base}/app`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await page.evaluate((roomId) => { let h = document.getElementById('a5bd-host'); if (h) h.remove(); h = document.createElement('div'); h.id = 'a5bd-host'; h.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0b0f17;overflow:auto;padding:8px'; const t = document.createElement('rb-trace-tree'); t.id = 'a5bd-tree'; t.setAttribute('data-seed-ior', roomId); h.appendChild(t); document.body.appendChild(h); }, ROOM);
  await sleep(2500);
  const expandByName = (name) => page.evaluate((name) => { const t = document.getElementById('a5bd-tree'); if (!t) return false; const hit = [...t.querySelectorAll('rb-object-item')].find((n) => ((n.getAttribute('title') || '') + ' ' + (n.textContent || '')).includes(name)); if (!hit) return false; hit.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } })); return true; }, name);
  await page.evaluate((rid) => { const t = document.getElementById('a5bd-tree'); if (t?.expandPath) return t.expandPath([`room:${rid}`]); }, ROOM); await sleep(1200);
  await expandByName('Files'); await sleep(1200);
  const trashExpanded = await expandByName('Trash'); await sleep(1500);

  result = await page.evaluate((dupName) => {
    const tree = document.getElementById('a5bd-tree'); if (!tree) return { ok: false, why: 'no tree' };
    const NODE = '.tt-node';
    const items = [...tree.querySelectorAll('rb-object-item')];
    const depth = (el) => { let d = 0, p = el?.closest(NODE); while (p) { const up = p.parentElement?.closest(NODE); if (!up) break; d++; p = up; } return d; };
    const node = (name) => items.find((n) => ((n.getAttribute('title') || '') + ' ' + (n.textContent || '')).includes(name));
    const trash = node('Trash'), dup = node(dupName);
    const dump = items.map((n) => ({ nm: ((n.getAttribute('title') || '') + (n.textContent || '')).replace(/\s+/g, ' ').trim().slice(0, 20), depth: depth(n) })).filter((x) => /Trash|A5bOldShape|Files/.test(x.nm));
    if (!trash || !dup) return { ok: false, why: 'trash/dup node missing', hasTrash: !!trash, hasDup: !!dup, dump };
    const tTt = trash.closest(NODE), dTt = dup.closest(NODE);
    const selectorFound = !!tTt && !!dTt;
    const nestedUnderTrash = selectorFound && tTt !== dTt && tTt.contains(dTt);
    const deeper = depth(dup) > depth(trash);
    return { ok: selectorFound && nestedUnderTrash && deeper, selectorFound, nestedUnderTrash, deeper, trashDepth: depth(trash), dupDepth: depth(dup), dump };
  }, DUP_NAME);
  try { await page.screenshot({ path: 'test-results/r4022d-existing-shape-scratch.png', fullPage: true }); } catch {}
  console.log(`  trashExpanded=${trashExpanded}`);
  console.log(`  A5b(scratch, OLD-SHAPE): '${DUP_NAME}' DOM-child of Trash + deeper = ${result.ok} | ${JSON.stringify(result)}`);
  await ctx.close();
} catch (e) { result.error = String(e && e.message).slice(0, 200); console.log('error:', result.error); }
finally { await browser.close().catch(() => {}); const td = await f.teardown(); console.log(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`); }

console.log(`\n═══ A5b existing-content-renders-nested — OLD-SHAPE on scratch (arm=${COMMIT}) ═══`);
console.log(`  A5b(old-shape): ${result.ok ? 'GREEN (old-shape data renders NESTED)' : 'RED (renders FLAT / not nested)'} — shot test-results/r4022d-existing-shape-scratch.png`);
process.exit(result.ok ? 0 : 1);
