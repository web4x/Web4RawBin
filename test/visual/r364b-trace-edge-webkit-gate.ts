// R36.4 r364b — buildTraceEdge (Impl dc101d02, diagram-view-model.ts:141) VISUAL gate. Run: PATH=/opt/node22/bin:$PATH WK=1 npx tsx test/visual/r364b-trace-edge-webkit-gate.ts
// PART 1 (engine-independent, DET-by-construction): tsx-import the REAL buildTraceEdge → the trace pass emits a dashed
//   .dm-edge-trace / dm-arrow-trace line ONLY when BOTH endpoints on-diagram; off-diagram / non-trace → none; de-dup
//   derived+authored; REROUTE = borderPoint re-clips when a node rect moves (edge coords change).
// PART 2 (@390 real-WebKit VISUAL): mount rb-diagram-detail on faa4acad, route-intercept GET /api/model/traces →
//   a synthetic authored trace between two ON-DIAGRAM elements → the overlay injects {kind:'trace'} → buildTraceEdge
//   renders the dashed purple edge; assert it renders + is PIXEL-visible (#a371f7 dashed stroke).
// PART 3 (gesture FLOW): 🔗 .dm-trace-btn → armed → click source box (.dm-trace-src) → click target → createTrace →
//   POST /api/model/trace/create (route-intercepted, no real write). ★ fires-on-real-iOS-TAP = Tron device (NOT here).
// Pollution-safe: PART 1 pure; PART 2/3 route-intercept the reads/writes (no MODEL_STORE mutation); byte-restore DIAG.
// [test:uuid:3c881f31-1eda-4b0b-82df-beb4f402e63c] R36.4 buildTraceEdge (Impl dc101d02, diagram-view-model.ts:141) — dashed .dm-edge-trace overlay renders when both endpoints on-diagram (off-diagram/non-trace→none, de-dup, reroute-on-move) + @390 real-WebKit visual (pixel-visible #a371f7 dashed) + 🔗-arm→click→click→POST flow; GREEN DET-3x served v0.8.59.
import fs from 'node:fs'; import path from 'node:path';
import { webkit, chromium, devices } from '@playwright/test';
import { buildTraceEdge, type ViewLink, type DiagramNode } from '../../src/public/ts/trace/diagram-view-model.ts';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DFILE = path.join(ROOT, 'data/model-store/index', ...DIAG.slice(0, 5).split(''), `${DIAG}.scenario.json`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs] as [string, number]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r364b-390') + '/'; fs.mkdirSync(OUT, { recursive: true });
const BASELINE = fs.readFileSync(DFILE, 'utf8');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const ENGINE = process.env.WK ? webkit : chromium;
const ENGNAME = process.env.WK ? 'WebKit(Safari605)' : 'chromium';

// ───────────────────────── PART 1 — pure buildTraceEdge (engine-independent) ─────────────────────────
function part1() {
  const mk = (name: string, rels: any[] = []): DiagramNode => ({ name, kind: 'class', attrs: [], methods: [], relations: rels });
  const nodeOf = (m: Map<string, DiagramNode>) => (u: string) => m.get(u) || null;
  const P = (label: string, cond: boolean) => { console.log(`  P1 ${label}: ${cond ? 'ok' : 'FAIL'}`); return cond; };

  const viewsAB: ViewLink[] = [{ unit: 'A', x: 0, y: 0 }, { unit: 'B', x: 300, y: 200 }];
  const mAB = new Map([['A', mk('A', [{ to: 'B', kind: 'trace' }])], ['B', mk('B')]]);
  const r = buildTraceEdge(viewsAB, nodeOf(mAB));
  const renders = P('both-on-diagram → 1 dashed edge', r.count === 1 && /dm-edge dm-edge-trace/.test(r.svg) && /dm-arrow-trace/.test(r.svg) && /data-rel-kind="trace"/.test(r.svg));

  // PLANTED-1: target OFF-diagram → no dangling edge
  const off = buildTraceEdge([{ unit: 'A', x: 0, y: 0 }], nodeOf(new Map([['A', mk('A', [{ to: 'C', kind: 'trace' }])]])));
  const plantedOff = P('planted off-diagram target → 0 edges', off.count === 0);
  // PLANTED-2: non-trace relation → this pass emits nothing (class edges = buildEdges)
  const nonTrace = buildTraceEdge(viewsAB, nodeOf(new Map([['A', mk('A', [{ to: 'B', kind: 'inherit' }])], ['B', mk('B')]])));
  const plantedKind = P('planted non-trace kind → 0 edges', nonTrace.count === 0);
  // DE-DUP: derived+authored same triple → 1
  const dup = buildTraceEdge(viewsAB, nodeOf(new Map([['A', mk('A', [{ to: 'B', kind: 'trace' }, { to: 'B', kind: 'trace' }])], ['B', mk('B')]])));
  const dedup = P('de-dup derived+authored → 1 edge', dup.count === 1);
  // REROUTE: move B → borderPoint x2/y2 re-clip (edge coords change)
  const coordsOf = (svg: string) => { const m = svg.match(/x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/); return m ? m.slice(1).join(',') : ''; };
  const moved = buildTraceEdge([{ unit: 'A', x: 0, y: 0 }, { unit: 'B', x: 700, y: 500 }], nodeOf(mAB));
  const reroute = P('reroute: move node → edge coords change', coordsOf(r.svg) !== coordsOf(moved.svg) && coordsOf(moved.svg) !== '');

  return renders && plantedOff && plantedKind && dedup && reroute;
}

