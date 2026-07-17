// [test:uuid:1f7c9a04-3d2b-4e58-9c61-2a8b4f0d7e33] R30.24 RbDiffEditor.openFromParams (Impl dc236c19) + RbDiffEditor.buildShareLink (Impl bcd06c77) — deep-linkable diffs: a diff opens to an EXACT state from URL params (repo/path/left/right) and buildShareLink is the exact inverse that round-trips. AC1/2/6 deep-link restore, AC3/4 share round-trip, AC5 repo/traversal security (server allow-list reject).
// [test:uuid:1f010e35-ebc3-42d1-aba4-7feace64baee] R30.24 RbDiffEditor.buildShareLink (Impl bcd06c77) — share round-trip: 🔗 .de-share builds the exact-inverse deep-link and navigating it reopens identical state (AC3/4, verified in this gate).
// R30.24 (prod v0.7.35). Behavior-first: real /edit navigation + real .de-share click → assert restored SideState + shared URL round-trip + server-side security reject. DET-3x. SystemTester-only (read-only: same-origin GET loads + a clipboard write; no profile/room mint).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// canonical deep-link: otmux from the oosh repo, left=commit 516ebb3, right=branch dev
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const EXP = { path: 'otmux', leftRef: '516ebb3', rightRef: 'dev', repo: 'oosh' };

const readSides = (page) => page.evaluate(() => {
  const el = document.querySelector('rb-diff-editor');
  const st = (s) => s ? { path: s.path, ref: s.ref, repo: s.repo, len: (s.content || '').length } : null;
  return { left: st(el?.left), right: st(el?.right), status: (el?.querySelector('.de-status')?.textContent || '') };
});
const restored = (s) =>
  s.left && s.right &&
  s.left.path === EXP.path && s.left.ref === EXP.leftRef && s.left.repo === EXP.repo && s.left.len > 0 &&
  s.right.path === EXP.path && s.right.ref === EXP.rightRef && s.right.repo === EXP.repo && s.right.len > 0;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();

    // ── AC1/2/6: deep-link restores the EXACT diff state from URL params ──
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return (e?.left?.content?.length > 0) && (e?.right?.content?.length > 0); }, { timeout: 20000 }).catch(() => {});
    const s1 = await readSides(page);
    const acRestore = restored(s1);

    // ── AC3/4: buildShareLink is the exact inverse — click 🔗, capture the URL, round-trip it ──
    await page.click('rb-diff-editor .de-share', { timeout: 8000 }).catch(() => {});
    await sleep(500);
    const s2 = await readSides(page);
    const m = s2.status.match(/🔗[^:]*:?\s*(https?:\/\/\S+)/) || s2.status.match(/(https?:\/\/\S+)/);
    const url = m ? m[1] : '';
    const linkWellFormed = /^🔗/.test(s2.status.trim()) && /\/edit\/otmux/.test(url) && /repo=oosh/.test(url) && /left=516ebb3/.test(url) && /right=dev/.test(url);

    let acRoundTrip = false;
    if (url) {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return (e?.left?.content?.length > 0) && (e?.right?.content?.length > 0); }, { timeout: 20000 }).catch(() => {});
      const s3 = await readSides(page);
      acRoundTrip = restored(s3) && s3.left.ref === s1.left.ref && s3.right.ref === s1.right.ref && s3.left.repo === s1.left.repo;
    }

    // ── AC5: repo allow-list + path-traversal are rejected server-side (R30.6.7 reuse) ──
    const sec = await page.evaluate(async () => {
      const j = async (u) => { try { const r = await fetch(u); const t = await r.text(); return { ok: r.ok, code: r.status, leak: /root:.*:0:0:/.test(t) }; } catch { return { ok: false, code: 0, leak: false }; } };
      return {
        unknownRepo: await j('/api/files?path=otmux&ref=dev&repo=nonexistentxyz'),
        traversal: await j('/api/files?path=../../../../etc/passwd&repo=rawbin'),
      };
    });
    // deep-link with an unknown repo must NOT serve foreign content (load fails → empty)
    await page.goto(`${BASE}/edit/otmux?repo=nonexistentxyz&left=dev&right=516ebb3`, { waitUntil: 'networkidle' });
    await sleep(1500);
    const s4 = await readSides(page);
    const acSecurity = !sec.unknownRepo.ok && !sec.unknownRepo.leak && !sec.traversal.ok && !sec.traversal.leak &&
      (s4.left?.len || 0) === 0 && (s4.right?.len || 0) === 0; // unknown-repo deep-link serves nothing

    const pass = acRestore && linkWellFormed && acRoundTrip && acSecurity;
    results.push(pass);
    console.log(`iter ${i}: restore=${acRestore}(L=${s1.left?.ref}@${s1.left?.repo}:${s1.left?.len}b R=${s1.right?.ref}:${s1.right?.len}b) | link=${linkWellFormed}(${url.slice(0, 72)}) | roundtrip=${acRoundTrip} | security=${acSecurity}(unk=${sec.unknownRepo.code} trav=${sec.traversal.code} unkServe=${s4.left?.len || 0}b) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.24 deep-linkable diffs (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
