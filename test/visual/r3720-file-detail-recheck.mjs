// T37.20.3 File-type disambiguation: the code-type sample showed file:03110815 render '⚠ unresolved' (a stale evidence unit,
// size=undefined). Is the FILE TYPE detail broken (R30.21) or just that unit? Re-render REAL content-bearing File units.
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const FILES = [
  { uuid: '03110815-a754-468e-bbfc-8bba7c41d1e8', note: 'evidence (size=undefined)' },
  { uuid: '051a6371-a4cf-4dd2-85ba-d3769ab98b16', note: 'champagne.txt (27b)' },
  { uuid: '08dd15c2-7b7b-45b4-a475-98c5b23c773a', note: 'fresh-src.bin (2048b)' },
];
const browser = await webkit.launch();
let servedVersion = '?'; const out = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 950 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  servedVersion = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
  for (const f of FILES) {
    const d = await page.evaluate(async (uuid) => {
      let drawer = document.querySelector('rb-detail-drawer'); if (drawer) drawer.remove();
      drawer = document.createElement('rb-detail-drawer'); document.body.appendChild(drawer);
      drawer.setAttribute('ref', `file:${uuid}`); drawer.setAttribute('open', '');
      await new Promise((r) => setTimeout(r, 1400));
      const panel = drawer.querySelector('.drawer-panel-detail') || drawer;
      const text = (panel.textContent || '').replace(/\s+/g, ' ').trim();
      return { text: text.slice(0, 90), unresolved: /unresolved/i.test(text), len: text.length };
    }, f.uuid);
    const ok = !d.unresolved && d.len > 25;
    out.push({ ...f, ...d, ok });
    R(`  file:${f.uuid.slice(0, 8)} (${f.note}): ${ok ? 'RENDERS' : 'UNRESOLVED/EMPTY'} "${d.text}"`);
  }
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 160)}`); }
finally { await browser.close().catch(() => {}); }
R(`\n═══ File-type detail recheck — v${servedVersion} ═══`);
const realOk = out.filter((o) => !o.note.includes('evidence')).every((o) => o.ok);
R(`  real content-bearing Files render: ${realOk ? 'YES' : 'NO'} · evidence-unit unresolved: ${out.find((o) => o.note.includes('evidence'))?.unresolved}`);
R(`  ⇒ ${realOk ? 'File TYPE renders fine; 03110815 is a STALE/contentless evidence unit (data, not a type-render defect)' : 'File TYPE detail is BROKEN (R30.21) — real files render unresolved'}`);
process.exit(realOk ? 0 : 1);
