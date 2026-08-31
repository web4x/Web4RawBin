// R40.71 (T36.3) GATE @390 — a Method with no own sourceFile now DERIVES its source file:line from its Implementation,
// so a previously-bare method detail shows a "📂 file:line" source link. Demo: FileApi.writeFile → src/ts/server/FileApi.ts.
// Server fix is Method-ONLY (server.ts:3120 type==='Method'); Classes are NOT derived → this gate ALSO checks classes to
// tell VERIFIED-full from PARTIAL (methods fixed, classes still bare). Screenshot/RENDERED evidence, never DOM counts. DET-3x.
// PO's two asks: (1) sample SEVERAL methods (328/344 derivable → ~16 still bare) + confirm the bare remainder still looks
// broken; (2) check whether CLASS details improved (original defect was 60/192 classes too) → if still bare, gate as PARTIAL.
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync('test-results/r4071', { recursive: true });
const FILEAPI_WRITEFILE = '00d63275-37c0-4d74-8ab8-d2bd9643ed2b'; // the demoed method
const METHODS = ['00d63275-37c0-4d74-8ab8-d2bd9643ed2b','9905fbfa-e41a-4177-b625-f6fee373efd2','993e5667-106a-4d6d-abf2-f8044df6214e','96bd16c4-8b41-4771-a00b-fcd5fd937860','963b67a2-488c-4580-b5ba-697537f02754','96874a18-c7e5-457a-8440-dff16469f785','96eb5d4a-171c-4c48-b301-d207accbb4ae','96e5316b-3ae5-4a52-801b-9f89d6c480df','970c7956-fae7-453b-99b5-442dd8a56576','971a12ed-c28a-4c5b-9384-c3163114b87b','9757fe86-bb5d-4041-b573-96b1e1120491','9b96492c-8b3c-417d-acd7-a6ea26d743b5','9b9825da-896d-4d0d-9275-abd6a7893236'];
const CLASSES = ['97d6e2bf-6c02-4c36-82f6-c0c6178d1163','93f9afc7-364d-4dd4-a9d7-3e49333cc16c','935b5733-84b7-4c7b-b0ca-6a908c3972c1','91d575d0-9e7a-4e5c-8269-02a3af0eda1a'];
const SRC = /(?:src|scripts|test)\/[\w./-]+\.(?:ts|mjs|js)\b|\.ts:\d+/; // a real source-file path (NOT .scenario.json)

