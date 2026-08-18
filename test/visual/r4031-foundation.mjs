// R40.31 ISOLATED SCRATCH-SERVER FOUNDATION (independent verifier; expert's owner-action smoke REUSES it — branch A, no dup).
// Exports setupFoundation() → { base, ownerHeaders(), seeded:{qaReview,planned,refuse}, teardown() }.
// Isolation: git worktree of HEAD (own scenario/index) + node_modules symlink + dist (symlink main's or build) + scratch
// server on NON-4444 ports (env) + owner LIVE-SESSION (WS IDENTIFY makes tokenToClient.has(OWNER_TOKEN) true, server.ts:952)
// → POST /api/server-manager/session mints the sm_session cookie. Owner cred = ServerManagerGuard.ts OWNER_TOKEN read at
// RUNTIME via regex, HEADERS-ONLY, NEVER logged/echoed/committed (hygiene #0). teardown-in-finally kills server + removes the
// worktree + asserts prod:4444 untouched + 0 leftover scratch worktrees. Seeds a two-keyed passing-Test chain so approveByOwner
// genuinely reaches Done + fires publishUnitChanged (isolates the transport variable from the orphaned-verdict defect).
// Run directly (`node r4031-foundation.mjs`) = self-smoke + stub-must-fail. Scratch-only, NEVER Tron's data.
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // scratch + prod are localhost self-signed; harness-local only

const MAIN = '/var/dev/Workspaces/web4x/Web4RawBin';
const NODE22 = '/opt/node22/bin/node';
const TSX = path.join(MAIN, 'node_modules/tsx/dist/cli.mjs');
const HTTPS_PORT = Number(process.env.R4031_HTTPS_PORT || 4643);
const PORT = Number(process.env.R4031_PORT || 4743);
const BASE = `https://localhost:${HTTPS_PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── owner cred: read the OWNER_TOKEN literal at RUNTIME (ServerManagerGuard.ts, INV-G2 one-location). NEVER logged. ──
function readOwnerToken() {
  const src = fs.readFileSync(path.join(MAIN, 'src/ts/server/ServerManagerGuard.ts'), 'utf8');
  const m = /OWNER_TOKEN\s*=\s*'([0-9a-fA-F-]{36})'/.exec(src);
  if (!m) throw new Error('OWNER_TOKEN literal not found (ServerManagerGuard.ts) — cannot owner-auth');
  return m[1];
}

// ── seed: write a sharded scenario unit into the worktree index ──
function shardPath(root, uuid) { return path.join(root, 'scenario/index', ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`); }
function writeUnit(root, uuid, ior, model, ownerIor) {
  const p = shardPath(root, uuid);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify({ ior, model: { uuid, ...model }, ...(ownerIor ? { ownerIor } : {}) }, null, 2) + '\n');
}
const QA_CHECKLIST = '- [x] Planned\n- [x] In Progress\n  - [x] refinement\n  - [x] implementing\n  - [x] testing\n- [x] QA Review';
const DONE_CHECKLIST = '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [x] Done';
const PLANNED_CHECKLIST = '- [x] Planned';

function seedUnits(root) {
  const tag = randomUUID().slice(0, 8);
  const ref = (u) => `ior:instance:${u}`;
  // qaReview chain: Task → Req → UC → Method → Impl(markerPending:false) ↔ Test(pass, two-keyed)
  const impl = randomUUID(), test = randomUUID(), method = randomUUID(), uc = randomUUID(), req = randomUUID(), qa = randomUUID();
  writeUnit(root, test, 'ior:class:Test', { name: `scratch-test ${tag}`, implementations: [ref(impl)], status: 'pass', sourceFile: 'ior:file:test/visual/r4031-foundation.mjs' }, ref(impl));
  writeUnit(root, impl, 'ior:class:Implementation', { name: `scratch-impl ${tag}`, markerPending: false, tests: [ref(test)], sourceFile: 'ior:file:src/scratch.ts' }, ref(method));
  writeUnit(root, method, 'ior:class:Method', { name: `scratch.method ${tag}`, implementations: [ref(impl)] }, ref(uc));
  writeUnit(root, uc, 'ior:class:UseCase', { name: `scratch UC ${tag}`, method: ref(method) }, ref(req));
  writeUnit(root, req, 'ior:class:Requirement', { name: `scratch REQ ${tag}`, useCases: [ref(uc)] });
  writeUnit(root, qa, 'ior:class:Task', { name: `scratch QA-Review task ${tag}`, status: 'QA Review', statusChecklist: QA_CHECKLIST, coveredRequirements: [ref(req)], requirements: [ref(req)] });
  // planned task (make-current → In Progress + stamp)
  const planned = randomUUID();
  writeUnit(root, planned, 'ior:class:Task', { name: `scratch Planned task ${tag}`, status: 'Planned', statusChecklist: PLANNED_CHECKLIST, coveredRequirements: [ref(req)] });
  // refuse task: Done → approve 409 (not in APPROVE_STATUSES) AND make-current 409 (not workable), byte-identical
  const refuse = randomUUID();
  writeUnit(root, refuse, 'ior:class:Task', { name: `scratch Done/refuse task ${tag}`, status: 'Done', statusChecklist: DONE_CHECKLIST, coveredRequirements: [ref(req)] });
  return { qaReview: qa, planned, refuse, evidenceReq: req };
}

