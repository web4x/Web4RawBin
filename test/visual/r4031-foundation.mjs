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
  return { qaReview: qa, planned, refuse };
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
    // (1) worktree of HEAD (detached — own scenario/index)
    execSync(`git -C ${MAIN} worktree add --detach ${scratch} HEAD`, { stdio: 'ignore' });
    // (2) node_modules symlink (skip npm ci)
    fs.symlinkSync(path.join(MAIN, 'node_modules'), path.join(scratch, 'node_modules'));
    // (3) dist: symlink main's built dist (worktree HEAD == main HEAD → byte-identical) else build
    const mainDist = path.join(MAIN, 'src/public/dist'), wtDist = path.join(scratch, 'src/public/dist');
    if (fs.existsSync(mainDist)) { fs.rmSync(wtDist, { recursive: true, force: true }); fs.symlinkSync(mainDist, wtDist); }
    else execSync(`${NODE22} build.mjs`, { cwd: scratch, stdio: 'ignore' });
    // (4) seed the scratch units BEFORE boot (server loads the index at startup)
    const seeded = seedUnits(scratch);
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
    // (7) owner live session + (8) mint sm_session cookie
    const o = await openOwnerWs(ownerToken); ownerWs = o.ws;
    const sres = await fetch(`${BASE}/api/server-manager/session`, { method: 'POST', headers: { 'x-player-token': ownerToken } });
    const setCookie = sres.headers.get('set-cookie') || '';
    const smSession = (/sm_session=([^;]+)/.exec(setCookie) || [])[1] || '';

    // owner cred getter — HEADERS ONLY, never logged. x-player-token authenticates API assertOwner while the WS session is live;
    // Cookie carries the sm_session for page loads. Returns a fresh object each call (no shared mutable creds).
    const ownerHeaders = () => ({ 'x-player-token': ownerToken, ...(smSession ? { Cookie: `sm_session=${smSession}` } : {}) });

    return { base: BASE, ownerHeaders, seeded, ownerIsServerManager: o.isOwner, sessionMinted: !!smSession, teardown };
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
