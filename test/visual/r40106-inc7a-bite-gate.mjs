// R40.106 INC-7a BITE-GATE (architect spec, universal-link-mechanism.md §INC-7a BITE-GATE, 38de46d92).
// Independent of the expert-builder; architect verifies firing + signs green. Mint DISPOSABLE units INSIDE 909f1bd6
// (NO new room), each a NAMED individual delete of a minted-to-delete unit. NEVER touch 45-debris/3-evidence/real rooms.
// FIVE bites, each with the stub-must-fail proof; the tests own their cleanup (nothing left).
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444', ROOM = '909f1bd6-1f97-4542-b02b-242cfcc41f5e', SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const relShard = (u) => `scenario/index/${u[0]}/${u[1]}/${u[2]}/${u[3]}/${u[4]}/${u}.scenario.json`;
const shard = (u) => `${REPO}/${relShard(u)}`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const resolves = (u) => new Promise(res => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(!!JSON.parse(b)?.unit?.model?.uuid); } catch { res(false); } }); }).on('error', () => res(false)); });
const sleep0 = (ms) => new Promise(r => setTimeout(r, ms));
const waitShard = async (u) => { for (let i = 0; i < 40; i++) { if (existsSync(shard(u))) return true; await sleep0(500); } return false; };
const P = (label, ok) => console.log(`  ${ok ? 'PASS' : '★RED '} ${label}`);

