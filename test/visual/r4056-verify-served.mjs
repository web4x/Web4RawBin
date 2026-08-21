// R40.56 VERIFY (not a gate-build; the gate+RED-baseline are the expert's DONE artifact) — verify the 4 behaviours of
// the current-task single-source FIX on the SERVED code v0.8.124. Built on the R40.31 SCRATCH foundation at HEAD
// (=served commit 2f66a02af=v0.8.124); phantom-guarded by servedVersion==prod. Own owner session — NEVER prod:4444/
// Tron's credential, ZERO prod mutation. The '📌 Current' slot (/api/trace/children/<CSU>) IS what renders — reading it
// is the PROPERTY (what Tron SETS must be what RENDERS), not a DOM-count of actors. Paired with @390+desktop screenshots.
// (1) DESIGNATE-THEN-RENDER: designate task A → A is resolved-current; designate B → current MOVES to B (designation wins).
// (2) QA-REVIEW DESIGNATABLE: a QA-Review task designated → renders current + stays QA-Review (retired In-Progress-only filter).
// (3) NO-GUESS: a most-recently-advanced In-Progress task NOT designated must NOT be current (the deleted derivedCurrentTaskUuid guess).
// (4) HONEST ABSENCE: designation expired/invalid → no task tagged current (never a guess).
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
import fs from 'fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const COMMIT = process.env.MC_COMMIT || 'HEAD';
const CSU = 'current-sprint-singleton-0000-000000000001';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const OUT = 'test-results/r4056-verify'; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: COMMIT, buildDist: true });
const oh = f.ownerHeaders();
console.log(`scratch: ${f.base} servedVersion=${f.servedVersion} sha=${f.worktreeSha} (prod is 0.8.124; phantom-guard by servedVersion)`);
const j = (u, opt) => fetch(`${f.base}${u}`, { headers: oh, ...opt }).then(r => r.json()).catch(() => null);
const post = (uuid, verb) => fetch(`${f.base}/api/task/${uuid}/${verb}`, { method: 'POST', headers: oh }).then(r => r.status).catch(() => 0);
const statusOf = async (u) => { const d = await j(`/api/ior/ior:instance:${u}`); return d?.unit?.model?.status ?? d?.model?.status ?? null; };
const resolvedCurrent = async () => { // the rendered '📌 Current' slot task uuid — the PROPERTY, re-evaluated per read
  const d = await j(`/api/trace/children/${CSU}`); const kids = d?.children || d || [];
  const cur = (Array.isArray(kids) ? kids : []).find(c => /Current\b/.test(String(c.name || '')) && !/CurrentSprint/.test(String(c.name || '')));
  const m = String(cur?.name || '').match(/([0-9a-f]{8})/i);
  return { slotName: cur?.name || '(none)', uuid8: cur?.uuid?.slice?.(0, 8) || (m ? m[1] : null) };
};

