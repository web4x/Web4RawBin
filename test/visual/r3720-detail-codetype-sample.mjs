// T37.20.3 verify (PO, code-model R30.21-risk set) — 'EVERY /model detail RENDERS'. The governance types (req/task/sprint)
// rendered; this samples the CODE-MODEL types that a tree-expand does not surface: Class/Method/Implementation/Test/File/WebItem.
// Drive the REAL detail path: mount rb-detail-drawer, set ref=<type>:<uuid> → resolveDetailUnit fetches /api/ior → the type's
// detail component renders. Assert non-empty structure. An EMPTY detail = the R30.21-class defect (Tron-visible). Name any empty.
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SAMPLES = [
  { type: 'class', uuid: '015b1ac0-eb5d-4b4b-9749-84d3b2214421' },
  { type: 'method', uuid: '00d63275-37c0-4d74-8ab8-d2bd9643ed2b' },
  { type: 'implementation', uuid: '005dbd3e-19e3-473f-944b-96c4e8053b4a' },
  { type: 'test', uuid: '00c1b920-5d3a-4b94-8ac4-19afe3001052' },
  { type: 'file', uuid: '03110815-a754-468e-bbfc-8bba7c41d1e8' },
  { type: 'webitem', uuid: '0117726e-2d06-45bb-8df8-99c10c0d63e7' },
];

const browser = await webkit.launch();
let servedVersion = '?';
const out = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 950 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  servedVersion = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
  await sleep(800);
  for (const s of SAMPLES) {
    const d = await page.evaluate(async ({ type, uuid }) => {
      // first confirm the unit resolves server-side (so an empty render is a VIEW defect, not a missing unit)
      let apiOk = false, apiName = ''; try { const j = await (await fetch(`/api/ior/ior:instance:${uuid}`)).json(); apiOk = !!(j && (j.unit || j.className || j.model)); apiName = (j?.unit?.model?.name || j?.model?.name || ''); } catch {}
      let drawer = document.querySelector('rb-detail-drawer'); if (drawer) drawer.remove();
      drawer = document.createElement('rb-detail-drawer'); document.body.appendChild(drawer);
      drawer.setAttribute('ref', `${type}:${uuid}`); drawer.setAttribute('open', '');
      await new Promise((r) => setTimeout(r, 1400));
      const panel = drawer.querySelector('.drawer-panel-detail') || drawer.querySelector('[class*="detail"]') || drawer;
      const html = panel ? panel.innerHTML : '';
      const text = panel ? (panel.textContent || '').replace(/\s+/g, ' ').trim() : '';
      const notFound = /not found|failed to load|could not|undefined/i.test(text) && text.length < 80;
      return { apiOk, apiName, len: html.length, textLen: text.length, notFound, sample: text.slice(0, 70) };
    }, s);
    const renders = d.apiOk && !d.notFound && d.textLen > 25 && d.len > 80;
    out.push({ ...s, ...d, renders });
    R(`  ${s.type.padEnd(15)} api=${d.apiOk}(${(d.apiName || '').slice(0, 24)}) → detail ${renders ? 'RENDERS' : 'EMPTY/RED'} (htmlLen=${d.len} textLen=${d.textLen}) "${d.sample}"`);
  }
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ T37.20.3 CODE-MODEL detail render — prod SERVED v${servedVersion} ═══`);
const empty = out.filter((o) => !o.renders);
for (const o of out) R(`  ${o.type.padEnd(15)}: ${o.renders ? 'RENDERS' : 'EMPTY (R30.21-class defect — unit resolves in /api but detail is blank)'}`);
R(`  SAMPLED ${out.length} code-model types · EMPTY: ${empty.length ? empty.map((e) => e.type).join(', ') : 'none'}`);
R(`  VERDICT: ${out.length >= 5 && empty.length === 0 ? 'PASS — every code-model type renders a non-empty detail' : empty.length ? 'FAIL — NAMED empty type(s): ' + empty.map((e) => e.type).join(', ') : 'INCONCLUSIVE'}`);
process.exit(out.length >= 5 && empty.length === 0 ? 0 : 1);
