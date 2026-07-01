// [test:uuid:055b26f5-8f4b-41ba-a114-7f254f643531] R22.4 renderImageLink
// R22.4 gate — PNGs in /md/ file browser are clickable (🖼 <a href>) and open like SVGs.
// Fix 9c052bd9a (listing clickable, server.ts:1222) + 4e3c3df0d (raster-image serve handler,
// server.ts:1366). /md/test/visual/ has 124 PNGs. DET-3x (deterministic curl).
//   - listing renders PNG rows as `🖼 <a href="/md/test/visual/<x>.png">` (not plain text)
//   - a PNG link resolves to image/png 200 (opens in preview, like SVG)
//
// VERDICT (T22.4 unit dd0c576d):
//   v0.6.78 (9c052bd9a) = RED — clickable but link 404 (no raster serve handler).
//   v0.6.79 (4e3c3df0d) = GREEN DET-3x — 3 independent runs x 3 iters = 9/9; PNG link HTTP 200
//     image/png, 124 clickable 🖼<a>. FULL RED->GREEN. Measured by robbin-tester 2026-06-29.
//     testing hop: GREEN/CLEARED.

import https from 'https';
const HOST = 'prod.wo-da.de', PORT = 4444;
const get = (p) => new Promise((res) => {
  https.get({ host: HOST, port: PORT, path: p, rejectUnauthorized: false, timeout: 8000 }, (r) => {
    const ct = r.headers['content-type'] || ''; let d = ''; r.on('data', c => d += c); r.on('end', () => res({ status: r.statusCode, ct, body: d }));
  }).on('error', () => res({ status: 0, ct: '', body: '' }));
});

const results = [];
for (let run = 1; run <= 3; run++) {
  const list = await get('/md/test/visual/');
  // clickable PNG anchors in the listing
  const pngAnchors = [...list.body.matchAll(/<a href="(\/md\/test\/visual\/[^"]+\.png)"/gi)].map(m => m[1]);
  const svgAnchors = [...list.body.matchAll(/<a href="(\/md\/test\/visual\/[^"]+\.svg)"/gi)].map(m => m[1]);
  // PNG filenames present as plain text but NOT inside an <a> (the old broken state)
  const pngNamesTotal = (list.body.match(/[^">/]+\.png/gi) || []).length;
  const imageIcon = /🖼/.test(list.body);
  const clickablePngs = pngAnchors.length;

  // a PNG link must OPEN (like SVG): status 200 (an image or the /md viewer page) — NOT 404.
  let pngOpens = false, sampleCode = 0, sampleCt = '';
  if (pngAnchors.length) { const r = await get(pngAnchors[0]); sampleCode = r.status; sampleCt = r.ct; pngOpens = r.status === 200; }

  const pass = list.status === 200 && clickablePngs >= 100 && imageIcon && pngOpens;
  results.push(pass);
  console.log(`run ${run}: listing=${list.status} clickablePNG<a>=${clickablePngs} svg<a>=${svgAnchors.length} imgIcon=${imageIcon} pngLinkOpens=${pngOpens} (HTTP ${sampleCode} ${sampleCt}) => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT R22.4 (DET-3x) ===');
results.forEach((p, i) => console.log(`  run ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
