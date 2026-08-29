// Tron live-MVC pin defect — READ-ONLY served-prod evidence (no mutation). Server is CORRECT (current=Task 40.1);
// the defect is the RENDERED pin slot is stale. Compare server-current (/api/trace/children/<CS>?mode=trace) vs the
// pin slot the client actually RENDERS @390. Mismatch = the live RED specimen. Fail-closed: pin slot not found ≠ pass.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const CS = 'current-sprint-singleton-0000-000000000001';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const serverCurrent = await (async () => { const r = await fetch(`${BASE}/api/trace/children/${CS}?mode=trace`).catch(() => null); if (!r) return null; const d = await r.json(); const ch = d.children || d; const cur = (Array.isArray(ch) ? ch : []).find(c => c.role === 'current'); return cur ? { uuid: cur.uuid, name: (cur.name || '').slice(0, 42) } : null; })();

const b = await webkit.launch({ headless: true });
try {
  const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  // the RENDERED pin slot: the '📌 Current — Task N…' line in rb-trace-tree
  const rendered = await p.evaluate(() => { const t = document.querySelector('rb-trace-tree'); const m = (t?.innerText || '').match(/📌 Current[^\n]*/); return m ? m[0].slice(0, 60) : null; });

  console.log(`server-current (authoritative): ${serverCurrent ? serverCurrent.uuid.slice(0, 8) + ' ' + serverCurrent.name : '(none)'}`);
  console.log(`rendered pin slot @390        : ${rendered || '(PIN SLOT NOT FOUND)'}`);

  if (!serverCurrent) { console.log('\nNOT-DETERMINED-because-X: server-current not readable.'); }
  else if (rendered === null) { console.log('\nFAIL-CLOSED: pin slot not found in the rendered tree — cannot read as a pass.'); }
  else {
    const rendersServerCurrent = rendered.includes(serverCurrent.name.split(':')[0]) || rendered.includes(serverCurrent.uuid.slice(0, 8));
    console.log(`\nrendered pin matches server-current: ${rendersServerCurrent}`);
    console.log(rendersServerCurrent
      ? 'GREEN (read-only): the rendered pin already matches the server — no stale-render defect visible right now.'
      : `RED (read-only, LIVE): server-current is "${serverCurrent.name}" but the pin RENDERS "${rendered}" — the pin slot did NOT re-render to the server's current. Tron's exact defect, live on served 0.8.136.`);
  }
} finally { await b.close(); }
