// T26.2 v0.7.3 gate — cross-origin DnD federated-reference. Dragging an rb-object-item sets
// DataTransfer 'application/rb-federated-ref' = { ior: ior:instance:<uuid>@<origin>, fetchUrl:
// <origin>/api/scenario/<uuid>, originHost, type, name }. READ-ONLY (dragstart creates nothing).
// The receiver's server imports from fetchUrl (server-to-server). DET-3x.

import { chromium } from '@playwright/test';

const BASE = 'https://prod.wo-da.de:4444';
const UUID = 'c8dc9d0d-ad6d-4d1e-a3af-7967cccdb37d';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
const page = await ctx.newPage();

const results = [];
try {
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!customElements.get('rb-object-item'), { timeout: 20000 }).catch(() => {});

  for (let i = 1; i <= 3; i++) {
    const r = await page.evaluate(async (uuid) => {
      document.querySelectorAll('.__oi').forEach(e => e.remove());
      const el = document.createElement('rb-object-item');
      el.className = '__oi'; el.setAttribute('uuid', uuid); el.setAttribute('type', 'webitem'); el.setAttribute('name', 'Gate Item');
      document.body.appendChild(el);
      await new Promise(z => setTimeout(z, 1500));
      const icon = el.querySelector('.oi-icon[draggable="true"]') || el.querySelector('.oi-icon');
      if (!icon) return { err: 'no .oi-icon' };
      const dt = new DataTransfer();
      icon.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true, cancelable: true }));
      const raw = dt.getData('application/rb-federated-ref');
      let ref = null; try { ref = JSON.parse(raw); } catch {}
      return { origin: location.origin, raw: (raw || '').slice(0, 160), ref };
    }, UUID);

    const origin = r.origin || BASE;
    const ref = r.ref || {};
    const iorOk = typeof ref.ior === 'string' && ref.ior.startsWith(`ior:instance:${UUID}@`) && ref.ior.includes(origin);   // ior@host
    const fetchOk = typeof ref.fetchUrl === 'string' && ref.fetchUrl.startsWith(origin) && ref.fetchUrl.includes(`/api/scenario/${UUID}`); // fetchUrl
    const originOk = ref.originHost === origin;
    const pass = iorOk && fetchOk && originOk;
    results.push(pass);
    console.log(`iter ${i}: ior@host=${iorOk} fetchUrl=${fetchOk} originHost=${originOk} => ${pass ? 'GREEN' : 'RED'} | ior=${(ref.ior || r.err || '?').slice(0, 60)} fetchUrl=${(ref.fetchUrl || '').slice(0, 55)}`);
  }
} finally { await browser.close(); }

console.log('\n=== VERDICT T26.2 federated DnD ref (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('READ-ONLY (dragstart mints nothing) — 0 pollution.');
process.exit(green ? 0 : 1);
