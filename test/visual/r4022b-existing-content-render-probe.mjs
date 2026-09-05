// A5b — RENDER-NESTED for TRON'S REAL EXISTING CONTENT (representative data, not my synthetic folders). READ-ONLY on live prod.
// Tron's room 3231db71 ("Marcel dnd test room") has a real 'Trash' folder; the LIVE API nests a 'duplicates' folder under it
// (GET /api/trace/children/roomcoll:3231db71…:files/Trash → child 'duplicates'). The question the PO asked: does the ITEMS-TREE
// VISUALLY draw 'duplicates' INDENTED under 'Trash' (child depth, Trash carries a chevron) or FLAT as a sibling at the Files root.
// Architect discriminator: FLAT = duplicates at Files-root depth beside Trash; NESTED = duplicates deeper, under Trash.
// Faithful to what Tron sees: mount the SAME rb-trace-tree component seeded to the room uuid (RoomView's render path), expand
// Files→Trash, judge by STRUCTURAL DEPTH (this tree indents via nested containers, not per-row padding). Read-only: GETs only,
// no JOIN, no writes, no mint. Screenshot @390 (iPhone width Tron uses).
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const ROOM = '3231db71-d834-435a-a7f9-a801680ccd62';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df'; // SystemTester (already a member of this room) — read-only render only
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };

const browser = await webkit.launch();
let result = {};
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, SYS);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-trace-tree'), { timeout: 20000 }).catch(() => {});

  // mount a standalone rb-trace-tree seeded to the ROOM uuid (the exact RoomView render path) in a clean container
  await page.evaluate((roomId) => {
    let host = document.getElementById('a5b-host'); if (host) host.remove();
    host = document.createElement('div'); host.id = 'a5b-host';
    host.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0b0f17;overflow:auto;padding:8px';
    const t = document.createElement('rb-trace-tree'); t.id = 'a5b-tree'; t.setAttribute('data-seed-ior', roomId);
    host.appendChild(t); document.body.appendChild(host);
  }, ROOM);
  await sleep(2500);

  const tree = () => page.$('#a5b-tree');
  const expandByName = (name) => page.evaluate((name) => { const t = document.getElementById('a5b-tree'); if (!t) return false; const hit = [...t.querySelectorAll('rb-object-item')].find((n) => ((n.getAttribute('title') || '') + ' ' + (n.textContent || '')).includes(name)); if (!hit) return false; hit.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } })); return true; }, name);

  // expand room → Files → Trash
  await page.evaluate((rid) => { const t = document.getElementById('a5b-tree'); if (t?.expandPath) return t.expandPath([`room:${rid}`]); }, ROOM); await sleep(1200);
  await expandByName('Files'); await sleep(1200);
  const trashExpanded = await expandByName('Trash'); await sleep(1500);

  result = await page.evaluate(() => {
    const tree = document.getElementById('a5b-tree'); if (!tree) return { ok: false, why: 'no tree' };
    const NODE = '.tt-node';
    const items = [...tree.querySelectorAll('rb-object-item')];
    const depth = (el) => { let d = 0, p = el?.closest(NODE); while (p) { const up = p.parentElement?.closest(NODE); if (!up) break; d++; p = up; } return d; };
    const dump = items.map((n) => ({ nm: ((n.getAttribute('title') || '') + (n.textContent || '')).replace(/\s+/g, ' ').trim().slice(0, 22), depth: depth(n) }));
    const node = (name) => items.find((n) => ((n.getAttribute('title') || '') + ' ' + (n.textContent || '')).includes(name));
    const trash = node('Trash'), dup = node('duplicates');
    if (!trash || !dup) return { ok: false, why: 'trash/duplicates node missing', hasTrash: !!trash, hasDup: !!dup, dump };
    const trashTt = trash.closest(NODE), dupTt = dup.closest(NODE);
    const selectorFound = !!trashTt && !!dupTt;
    const nestedUnderTrash = selectorFound && trashTt !== dupTt && trashTt.contains(dupTt);
    const deeper = depth(dup) > depth(trash);
    // Trash must carry an expand control (chevron) — architect's NESTED discriminator
    const trashHasChevron = !!trashTt?.querySelector(':scope > .tt-row [class*="chev"], :scope > .tt-row [class*="expand"], :scope > .tt-row [class*="caret"]') || (trashTt?.querySelector(':scope > .tt-children')?.children.length > 0);
    return { ok: selectorFound && nestedUnderTrash && deeper, selectorFound, nestedUnderTrash, deeper, trashDepth: depth(trash), dupDepth: depth(dup), trashHasChevron, dump };
  });
  try { await page.screenshot({ path: 'test-results/r4022-A5b-existing-content-nested.png', fullPage: true }); } catch {}
  console.log(`A5b trashExpanded=${trashExpanded}`);
  console.log(`A5b existing-content render-nested (@390, prod room 3231db71): duplicates DOM-child of Trash + deeper = ${result.ok} | ${JSON.stringify(result)}`);
  await ctx.close();
} catch (e) { result.error = String(e && e.message).slice(0, 200); console.log('A5b error:', result.error); }
finally { await browser.close().catch(() => {}); }

console.log(`\n═══ A5b existing-content-renders-nested (Tron's real Trash/duplicates, prod) ═══`);
console.log(`  A5b: ${result.ok ? 'GREEN (duplicates renders nested under Trash)' : 'RED (renders FLAT / not nested)'} — shot test-results/r4022-A5b-existing-content-nested.png`);
process.exit(result.ok ? 0 : 1);