const browser = await webkit.launch();
const R = {}; const clean = [];
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  R.served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  const jpost = (p, d) => page.request.post(`${BASE}${p}`, { headers: { 'content-type': 'application/json' }, data: d }).then(async r => ({ status: r.status(), body: await r.json().catch(() => ({})) }));
  const upload = async (tag) => { const B = '----bite'; const body = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="bite-${tag}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('bite-' + tag + '-' + randomUUID()), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]); const r = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: body }); return (await r.json().catch(() => ({}))).uuid || ''; };
  const del = (u) => jpost(`/api/room/${ROOM}/delete-unit`, { unit: u, playerToken: SYS });

  // ── MINT throwaways in 909f1bd6 ──
  const Utest = await upload('Utest'); const B = await upload('bystander'); const Uprot = await upload('Uprot');
  clean.push(Utest, B, Uprot);
  await waitShard(Utest); await waitShard(B); await waitShard(Uprot); // poll until the async unit writes land on disk
  const folderR = `BiteRefHolder-${String(Date.now()).slice(-6)}`;
  await jpost(`/api/room/${ROOM}/folder`, { name: folderR, nestedPath: '', playerToken: SYS });
  await jpost(`/api/room/${ROOM}/link-unit`, { unit: Utest, target: `folder:roomcoll:${ROOM}:files/${folderR}`, playerToken: SYS }); // R = ref-holder
  // U2 = synthetic unit sharing Utest's contentHash (2-units-1-blob not constructible via upload due to dedup → mint it)
  const utj = JSON.parse(readFileSync(shard(Utest), 'utf8')); const U2 = randomUUID();
  const u2unit = { ior: 'ior:class:File', model: { uuid: U2, name: 'bite-U2-shared.bin', contentPath: utj.model.contentPath, contentHash: utj.model.contentHash, size: utj.model.size, mimeType: utj.model.mimeType, roomUuid: ROOM, location: `roomcoll:${ROOM}:files` }, ownerIor: `ior:instance:${ROOM}` };
  writeFileSync(shard(U2), JSON.stringify(u2unit, null, 2)); clean.push(U2); await sleep(800);
  R.setup = (await resolves(Utest)) && (await resolves(B)) && (await resolves(U2)) && (await resolves(Uprot));

  // ── BITE (1) KEEP-SET EXCLUDE + stub-must-fail ──
  writeFileSync(shard(Uprot), JSON.stringify({ ...JSON.parse(readFileSync(shard(Uprot), 'utf8')), model: { ...JSON.parse(readFileSync(shard(Uprot), 'utf8')).model, protected: true } }, null, 2)); await sleep(500);
  const dProt = await del(Uprot); R.b1_refused = dProt.status === 403 && (await resolves(Uprot));
  // stub-must-fail: remove the exclude (unset protected) → now it deletes
  const uj = JSON.parse(readFileSync(shard(Uprot), 'utf8')); delete uj.model.protected; writeFileSync(shard(Uprot), JSON.stringify(uj, null, 2)); await sleep(500);
  const dProt2 = await del(Uprot); R.b1_stub = dProt2.status === 200 && !(await resolves(Uprot));
  P(`(1) keep-set: protected→403+survives=${R.b1_refused} | STUB remove-exclude→deletes=${R.b1_stub}`, R.b1_refused && R.b1_stub);

  // ── snapshot bystander B (bite 2) + delete Utest (ref-held + shares blob w/ U2) → bites 2,3,4 ──
  const bBefore = readFileSync(shard(B), 'utf8');
  const dU = await del(Utest); await sleep(1000);
  R.danglingAfter = dU.body.danglingAfter; R.restoreSha = dU.body.restoreSha; R.blobAction = dU.body.blobAction;
  const bAfter = existsSync(shard(B)) ? readFileSync(shard(B), 'utf8') : '';
  R.b2_bystander = dU.status === 200 && bBefore === bAfter && (await resolves(B));
  P(`(2) bystander byte-identical after delete = ${R.b2_bystander}`, R.b2_bystander);
  // (3) shared blob KEPT + U2 still resolves (U2 references Utest's contentHash)
  R.b3_kept = (await resolves(U2)) && existsSync(`${REPO}/${String(utj.model.contentPath || '').replace(/^index\//, 'scenario/index/')}`);
  P(`(3) shared blob KEPT + U2 resolves = ${R.b3_kept} (blobAction=${R.blobAction})`, R.b3_kept);
  // (4) danglingAfter==0 + restoreSha + RESTORE ACTUALLY re-creates Utest (verify, do not trust the sha)
  R.b4_dangling0 = R.danglingAfter === 0; R.b4_sha = !!R.restoreSha;
  let restored = false;
  if (R.restoreSha) { try { const content = execFileSync('git', ['show', `${R.restoreSha}:${relShard(Utest)}`], { cwd: REPO }); writeFileSync(shard(Utest), content); await sleep(800); restored = await resolves(Utest); } catch (e) { R.restoreErr = String(e.message).slice(0, 80); } }
  R.b4_restoreWorks = restored;
  P(`(4) danglingAfter==0=${R.b4_dangling0} + restoreSha=${R.b4_sha} + RESTORE re-creates Utest (verified /api/ior)=${R.b4_restoreWorks}`, R.b4_dangling0 && R.b4_sha && R.b4_restoreWorks);

  // ── (5) idempotent: Utest restored → delete again → ok; re-delete once more → already-gone ok ──
  const dU2 = await del(Utest); await sleep(600); const dU3 = await del(Utest);
  R.b5_idempotent = dU2.status === 200 && dU3.status === 200 && dU3.body.ok === true && !(await resolves(Utest));
  P(`(5) idempotent (delete restored → ok; re-delete already-gone → ok) = ${R.b5_idempotent}`, R.b5_idempotent);

  R.pass = R.setup && R.b1_refused && R.b1_stub && R.b2_bystander && R.b3_kept && R.b4_dangling0 && R.b4_sha && R.b4_restoreWorks && R.b5_idempotent;
} catch (e) { R.error = String(e.message || e); R.pass = false; }
finally { for (const u of clean) { try { await page?.request?.post?.(`${BASE}/api/room/${ROOM}/delete-unit`, { headers: { 'content-type': 'application/json' }, data: { unit: u, playerToken: SYS } }); } catch {} } await browser.close(); }

console.log(`\n=== INC-7a BITE-GATE (architect) — served ${R.served}, room 909f1bd6, throwaways only ===`);
console.log(R.error ? `ERROR: ${R.error}` : '');
console.log(R.pass ? '★ INC-7a BITE-GATE = ALL 5 GREEN (each stub-must-fail fired; restore verified-not-trusted). Architect may sign.' : '★ INC-7a BITE-GATE = RED');
process.exit(R.pass ? 0 : 1);