// ADDITIVE hook: attach the seeded passing-Test evidence chain to a REAL task (in the SCRATCH worktree only) so approveByOwner
// can reach Done+emit on it — used when landing-3 exercises a REAL non-eager QA-Review task (a full /api/ior citizen that renders
// controls) rather than the synthetic seed (a model-store stub that doesn't). Scratch-only, torn down with the worktree.
function attachEvidenceToTask(root, taskUuid, evidenceReq) {
  const p = shardPath(root, taskUuid);
  if (!fs.existsSync(p)) throw new Error(`attachEvidenceTo: task ${taskUuid} not found in worktree index`);
  const u = JSON.parse(fs.readFileSync(p, 'utf8'));
  u.model.coveredRequirements = Array.isArray(u.model.coveredRequirements) ? u.model.coveredRequirements : [];
  const ref = `ior:instance:${evidenceReq}`;
  if (!u.model.coveredRequirements.includes(ref)) u.model.coveredRequirements.push(ref); // StepEvidence walks ALL coveredReqs → the injected passing Test satisfies 'testing'
  fs.writeFileSync(p, JSON.stringify(u, null, 2) + '\n');
}

// ── owner LIVE session: WS IDENTIFY (registers OWNER_TOKEN in tokenToClient) then POST session → sm_session cookie ──
function openOwnerWs(ownerToken) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://localhost:${HTTPS_PORT}`, { rejectUnauthorized: false });
    const t = setTimeout(() => reject(new Error('owner WS: no PROFILE within 15s')), 15000);
    ws.on('open', () => {}); // server sends 'welcome' first
    ws.on('message', (raw) => {
      let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.type === 'welcome') ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: ownerToken, deviceId: 'r4031-owner', name: 'r4031-owner', screenWidth: 1, screenHeight: 1, platform: 'node' }));
      else if (msg.type === 'PROFILE') { clearTimeout(t); resolve({ ws, isOwner: !!msg.serverManager }); }
    });
    ws.on('error', (e) => { clearTimeout(t); reject(e); });
  });
}

