// [test:uuid:b3e9f1a4-7c28-4d6b-9f03-1a5e8c2d94b7] R40.12 RbFileDetail.autoRenderMediaPreview — media subtypes auto-render a PAINTED player on select (pixel, not container), fail-loud on throw. req mints Impl→autoRenderMediaPreview.
// R40.12 — File MEDIA subtypes AUTO-RENDER a real player on SELECT (Tron's empty-black-box regression, fix 57555d2ff,
// autoRenderMediaPreview @ rb-file-detail.ts). ★ PIXEL not DOM: the FAILING case still had an audio CONTAINER in the DOM
// (pane visible-but-unfilled) — that is exactly how it hid past a green DOM gate for a sprint. So this asserts the player
// is PAINTED: the <audio> element exists, has real rendered size, AND its screenshot shows control chrome (not a uniform
// empty box). Real-WebKit @390 iPhone-12 (Tron's device engine — chromium emulation is blind to this). DET-3x.
// Mounts the REAL served rb-file-detail — the SAME component the room-view drawer + trace + app all route to (rb-detail-drawer
// tagMap file→rb-file-detail); the bug was in the component's dropped-eager-call, context-independent. Heartspaces mp3
// unit 63462717 'Ed Sheeran - I See Fire (Music Video).mp3' (audio/mpeg). Anti-vacuity: an unfilled/empty pane FAILS.
import { webkit, devices } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const FILE = '63462717-1771-4775-aeda-d9947d7bcbd2';
const iPhone = devices['iPhone 12'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// decode an element screenshot in-page → fraction of pixels that differ from the median luminance (empty box ≈ 0)
async function renderedFraction(page, buf) {
  return page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, c.width, c.height).data;
    const lum = []; for (let i = 0; i < d.length; i += 4) lum.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    const med = lum.slice().sort((a, b) => a - b)[Math.floor(lum.length / 2)];
    let diff = 0; for (const l of lum) if (Math.abs(l - med) > 24) diff++;
    return { frac: diff / lum.length, px: lum.length };
  }, buf.toString('base64'));
}

const browser = await webkit.launch();
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-file-detail'), { timeout: 20000 }).catch(() => {});
    // mount the real component exactly as the drawer's tagMap does (file→rb-file-detail), by uuid
    await page.evaluate((uuid) => {
      document.querySelectorAll('rb-file-detail#__g').forEach(e => e.remove());
      const el = document.createElement('rb-file-detail'); el.id = '__g';
      el.style.cssText = 'display:block;position:fixed;inset:0;z-index:99999;background:#111;overflow:auto';
      el.setAttribute('uuid', uuid); document.body.appendChild(el);
    }, FILE);
    await sleep(2500); // autoRenderMediaPreview → fillPreviewPane fetches + mounts the <audio controls>

    const dom = await page.evaluate(() => {
      const host = document.querySelector('rb-file-detail#__g');
      const audio = host?.querySelector('audio, video');
      const pane = host?.querySelector('rb-preview-pane');
      const r = audio?.getBoundingClientRect();
      const failLoud = /preview unavailable/.test(host?.textContent || '');
      return { hasAudio: !!audio, tag: audio?.tagName || null, w: r?.width || 0, h: r?.height || 0,
               paneVisible: pane ? getComputedStyle(pane).display !== 'none' : false, failLoud };
    });

    // PIXEL: screenshot the audio element itself → must show control chrome, not an empty box
    let frac = 0;
    if (dom.hasAudio && dom.h > 10) {
      const buf = await page.locator('rb-file-detail#__g audio, rb-file-detail#__g video').first().screenshot().catch(() => null);
      if (buf) frac = (await renderedFraction(page, buf)).frac;
    }

    // player painted = element exists + real rendered size + control-chrome pixels present (not uniform empty box)
    const pass = dom.hasAudio && dom.h > 20 && dom.w > 60 && frac > 0.02 && !dom.failLoud;
    results.push(pass);
    console.log(`iter ${i}: player=${dom.hasAudio}(${dom.tag}) size=${Math.round(dom.w)}x${Math.round(dom.h)} paneVisible=${dom.paneVisible} controlPixels=${(frac * 100).toFixed(1)}%(want>2) failLoud=${dom.failLoud} => ${pass ? 'GREEN' : 'RED'}`);
    if (i === 1) await page.locator('rb-file-detail#__g').screenshot({ path: 'test-results/r4012-music-player/detail-iter1.png' }).catch(() => {});
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.12 music-player @390 real-WebKit (pixel, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
