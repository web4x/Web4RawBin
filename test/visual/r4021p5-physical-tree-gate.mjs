// T37.21 PART 5 — puml PHYSICAL directory tree (v0.8.156, architect+PO backstopped). @390 real-WebKit, read-only.
// THE DISCRIMINATOR (Tron's whole point): beneath the VIRTUAL puml collection, the same filename appears under DISTINCT
// physical directory nodes — class-diagram.puml resolves under ≥4 distinct dir:<relpath> nodes (a virtual view shows it
// once; the physical tree reveals it N times, one per real dir). NO-DUP / zero-new-mints: each dir node is a dir: ref
// whose identity is keyToUuid('folder::'+relpath) → re-resolving the SAME dir ref yields the SAME uuid (idempotent, no
// duplicate Folder minted on re-open). Failability: a UNIQUE filename appears under exactly ONE dir (proves the
// multi-dir reveal is a real discriminator, not "any file counts"); and distinct dirs carry distinct uuids (no collapse).
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const PUML = 'rawbin:puml';
const TARGET = 'class-diagram.puml';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);

const browser = await webkit.launch();
let exit = 1;
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await sleep(300);
  const servedVer = await page.evaluate(async () => { try { return (await (await fetch('/api/config')).json()).version; } catch { return '?'; } });

  const data = await page.evaluate(async ({ puml, target }) => {
    const top = await (await fetch(`/api/trace/children/${puml}`)).json();
    const dirs = (top.children || []).filter((c) => String(c.uuid).startsWith('dir:'));
    // map each filename → set of distinct dir refs it appears under
    const fileToDirs = {};
    const perDir = [];
    for (const d of dirs) {
      const files = (d.children || []).map((f) => f.name); // children are INLINE in the rawbin:puml payload (per-dir re-fetch returns empty by design)
      perDir.push({ dir: d.uuid, childCount: d.childCount || 0, files });
      for (const n of files) (fileToDirs[n] = fileToDirs[n] || new Set()).add(d.uuid);
    }
    // idempotency: re-resolve every dir ref via /api/ior and check the uuid is STABLE (keyToUuid identity, no dup mint)
    const idem = [];
    for (const d of dirs) {
      const a = await (await fetch(`/api/ior/${encodeURIComponent(d.uuid)}`)).json().catch(() => null);
      const b = await (await fetch(`/api/ior/${encodeURIComponent(d.uuid)}`)).json().catch(() => null);
      idem.push({ dir: d.uuid, u1: a?.unit?.model?.uuid || null, u2: b?.unit?.model?.uuid || null, isFolder: a?.unit?.ior === 'ior:class:Folder' });
    }
    const toArr = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [...v]]));
    return { dirCount: dirs.length, dirUuids: dirs.map((d) => d.uuid), fileToDirs: toArr(fileToDirs), perDir, idem };
  }, { puml: PUML, target: TARGET });

  // ── discriminator 1: TARGET under ≥ N distinct dirs ──
  const targetDirs = data.fileToDirs[TARGET] || [];
  const revealOk = targetDirs.length >= 4; // architect: sprint-02/08/09/31 = 4 distinct
  R(`REVEAL: "${TARGET}" appears under ${targetDirs.length} DISTINCT dir nodes${targetDirs.length ? ':' : ''}`);
  targetDirs.slice(0, 6).forEach((d) => R(`   ${d.replace('dir:scrum.pmo/sprints/', '')}`));

  // ── no-collapse: 25 dir nodes carry 25 DISTINCT uuids (distinct physical dirs) ──
  const distinctDirUuids = new Set(data.dirUuids).size;
  const noCollapse = distinctDirUuids === data.dirCount && data.dirCount >= 2;

  // ── zero-new-mints: every dir ref re-resolves to the SAME uuid (idempotent keyToUuid identity, ior:class:Folder) ──
  const idemOk = data.idem.length > 0 && data.idem.every((x) => x.u1 && x.u1 === x.u2 && x.isFolder);
  const idemFail = data.idem.filter((x) => !x.u1 || x.u1 !== x.u2);
  R(`NO-DUP: ${data.dirCount} dir nodes → ${distinctDirUuids} distinct uuids (no-collapse=${noCollapse}); idempotent re-resolve (same uuid, ior:class:Folder)=${idemOk}${idemFail.length ? ` [${idemFail.length} non-idempotent]` : ''}`);

  // ── FAILABILITY: a filename under exactly ONE dir proves the multi-dir reveal discriminates (not "any file passes") ──
  const singles = Object.entries(data.fileToDirs).filter(([, ds]) => ds.length === 1).map(([n]) => n);
  const multis = Object.entries(data.fileToDirs).filter(([, ds]) => ds.length >= 2).map(([n]) => n);
  const failable = singles.length > 0 && multis.length > 0; // both exist → the "under N distinct dirs" test genuinely separates
  R(`FAILABILITY: single-dir files=${singles.length} · multi-dir files=${multis.length} (e.g. multi: ${multis.slice(0, 3).join(', ')}) → discriminator separates single vs multi = ${failable}`);

  await page.screenshot({ path: 'test-results/r4021p5/physical-tree.png' }).catch(() => {});
  const green = revealOk && noCollapse && idemOk && failable;
  const CAV = `[read-only live prod, served=${servedVer}, @390; structure via /api/trace/children (the tree's source) + /api/ior idempotency]`;
  R(`\n═══ T37.21 PART 5 verdict ═══\n${green
    ? `GREEN — the puml PHYSICAL tree reveals "${TARGET}" under ${targetDirs.length} DISTINCT physical dir nodes (Tron's same-name-different-dirs reveal); ${data.dirCount} dir nodes = ${distinctDirUuids} distinct keyToUuid('folder::'+relpath) identities, idempotent (re-resolve → same uuid, zero new mints); discriminator proven able-to-fail (single-dir vs multi-dir files coexist). ${CAV}`
    : `RED — reveal(${TARGET}≥4 dirs)=${revealOk}(${targetDirs.length}) · no-collapse=${noCollapse}(${distinctDirUuids}/${data.dirCount}) · idempotent-no-dup=${idemOk} · failable=${failable}. ${CAV}`}`);
  exit = green ? 0 : 1;
} finally { await browser.close().catch(() => {}); }
process.exit(exit);
