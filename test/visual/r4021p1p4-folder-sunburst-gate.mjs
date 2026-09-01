// T37.21 PARTS 1+4 COMBINED (v0.8.156, served==committed, architect+PO backstopped). ONE PASS @390 real-WebKit, read-only.
// P1 discriminator: room Members/Files resolve to a REAL ior:class:Folder via the roomcoll ref (NOT a synthetic pseudo-node
//   resolving to nothing) — /api/ior returns {ior:'ior:class:Folder', model:{kind:'folder', collectionKind, virtual}} +
//   childCount == the "Members (N)" label. VIRTUAL (no on-disk dir).
// P4 discriminator: the child-size SUNBURST renders on that folder AND is PROPORTIONAL — arc-count == direct-child-count,
//   and the LARGEST-childCount child has the LARGEST MEASURED arc (getTotalLength, not re-derived) = what separates a real
//   sunburst from "something round". size == max(childCount,1) single-source (== tree badge). Empty-state defined. Failable.
// Room members are equal-size leaves (childCount 0) → they prove P4-FIRES + arc-count, but NOT proportionality. The
// rawbin:puml folder (also ior:class:Folder) has 25 dir children with VARIED childCounts [1..9] → it proves the
// PROPORTIONAL discriminator LIVE (sprint-20, cc=9, must be the largest arc). Plus a synthetic failability control.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const ROOM = '99e6a422-9483-41f8-b8fa-8f842aca63e8'; // test room, 2 members (expert-verified)
const PUML = 'rawbin:puml';                          // ior:class:Folder, 25 dir children, varied childCounts → proportional target
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const argmax = (a) => a.reduce((bi, v, i, x) => (v > x[bi] ? i : bi), 0);