export async function setupFoundation(opts = {}) {
  const ownerToken = readOwnerToken();
  const scratch = path.join('/tmp', `r4031-scratch-${process.pid}-${Date.now()}`);
  let serverProc = null, ownerWs = null;
  const logFd = fs.openSync(path.join('/tmp', `r4031-server-${process.pid}.log`), 'w');

  const teardown = async () => {
    try { ownerWs && ownerWs.close(); } catch {}
    try { if (serverProc && !serverProc.killed) { serverProc.kill('SIGTERM'); await sleep(600); if (!serverProc.killed) serverProc.kill('SIGKILL'); } } catch {}
    try { fs.closeSync(logFd); } catch {}
    try { execSync(`git -C ${MAIN} worktree remove --force ${scratch}`, { stdio: 'ignore' }); } catch {}
    try { if (fs.existsSync(scratch)) fs.rmSync(scratch, { recursive: true, force: true }); } catch {}
    // ASSERT: prod:4444 untouched (still serving) + 0 leftover scratch worktrees
    let prodUp = false; try { const r = await fetch('https://localhost:4444/api/config'); prodUp = r.ok; } catch {}
    const leftover = execSync(`git -C ${MAIN} worktree list`, { encoding: 'utf8' }).split('\n').filter((l) => l.includes('r4031-scratch')).length;
    return { prodUp, leftover };
  };

  try {
    // (1) worktree at opts.commit (default HEAD) — detached, own scenario/index. A differential PRE/POST run pins each arm
    // to a specific commit (PRE=pre-viewBusKey, POST=fix) so the ONLY variable is the fix.
    const commit = opts.commit || 'HEAD';
    execSync(`git -C ${MAIN} worktree add --detach ${scratch} ${commit}`, { stdio: 'ignore' });
    // (2) node_modules symlink (skip npm ci)
    fs.symlinkSync(path.join(MAIN, 'node_modules'), path.join(scratch, 'node_modules'));
    // (2.5) optional clientPatch(worktreeRoot) — mutate CLIENT source BEFORE the dist build (below) so the INSTRUMENT/patch is
    // compiled INTO the served bundle (e.g. a counter in a ViewBus subscribe callback). Must run before buildDist. Scratch-only.
    if (typeof opts.clientPatch === 'function') opts.clientPatch(scratch);
    // (3) dist: buildDist=FORCE a worktree build (dist == THIS commit's source, provenance-provable — a symlink to main's
    // MOVING dist can't prove a pre-fix arm served a pre-fix bundle). Else symlink main's dist (fast, same-HEAD).
    const mainDist = path.join(MAIN, 'src/public/dist'), wtDist = path.join(scratch, 'src/public/dist');
    if (opts.buildDist) { fs.rmSync(wtDist, { recursive: true, force: true }); execSync(`${NODE22} build.mjs`, { cwd: scratch, stdio: 'ignore' }); }
    else if (fs.existsSync(mainDist)) { fs.rmSync(wtDist, { recursive: true, force: true }); fs.symlinkSync(mainDist, wtDist); }
    else execSync(`${NODE22} build.mjs`, { cwd: scratch, stdio: 'ignore' });
    // (3-prov) DIST PROVENANCE (PO: proven, not assumed) — does the BUILT bundle carry the viewBusKey live-render fix?
    // PRE arm (748cab757) → false; POST arm (>=50b22399a) → true. grep exits 1 on no-match → catch → false (no 2>&1).
    let distHasViewBusKey = false;
    try { distHasViewBusKey = execSync(`grep -rlE viewBusKey ${wtDist}`, { encoding: 'utf8' }).trim().length > 0; } catch { distHasViewBusKey = false; }
    // (4) seed the scratch units BEFORE boot (server loads the index at startup)
    const seeded = seedUnits(scratch);
    // (4a) optional: attach the seeded passing-Test evidence chain to a REAL task (BEFORE boot → the boot-loaded idx sees it) so
    // approveByOwner can reach Done+emit on a real non-eager QA-Review task = a full /api/ior citizen. MECHANISM FIXTURE only —
    // proves the approve→Done→broadcast PATH, does NOT claim the real task is Done-worthy. Scratch-only, torn down with the worktree.
    if (opts.attachEvidenceTo) { attachEvidenceToTask(scratch, opts.attachEvidenceTo, seeded.evidenceReq); seeded.realQaReview = opts.attachEvidenceTo; }
    // (4b) optional serverPatch(worktreeRoot) — ADDITIVE negative-test hook (expert owner-action smoke stub-must-fail):
    // mutate the WORKTREE server source BEFORE boot (e.g. inject a post-response throw) so the scratch server runs the
    // broken code, proving a gate BINDS. Backward-compatible (no opts → no patch). Scratch-worktree-only, torn down with it.
    if (typeof opts.serverPatch === 'function') opts.serverPatch(scratch);
    // (5) spawn scratch server on non-4444 ports
    serverProc = spawn(NODE22, [TSX, 'src/ts/server/server.ts'], { cwd: scratch, env: { ...process.env, HTTPS_PORT: String(HTTPS_PORT), PORT: String(PORT), NODE_TLS_REJECT_UNAUTHORIZED: '0' }, stdio: ['ignore', logFd, logFd] });
    // (6) poll /api/config until up
    let up = false;
    for (let i = 0; i < 90 && !up; i++) { try { const r = await fetch(`${BASE}/api/config`); up = r.ok; } catch {} if (!up) await sleep(1000); }
    if (!up) throw new Error(`scratch server did not come up on ${HTTPS_PORT} within 90s (see /tmp/r4031-server-${process.pid}.log)`);
    // VERSION PIN (PO: HEAD is a moving target during an acceptance run — record what THIS scratch was built at, per run)
    let worktreeSha = '?', servedVersion = '?';
    try { worktreeSha = execSync(`git -C ${scratch} rev-parse --short HEAD`, { encoding: 'utf8' }).trim(); } catch {}
    try { servedVersion = (await (await fetch(`${BASE}/api/config`)).json())?.version || '?'; } catch {}
    // (7) owner live session + (8) mint sm_session cookie
    const o = await openOwnerWs(ownerToken); ownerWs = o.ws;
    const sres = await fetch(`${BASE}/api/server-manager/session`, { method: 'POST', headers: { 'x-player-token': ownerToken } });
    const setCookie = sres.headers.get('set-cookie') || '';
    const smSession = (/sm_session=([^;]+)/.exec(setCookie) || [])[1] || '';

    // owner cred getter — HEADERS ONLY, never logged. x-player-token authenticates API assertOwner while the WS session is live;
    // Cookie carries the sm_session for page loads. Returns a fresh object each call (no shared mutable creds).
    const ownerHeaders = () => ({ 'x-player-token': ownerToken, ...(smSession ? { Cookie: `sm_session=${smSession}` } : {}) });

    return { base: BASE, ownerHeaders, seeded, ownerIsServerManager: o.isOwner, sessionMinted: !!smSession, worktreeSha, servedVersion, distHasViewBusKey, teardown };
  } catch (e) {
    await teardown();
    throw e;
  }
}