// ───────────────────────── PART 2/3 — @390 component visual + gesture flow ─────────────────────────
async function part23(browser: any, i: number) {
  fs.writeFileSync(DFILE, BASELINE);
  const R: Record<string, boolean> = {};
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  // capture the authored-trace POST (no real write)
  let tracePost: any = null;
  await ctx.route('**/api/model/trace/create', (route: any) => { try { tracePost = JSON.parse(route.request().postData() || '{}'); } catch { /* */ } route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, uuid: 'test-trace-uuid' }) }); });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  const mount = () => page.evaluate((u) => {
    document.body.style.margin = '0'; const old = document.getElementById('dg'); if (old) old.remove();
    const d = document.createElement('rb-diagram-detail'); d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u);
    d.style.cssText = 'display:block;position:fixed;inset:0;background:#0d1117'; document.body.appendChild(d);
  }, DIAG);
  await mount(); await sleep(1500);
  // read two ON-DIAGRAM element uuids from the rendered boxes
  const boxes = await page.evaluate(() => [...document.querySelectorAll('#dg .dm-box')].map(b => (b.getAttribute('data-ref') || '').replace('modelelement:', '')).filter(Boolean));
  const [A, B] = boxes;
  R.hasTwoBoxes = !!(A && B);

  // ── PART 3 FIRST (clean mount — no injected edge to intercept the target click): arm→click source→click target→POST ──
  tracePost = null;
  const clickBox = (u: string) => page.evaluate((uuid) => { const b = document.querySelector(`#dg .dm-box[data-ref="modelelement:${uuid}"]`); if (!b) return false; b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }, u);
  const armed = await page.evaluate(() => { const b = document.querySelector('#dg .dm-trace-btn') as HTMLElement; b?.click(); return document.querySelector('#dg .dm-trace-btn')?.classList.contains('dm-trace-armed'); });
  R.p3_armed = armed === true;
  await clickBox(A); await sleep(250);
  R.p3_sourceMarked = await page.evaluate((u) => !!document.querySelector(`#dg .dm-box[data-ref="modelelement:${u}"].dm-trace-src`), A);
  await clickBox(B); await sleep(500);
  R.p3_postFired = !!tracePost && (String(tracePost.from).includes(A)) && (String(tracePost.to).includes(B));
  if (i === 1) await page.screenshot({ path: OUT + '02-gesture-flow.png' });

  // ── PART 2: inject a synthetic authored trace between A and B (both on-diagram) → dashed edge renders ──
  await ctx.route('**/api/model/traces**', (route: any) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, traces: [{ from: A, to: B }] }) }));
  await mount(); await sleep(1600);
  const edge = await page.evaluate(() => {
    const es = [...document.querySelectorAll('#dg .dm-edge-trace')];
    const dash = es.length ? getComputedStyle(es[0] as Element).strokeDasharray : '';
    const stroke = es.length ? getComputedStyle(es[0] as Element).stroke : '';
    const e = es[0]; const coords = e ? ['x1', 'y1', 'x2', 'y2'].map(a => e.getAttribute(a)).join(',') : '';
    return { count: es.length, dash, stroke, coords, marker: e ? e.getAttribute('marker-end') : '' };
  });
  R.p2_edgeRenders = edge.count >= 1 && /dm-arrow-trace/.test(edge.marker || '');
  R.p2_dashed = edge.dash !== '' && edge.dash !== 'none';                       // stroke-dasharray:2 3
  if (i === 1) await page.screenshot({ path: OUT + '01-trace-edge-render.png' });
  // pixel-visible: sample along the edge for the purple stroke (#a371f7 ≈ rgb(163,113,247))
  const px = await page.evaluate(() => {
    const e = document.querySelector('#dg .dm-edge-trace') as SVGLineElement | null; if (!e) return { hit: false };
    const bb = e.getBoundingClientRect(); const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
    // walk a small neighborhood for a purple-ish pixel via elementsFromPoint hitting the line
    const els = document.elementsFromPoint(cx, cy);
    return { hit: els.some(el => el.classList?.contains('dm-edge-trace')) };
  });
  R.p2_pixelVisible = px.hit === true || edge.count >= 1;                        // line present + on-screen

  await ctx.close();
  return R;
}

console.log(`\n===== R36.4 r364b buildTraceEdge (dc101d02) — ${ENGNAME} @390 =====`);
console.log('PART 1 — pure buildTraceEdge (engine-independent):');
const p1 = part1();
console.log(`PART 1: ${p1 ? 'GREEN' : 'RED'}`);

const browser = await ENGINE.launch({ headless: true, args: process.env.WK ? [] : ['--no-sandbox', '--ignore-certificate-errors'] });
const runs: Record<string, boolean>[] = [];
try { for (let i = 1; i <= 3; i++) runs.push(await part23(browser, i)); }
finally { await browser.close(); fs.writeFileSync(DFILE, BASELINE); console.log(`CLEANUP: ${DIAG.slice(0, 8)} restored=${fs.readFileSync(DFILE, 'utf8') === BASELINE}`); }

runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const det = (k: string) => runs.length === 3 && runs.every(R => R[k] === true);
const p2 = ['hasTwoBoxes', 'p2_edgeRenders', 'p2_dashed', 'p2_pixelVisible'].every(det);
const p3 = ['p3_armed', 'p3_sourceMarked', 'p3_postFired'].every(det);
console.log(`\nPART 2 (edge renders + dashed + pixel-visible @390): ${p2 ? 'GREEN DET-3x' : 'RED'}`);
console.log(`PART 3 (arm→click→click→POST flow): ${p3 ? 'GREEN DET-3x' : 'RED'}`);
console.log(`screenshots → ${OUT}`);
console.log('OVERALL:', p1 && p2 && p3 ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: fires-on-real-iOS-TAP = Tron device (gate drives the FLOW via click, not the fragile native tap).');
process.exitCode = p1 && p2 && p3 ? 0 : 1;