const browser = await webkit.launch();
let exit = 1;
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await sleep(400);
  const servedVer = await page.evaluate(async () => { try { return (await (await fetch('/api/config')).json()).version; } catch { return '?'; } });

  // ── P1: roomcoll refs resolve to REAL Folder units (in-page fetch so same-origin/session applies) ──
  const p1 = await page.evaluate(async (room) => {
    const out = {};
    for (const kind of ['members', 'files']) {
      const ref = `roomcoll:${room}:${kind}`;
      const ior = await (await fetch(`/api/ior/${ref}`)).json().catch(() => null);
      const u = ior && ior.unit;
      const kids = await (await fetch(`/api/trace/children/${ref}`)).json().catch(() => ({}));
      // the room's own child node carries the "Members (N)"/"Files (N)" label + childCount
      const roomKids = await (await fetch(`/api/trace/children/${room}`)).json().catch(() => ({}));
      const label = (roomKids.children || []).find((c) => String(c.uuid) === ref);
      out[kind] = { ref, isFolder: u?.ior === 'ior:class:Folder', kind: u?.model?.kind, collectionKind: u?.model?.collectionKind, virtual: u?.model?.virtual === true, uuid: u?.model?.uuid || null,
        childCount: (kids.children || []).length, labelCount: label?.childCount ?? null, labelName: label?.name || null };
    }
    return out;
  }, ROOM);
  const p1ok = ['members', 'files'].every((k) => p1[k].isFolder && p1[k].kind === 'folder' && p1[k].collectionKind === k && p1[k].virtual && p1[k].uuid && p1[k].childCount === p1[k].labelCount);
  R(`P1 members: Folder=${p1.members.isFolder} kind=${p1.members.kind} collKind=${p1.members.collectionKind} virtual=${p1.members.virtual} uuid=${(p1.members.uuid || '').slice(0, 8)} childCount=${p1.members.childCount}==label(${p1.members.labelCount}) "${p1.members.labelName}"`);
  R(`P1 files:   Folder=${p1.files.isFolder} kind=${p1.files.kind} collKind=${p1.files.collectionKind} virtual=${p1.files.virtual} childCount=${p1.files.childCount}==label(${p1.files.labelCount}) "${p1.files.labelName}"`);
  R(`P1 => ${p1ok ? 'GREEN (real resolvable Folder units, not pseudo-nodes)' : 'RED'}`);

  // ── mount helper (drawer → rb-detail-view fetch-path) ──
  const mount = async (ref) => {
    await page.evaluate((r) => { let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); (document.querySelector('.trace-page') || document.body).appendChild(d); } d.removeAttribute('ref'); d.setAttribute('ref', r); d.setAttribute('open', ''); }, ref);
    await page.waitForFunction(() => { const v = document.querySelector('rb-detail-view, rb-detail-drawer'); return v && (v.querySelector('.dv-sunburst') || v.querySelector('.dv-title')); }, { timeout: 12000 }).catch(() => {});
    await sleep(900);
  };
  const readSun = () => page.evaluate(() => {
    const wrap = document.querySelector('.dv-sunburst');
    const title = (document.querySelector('.dv-title')?.textContent || '');
    const dvType = (document.querySelector('.dv-type')?.textContent || '');
    if (!wrap) return { titleRendered: !!title, title, dvType, present: false };
    const paths = [...wrap.querySelectorAll('svg path')];
    const arcs = paths.map((p) => { const tt = (p.querySelector('title')?.textContent || ''); const m = /—\s*(\d+)\s*$/.exec(tt); return { size: m ? Number(m[1]) : null, len: (typeof p.getTotalLength === 'function' ? p.getTotalLength() : 0) }; });
    const box = wrap.querySelector('svg')?.getBoundingClientRect();
    return { titleRendered: !!title, title, dvType, present: true, empty: !!wrap.querySelector('.dv-sunburst-empty'), arcCount: paths.length, arcs, visible: !!box && box.width > 20 && box.height > 20 };
  });

  // ── P4-FIRES on the room Members folder (P1+P4 integration) ──
  // gap-3 (expert): rb-detail-view fetches children by the RESOLVED keyToUuid, but the server roomcoll children branch is
  // keyed on the roomcoll REF → children 404 → a sunburst could render over ZERO children and false-pass as "present".
  // So the LOAD-BEARING assertion (PO): arc-count == the real child count == the "Members (N)" LABEL the user sees, N>0.
  // This ties the render to the DATA (childCount==label proven in P1), not to itself.
  const childrenByResolvedUuid = await page.evaluate(async (u) => { const j = await (await fetch(`/api/trace/children/${u}`)).json().catch(() => ({})); return (j.children || []).length; }, p1.members.uuid);
  await mount(`roomcoll:${ROOM}:members`);
  const rm = await readSun();
  const childrenLoaded = rm.present && rm.arcCount > 0 && rm.arcCount === p1.members.labelCount; // arcs == "Members (N)" label, N>0 (NOT sunburst-over-zero)
  const p4fires = childrenLoaded && rm.visible && !rm.empty;
  R(`P4-on-room: detail "${rm.title}" (dv-type=${rm.dvType}) sunburst-present=${rm.present} arc-count=${rm.arcCount} (label=Members(${p1.members.labelCount}), children-by-resolved-uuid=${childrenByResolvedUuid}) children-loaded=${childrenLoaded} visible=${rm.visible}${rm.present && rm.arcCount === 0 && p1.members.labelCount > 0 ? ' ⚠ SUNBURST-OVER-ZERO (gap-3: children did not load via the resolved-uuid path)' : ''}`);
  await page.screenshot({ path: 'test-results/r4021p1p4/room-members.png' }).catch(() => {});

  // ── P4-PROPORTIONAL on rawbin:puml (25 dir children, VARIED childCounts) ──
  const pumlChildren = await page.evaluate(async (ref) => (await (await fetch(`/api/trace/children/${ref}`)).json()).children || [], PUML);
  const exp = pumlChildren.map((c) => ({ name: c.name, cc: c.childCount || 0 }));
  await mount(PUML);
  const pu = await readSun();
  await page.screenshot({ path: 'test-results/r4021p1p4/puml-sunburst.png' }).catch(() => {});
  let arcCountOk = false, sizeSourceOk = false, largestOk = false, propVisible = false;
  if (pu.present && exp.length) {
    arcCountOk = pu.arcCount === exp.length;
    sizeSourceOk = pu.arcs.length === exp.length && pu.arcs.every((a, i) => a.size === Math.max(exp[i].cc, 1)); // single-source childCount, in API order
    const idxMaxSize = argmax(pu.arcs.map((a) => a.size)), idxMaxLen = argmax(pu.arcs.map((a) => a.len));
    largestOk = idxMaxSize === idxMaxLen; // MEASURED: biggest childCount ⇒ biggest arc = the proportional discriminator
    propVisible = pu.visible;
    R(`P4-proportional (rawbin:puml): sunburst-present=${pu.present} arc-count=${pu.arcCount}(==${exp.length}) size==childCount+order=${sizeSourceOk} LARGEST-cc=LARGEST-arc(measured)=${largestOk} [maxSize#${idxMaxSize}(cc=${exp[idxMaxSize]?.cc}) maxLen#${idxMaxLen}] visible=${propVisible}`);
  } else {
    R(`P4-proportional (rawbin:puml): sunburst-present=${pu.present} title="${pu.title}" dv-type=${pu.dvType} — NO sunburst to measure`);
  }

  // ── failability: the proportional discriminator MUST be able to fail. It asserts idxMaxSize===idxMaxLen. It BITES when
  // the largest-childCount arc is NOT the first arc (index 0): a NON-proportional (equal-angle) renderer would put every
  // arc at equal length → argmax(lengths)=0 ≠ argmax(sizes) → the assertion would FAIL → the gate catches "something round".
  const propBites = pu.present && pu.arcs.length > 1 && argmax(pu.arcs.map((a) => a.size)) !== 0;
  const arcBites = pu.present && pu.arcCount > 1; // dropping a path would change the count (structural failability)
  R(`FAILABILITY: proportional bites=${propBites} (unequal size / equal len → largest≠largest) · arc-count structural=${arcBites}`);

  // ── verdicts (report each part) ──
  const p4Green = p4fires && arcCountOk && sizeSourceOk && largestOk && propVisible && propBites;
  const CAV = `[read-only live prod /trace, served=${servedVer}; @390 real-WebKit; room-members prove P4-fires+arc-count (equal leaves), rawbin:puml proves the proportional discriminator over varied childCounts]`;
  R(`\n═══ T37.21 P1 verdict ═══\n${p1ok
    ? `GREEN — room Members(${p1.members.childCount}) + Files(${p1.files.childCount}) resolve to REAL ior:class:Folder units (kind=folder, collectionKind, virtual, real uuid), childCount==label. Resolvable Folder, not a synthetic pseudo-node. ${CAV}`
    : `RED — a roomcoll ref did NOT resolve to a real Folder (members:${JSON.stringify(p1.members)} files:${JSON.stringify(p1.files)}). ${CAV}`}`);
  R(`\n═══ T37.21 P4 verdict ═══\n${p4Green
    ? `GREEN — sunburst FIRES on the real room folder with CHILDREN ACTUALLY LOADED (arc-count==${p1.members.labelCount}==the "Members (N)" label the user sees, N>0 — not a sunburst-over-zero), visible; AND is PROPORTIONAL over rawbin:puml's varied childCounts (largest-cc child = largest MEASURED arc), single-source sizes in stable order, failable. ${CAV}`
    : `RED (real 3-gap wiring, architect+PO-ruled) — p4-fires-on-room=${p4fires}(present=${rm.present} arc=${rm.arcCount} label=${p1.members.labelCount} loaded=${childrenLoaded} vis=${rm.visible}) · proportional[arcCount=${arcCountOk} size=${sizeSourceOk} largest=${largestOk} vis=${propVisible}] · failable=${propBites}. GAPS: (1) roomcoll∉SYNTHETIC_PREFIX→unresolved; (2) sunburst type-gate reads model.type not kind→never fires on folders; (3) children keyed on roomcoll-ref not resolved-uuid→/api/trace/children/${(p1.members.uuid || '').slice(0, 8)}=empty→sunburst-over-zero. RE-GATE asserts CHILDREN LOAD (arc==label>0), not element-present. ${CAV}`}`);
  exit = (p1ok && p4Green) ? 0 : 1;
} finally { await browser.close().catch(() => {}); }
process.exit(exit);