// ── SELF-SMOKE + STUB-MUST-FAIL (run directly) ──
async function selfSmoke() {
  console.log('R40.31 foundation self-smoke — bringing up isolated scratch server (build/boot is slow)…');
  const f = await setupFoundation();
  const results = [];
  const A = (ok, msg) => { results.push(ok); console.log(`  ${ok ? '✓' : '✗ FAIL'} ${msg}`); };
  try {
    A(f.ownerIsServerManager === true, `owner WS live session → serverManager flag TRUE`);
    A(f.sessionMinted === true, `POST /api/server-manager/session → sm_session cookie minted`);
    // whoami owner-gated: owner-headers 200, no-cred 403 (fail-closed)
    const wOwner = await fetch(`${f.base}/api/server-manager/whoami`, { headers: f.ownerHeaders() });
    const wNone = await fetch(`${f.base}/api/server-manager/whoami`);
    A(wOwner.status === 200, `whoami owner → 200 (got ${wOwner.status})`);
    A(wNone.status === 403, `whoami no-cred → 403 fail-closed (got ${wNone.status})`);
    // approve the seeded QA-Review task → 200 + Done (proves FULL-evidence chain: two-keyed passing Test lets the Done-tick pass)
    const ap = await fetch(`${f.base}/api/task/${f.seeded.qaReview}/approve`, { method: 'POST', headers: f.ownerHeaders() });
    const apj = await ap.json().catch(() => ({}));
    A(ap.status === 200 && apj.status === 'Done', `approve qaReview → 200 + Done (got ${ap.status} status=${apj.status})`);
    // refuse task (Done): approve → 409 (no evidence to manufacture Done); atomicity/byte-identical = expert's smoke
    const rf = await fetch(`${f.base}/api/task/${f.seeded.refuse}/approve`, { method: 'POST', headers: f.ownerHeaders() });
    A(rf.status === 409, `refuse(Done) approve → 409 (got ${rf.status})`);
    // planned task: make-current → 200 (advances to In Progress + stamps)
    const mc = await fetch(`${f.base}/api/task/${f.seeded.planned}/make-current`, { method: 'POST', headers: f.ownerHeaders() });
    A(mc.status === 200, `planned make-current → 200 (got ${mc.status})`);
    // STUB-MUST-FAIL (foundation-level): a bogus task uuid must 404 (proves the endpoint really checks, not always-200)
    const bogus = await fetch(`${f.base}/api/task/${randomUUID()}/approve`, { method: 'POST', headers: f.ownerHeaders() });
    A(bogus.status === 404 || bogus.status === 409, `stub-must-fail: approve unknown task → 404/409 (got ${bogus.status})`);
  } finally {
    const td = await f.teardown();
    A(td.prodUp === true, `teardown: prod:4444 UNTOUCHED (still serving)`);
    A(td.leftover === 0, `teardown: 0 leftover scratch worktrees`);
  }
  const pass = results.length >= 9 && results.every(Boolean);
  console.log(`\n${pass ? '✓ GREEN' : '✗ RED'} — foundation self-smoke ${results.filter(Boolean).length}/${results.length}`);
  process.exit(pass ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) selfSmoke().catch((e) => { console.error('self-smoke error:', e.message); process.exit(1); });