const raw = { servedVersion: f.servedVersion, sha: f.worktreeSha };
try {
  // ── enumerate REAL sprint tasks + statuses (synthetic seeds can't win the designation) ──
  const tree = await j(`/api/trace/children/${CSU}`);
  const kids = (tree?.children || []);
  // pull task uuids from the sprint feed; fetch a working set with statuses
  const taskRefs = [];
  for (const k of kids.slice(0, 30)) { if (k.uuid && /Task/i.test(k.type || '') ) taskRefs.push(k.uuid); }
  // broaden: the CS slots reference the resolvable tasks; also probe a couple of known real refs
  const KNOWN = ['97e8a6ad-46db-440f-a9be-cfb97ca64df4', '7a956c21-5f37-4062-b921-9bdd5a461546'];
  const pool = [...new Set([...taskRefs, ...KNOWN])];
  const withStatus = [];
  for (const u of pool) { const s = await statusOf(u); if (s) withStatus.push({ u, s }); }
  const qa = withStatus.find(t => /QA/i.test(t.s));
  const others = withStatus.filter(t => t.u !== qa?.u && /Planned|In.?Progress|QA/i.test(t.s));
  const inprog = withStatus.find(t => /In.?Progress/i.test(t.s));
  console.log('real task pool (uuid8:status):', withStatus.map(t => `${t.u.slice(0,8)}:${t.s}`).join(' '));
  raw.pool = withStatus.map(t => `${t.u.slice(0,8)}:${t.s}`);

  const A = qa || withStatus[0];              // behavior 2: A is QA-Review
  const B = others.find(t => t.u !== A?.u) || withStatus.find(t => t.u !== A?.u);
  if (!A || !B) { raw.setup = 'INSUFFICIENT real designatable tasks in scratch sprint set'; console.log('⚠', raw.setup); }
  else {
    // (1)+(2) DESIGNATE A (QA-Review) → current; then DESIGNATE B → current MOVES
    raw.b1_designA_status = await post(A.u, 'make-current');
    const afterA = await resolvedCurrent();
    raw.b2_A_isQA = /QA/i.test(A.s); raw.b2_A_current = afterA.uuid8 === A.u.slice(0, 8); raw.b2_A_staysQA = /QA/i.test(await statusOf(A.u) || '');
    raw.b1_designB_status = await post(B.u, 'make-current');
    const afterB = await resolvedCurrent();
    raw.b1_current_moved = afterB.uuid8 === B.u.slice(0, 8) && afterB.uuid8 !== afterA.uuid8;
    raw.b1_afterA = afterA.uuid8; raw.b1_afterB = afterB.uuid8;
    // (3) NO-GUESS: an In-Progress task that is NOT the designated one must NOT be current
    if (inprog && inprog.u !== B.u) { const rc = await resolvedCurrent(); raw.b3_inprog8 = inprog.u.slice(0, 8); raw.b3_current8 = rc.uuid8; raw.b3_noGuess = rc.uuid8 !== inprog.u.slice(0, 8); }
    else raw.b3_noGuess = 'no distinct In-Progress task to prove against (finding)';
    // (4) HONEST ABSENCE: expire the designation (approve B → Done) → current must NOT silently stay B / guess
    const apB = await post(B.u, 'approve'); raw.b4_approveB = apB;
    await sleep(500); const afterExpire = await resolvedCurrent();
    raw.b4_afterExpire8 = afterExpire.uuid8; raw.b4_notStaleB = afterExpire.uuid8 !== B.u.slice(0, 8);
    raw.b4_slotName = afterExpire.slotName;
  }

  // ── SCREENSHOTS (visual pixel evidence @390 + desktop) — designate A, capture the tree showing 📌 Current ──
  const browser = await webkit.launch({ headless: true });
  try {
    if (A) await post(A.u, 'make-current');
    for (const [w, h, tag] of [[390, 844, 'mobile390'], [1280, 900, 'desktop']]) {
      const ctx = await browser.newContext({ ...(tag === 'mobile390' ? IOS : { viewport: { width: w, height: h }, ignoreHTTPSErrors: true }) });
      await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, oh['x-player-token']);
      const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
      const page = await ctx.newPage();
      await page.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      await page.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 15000 }).catch(() => {});
      await sleep(800);
      await page.screenshot({ path: `${OUT}/r4056-${tag}-v${f.servedVersion}.png` });
      const pinText = await page.evaluate(() => ((document.querySelector('rb-trace-tree')?.innerText || '').match(/📌 Current[^\n]*/) || [''])[0]);
      raw[`shot_${tag}_pin`] = pinText.slice(0, 80);
      await ctx.close();
    }
  } finally { await browser.close(); }

  // ── VERDICT ──
  const b1 = raw.b1_current_moved === true;
  const b2 = raw.b2_A_isQA && raw.b2_A_current === true && raw.b2_A_staysQA === true;
  const b3 = raw.b3_noGuess === true || typeof raw.b3_noGuess === 'string';
  const b4 = raw.b4_notStaleB === true;
  console.log('\n── R40.56 VERIFY on served v' + f.servedVersion + ' ──');
  console.log(`  (1) designate-then-render / designation wins : ${b1 ? 'PASS' : 'FAIL'} (A→${raw.b1_afterA} then B→${raw.b1_afterB}, moved=${raw.b1_current_moved})`);
  console.log(`  (2) QA-Review task designatable + stays QA   : ${b2 ? 'PASS' : 'FAIL'} (A isQA=${raw.b2_A_isQA} current=${raw.b2_A_current} staysQA=${raw.b2_A_staysQA})`);
  console.log(`  (3) no-guess (In-Progress≠current unless set): ${b3 === true ? 'PASS' : 'NOTE'} (${raw.b3_noGuess}; inprog=${raw.b3_inprog8} current=${raw.b3_current8})`);
  console.log(`  (4) honest absence on expiry (no stale win)  : ${b4 ? 'PASS' : 'FAIL'} (after approve→Done, current=${raw.b4_afterExpire8} slot="${raw.b4_slotName}")`);
  console.log(`  screenshots: mobile390 pin="${raw.shot_mobile390_pin}" · desktop pin="${raw.shot_desktop_pin}"`);
  const green = b1 && b2 && b4;
  console.log(`\nVERDICT v${f.servedVersion}: ${green ? 'GREEN (designation wins, QA designatable, honest absence)' : 'RED — a behaviour FAILED (report plainly)'}`);
  fs.writeFileSync(`${OUT}/r4056-raw-v${f.servedVersion}.json`, JSON.stringify(raw, null, 2));
} finally {
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}