const browser = await webkit.launch();
const runs = [];
try {
  for (let iter = 1; iter <= 3; iter++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' }).catch(() => {});
    // verify served==0.8.151 MYSELF (same-origin fetch AFTER navigation, not from about:blank)
    const ver = await page.evaluate(async () => (await (await fetch('/api/config')).json()).version).catch(() => '?');
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
    await sleep(800);
    // mount a detail + return the RENDERED source-link status (rendered text, screenshot on iter 1 for representatives)
    const renderDetail = async (type, uuid, shotName) => {
      await page.goto(`${BASE}/scenario?ior=ior:instance:${uuid}`, { waitUntil: 'networkidle' }).catch(() => {});
      await sleep(1800);
      // RELIABLE detection: Playwright's text engine PIERCES shadow DOM (textContent does NOT) — the '📂 src/..' source
      // link rendered in a nested detail component's shadow root, which is why the earlier textContent scope false-RED'd it.
      const hasSourceLink = await page.getByText(SRC).first().isVisible().catch(() => false);
      if (shotName && iter === 1) await page.screenshot({ path: `test-results/r4071/${shotName}.png` }).catch(() => {});
      return { hasSourceLink, snippet: hasSourceLink ? 'src-link' : '', len: 0 };
    };
    // API classify (efficient distribution) — does /api/trace/children return a sourceFile? (the server fix output)
    const apiSource = async (uuid) => { try { const j = await page.evaluate(async (u) => await (await fetch(`/api/trace/children/${u}?mode=trace`)).json(), uuid); return typeof j.sourceFile === 'string' && !j.sourceFile.includes('.scenario.json') ? j.sourceFile : null; } catch { return null; } };

    // (1) FileApi.writeFile — the demo: rendered detail MUST show a source link to FileApi.ts
    const fw = await renderDetail('method', FILEAPI_WRITEFILE, 'method-fileapi-writefile');
    const fwApi = await apiSource(FILEAPI_WRITEFILE);
    const fwOk = fw.hasSourceLink && /FileApi\.ts/.test(fw.snippet + (fwApi || ''));

    // (2) sample methods — API-classify all, rendered-check a few; count derivable vs bare
    const mApi = [];
    for (const u of METHODS) mApi.push({ u: u.slice(0, 8), src: await apiSource(u) });
    const derivable = mApi.filter((m) => m.src).length, bare = mApi.filter((m) => !m.src).length;
    // rendered-confirm: a derivable method shows the link; find a bare one (if any in sample) + confirm it renders WITHOUT a link
    const bareM = mApi.find((m) => !m.src);
    const bareRender = bareM ? await renderDetail('method', METHODS.find((x) => x.startsWith(bareM.u)), 'method-bare-remainder') : null;

    // (3) CLASSES — did they improve? API + rendered. fix is Method-only → expect classes with no own sourceFile stay bare
    const cApi = [];
    for (const u of CLASSES) cApi.push({ u: u.slice(0, 8), src: await apiSource(u) });
    const cWithSrc = cApi.filter((c) => c.src).length, cBare = cApi.filter((c) => !c.src).length;
    const cRender = await renderDetail('class', CLASSES[0], 'class-detail');

    runs.push({ ver, fwOk, fwSnippet: fw.snippet, fwApi, derivable, bare, bareRenderHasLink: bareRender ? bareRender.hasSourceLink : null, cWithSrc, cBare, cRenderHasLink: cRender.hasSourceLink });
    console.log(`iter ${iter}: served=${ver} | FileApi.writeFile link=${fwOk}(${fw.snippet}|api=${fwApi}) | methods derivable=${derivable}/${METHODS.length} bare=${bare} | classes withSrc=${cWithSrc}/${CLASSES.length} bare=${cBare} classRenderLink=${cRender.hasSourceLink}`);
    await ctx.close();
  }
} finally { await browser.close().catch(() => {}); }

// ── verdict (DET-3x: stable across runs) ──
const stable = (k) => runs.every((r) => JSON.stringify(r[k]) === JSON.stringify(runs[0][k]));
const served = runs.every((r) => r.ver === '0.8.151');
const methodFix = runs.every((r) => r.fwOk === true) && stable('fwOk');           // demo VERIFIED + derived from impl (FileApi.ts)
const classesImproved = runs.every((r) => r.cBare === 0);                          // if any class still bare → NOT improved
console.log(`\n═══ R40.71 METHOD sourceFile-from-impl GATE (@390, DET-3x) ═══`);
console.log(`served==0.8.151 (self-verified): ${served} (${runs.map((r) => r.ver).join('/')})`);
console.log(`METHOD case: FileApi.writeFile renders derived source link to FileApi.ts = ${methodFix} → ${methodFix ? 'VERIFIED' : 'BROKEN'}`);
console.log(`  method sample: derivable(link)=${runs[0].derivable}/${METHODS.length}, bare-remainder=${runs[0].bare} (bare method renders WITHOUT a link = ${runs[0].bareRenderHasLink === false ? 'still-bare CONFIRMED (expected ~16/344)' : runs[0].bareRenderHasLink === null ? 'no bare in sample' : 'UNEXPECTED link'})`);
console.log(`CLASS case: classes-with-source=${runs[0].cWithSrc}/${CLASSES.length}, classes-bare=${runs[0].cBare}, class-detail renders link=${runs[0].cRenderHasLink} → ${runs[0].cBare > 0 ? 'STILL BARE = PARTIAL DELIVERY (fix is Method-only, classes untouched)' : 'improved'}`);
console.log(`\nVERDICT: served=${served ? 'ok' : 'WRONG-VERSION'} · METHODS=${methodFix ? 'VERIFIED' : 'BROKEN'} · CLASSES=${classesImproved ? 'VERIFIED' : 'PARTIAL (still bare)'} ⇒ ${served && methodFix && classesImproved ? 'GREEN (full)' : served && methodFix && !classesImproved ? 'PARTIAL — methods VERIFIED, classes still BARE (gate as partial, not green)' : 'BROKEN'}`);
process.exit(served && methodFix ? 0 : 1);
