// R22.5 gate — fillPreviewPane (shared room+trace) audio + YouTube preview. v0.6.80.
// Impl ca54081e / commit 3a02318ce. Mounts the real rb-file-detail (self-fetches /api/ior +
// fillPreviewPane), the same shared previewer the room file view uses.
//   (1) AUDIO: audio/* mime -> native <audio controls src=...> (was a download link).
//   (2) YOUTUBE: text/uri-list w/ a YouTube URL -> <iframe src=youtube.com/embed/ID
//       allowfullscreen allow=autoplay> (was a plain resolved iframe / text).
// Fixtures: YouTube = the real Heartspaces .url File 2746ab4a (watch?v=a-_CuBOu6BA).
//           Audio  = a temp audio/mpeg File unit (synthetic — fillPreviewPane's audio branch
//           keys on mime only and sets <audio src>, no content fetch), created + deleted here.
// DET-3x.

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
const SCEN = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';
const YT_UUID = '2746ab4a-55d5-4bae-83dc-b38c6968515e';   // Heartspaces YouTube .url (uri-list)
const YT_ID = 'a-_CuBOu6BA';
const shardPath = (u) => path.join(SCEN, ...u.slice(0, 5).split(''), u + '.scenario.json');

// create temp audio File unit
const AU_UUID = randomUUID();
const auPath = shardPath(AU_UUID);
fs.mkdirSync(path.dirname(auPath), { recursive: true });
fs.writeFileSync(auPath, JSON.stringify({ ior: 'ior:class:File', model: { uuid: AU_UUID, name: 'r225-gate-audio.mp3', mimeType: 'audio/mpeg', size: 1 }, ownerIor: null }) + '\n');

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const page = await (await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } })).newPage();
try {
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!customElements.get('rb-file-detail'), { timeout: 20000 });

  async function mount(uuid, cls) {
    await page.evaluate(({ u, c }) => {
      document.querySelectorAll('.' + c).forEach(e => e.remove());
      const el = document.createElement('rb-file-detail'); el.className = c;
      el.setAttribute('uuid', u); document.body.appendChild(el);
    }, { u: uuid, c: cls });
    await page.waitForSelector(`.${cls} .cv-actions`, { timeout: 20000 }).catch(() => {});
  }

  const results = [];
  for (let run = 1; run <= 3; run++) {
    // (2) YOUTUBE
    await mount(YT_UUID, '__yt');
    await page.waitForSelector('.__yt rb-preview-pane .pz-content iframe', { timeout: 12000 }).catch(() => {});
    const yt = await page.evaluate(() => {
      const f = document.querySelector('.__yt rb-preview-pane .pz-content iframe');
      if (!f) return { ok: false };
      const src = f.getAttribute('src') || '';
      return { ok: true, src, embed: /^https:\/\/www\.youtube\.com\/embed\//.test(src), hasId: src.includes('a-_CuBOu6BA'),
        allowFs: f.hasAttribute('allowfullscreen'), allowAutoplay: /autoplay/.test(f.getAttribute('allow') || '') };
    });
    const ytPass = yt.ok && yt.embed && yt.hasId && yt.allowFs && yt.allowAutoplay;

    // (1) AUDIO
    await mount(AU_UUID, '__au');
    await page.waitForSelector('.__au rb-preview-pane .pz-content audio', { timeout: 8000 }).catch(() => {});
    const au = await page.evaluate(() => {
      const a = document.querySelector('.__au rb-preview-pane .pz-content audio');
      if (!a) { const dl = document.querySelector('.__au rb-preview-pane .pz-content a[download]'); return { ok: false, downloadLink: !!dl }; }
      return { ok: true, controls: a.hasAttribute('controls'), hasSrc: !!a.getAttribute('src') };
    });
    const auPass = au.ok && au.controls && au.hasSrc;

    const pass = ytPass && auPass;
    results.push(pass);
    console.log(`run ${run}: YT[embed=${yt.embed} id=${yt.hasId} fs=${yt.allowFs} autoplay=${yt.allowAutoplay}]=${ytPass ? 'GREEN' : 'RED'} | AUDIO[<audio>=${au.ok} controls=${au.controls} src=${au.hasSrc}${au.downloadLink ? ' (still download-link)' : ''}]=${auPass ? 'GREEN' : 'RED'} => ${pass ? 'GREEN' : 'RED'}`);
  }

  console.log('\n=== VERDICT R22.5 audio+YouTube (DET-3x) ===');
  results.forEach((p, i) => console.log(`  run ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  await browser.close();
  process.exitCode = green ? 0 : 1;
} finally {
  try { await browser.close(); } catch {}
  try { fs.unlinkSync(auPath); } catch {} // delete temp audio unit (no pollution)
  console.log('cleanup: temp audio unit removed', AU_UUID.slice(0, 8));
}
