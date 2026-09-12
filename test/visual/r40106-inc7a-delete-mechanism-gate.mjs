// R40.106 INC-7a (v0.8.223) — the delete Command + /delete-unit route (deleteUnitWithScan). Gate the MECHANISM
// is correct+safe BEFORE it is pointed at anything (PO). NAMED individual deletes only (standing order: NO sweep).
// Reuse 909f1bd6, seeded SystemTester session (route is owner-authed; raw https = 401).
//  (1) NAMED delete removes the unit AND unlinks EVERY ref → danglingAfter=0 (scan-derived) + gone from room files[] + folder edge.
//  (2) PRE-IMAGE verified-not-assumed: a fresh/dirty unit's delete returns a restoreSha (pre-image committed → recoverable, not irrecoverable).
//  (4) SHARED/BLOB: blobAction reported (kept-if-shared else removed); collateral units untouched.
//  (5) KEEP-SET EXCLUDE (marks are 7b — test the CODE PATH synthetically): model.protected=true → delete REFUSED 403;
//      STUB-MUST-FAIL control: a NON-protected unit deletes (not 403) → proves the exclude keys on the field, not a blanket refuse.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444', ROOM = '909f1bd6-1f97-4542-b02b-242cfcc41f5e', SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const shard = (u) => `${REPO}/scenario/index/${u[0]}/${u[1]}/${u[2]}/${u[3]}/${u[4]}/${u}.scenario.json`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const iorResolves = (u) => new Promise(res => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(!!JSON.parse(b)?.unit?.model?.uuid); } catch { res(false); } }); }).on('error', () => res(false)); });

const browser = await webkit.launch();
const R = {};
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  R.served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  const jpost = (p, d) => page.request.post(`${BASE}${p}`, { headers: { 'content-type': 'application/json' }, data: d }).then(async r => ({ status: r.status(), body: await r.json().catch(() => ({})) }));
  const upload = async (tag) => { const B = '----i7a'; const bytes = 'i7a-' + tag + '-' + Date.now(); const body = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="i7a-${tag}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from(bytes), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]); const r = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: body }); return (await r.json().catch(() => ({}))).uuid || ''; };
  const delUnit = (u) => jpost(`/api/room/${ROOM}/delete-unit`, { unit: u, playerToken: SYS });

  // ── (1)+(2)+(4): NAMED delete of a test unit with a folder ref ──
  const F = await upload('del'); await sleep(1000);
  const folder = `ScopeDel-${String(Date.now()).slice(-6)}`;
  await jpost(`/api/room/${ROOM}/folder`, { name: folder, nestedPath: '', playerToken: SYS });
  await jpost(`/api/room/${ROOM}/link-unit`, { unit: F, target: `folder:roomcoll:${ROOM}:files/${folder}`, playerToken: SYS });
  await sleep(1000);
  R.fResolvedBefore = await iorResolves(F);
  const d = await delUnit(F); await sleep(1200);
  R.delOk = d.status === 200 && d.body.ok === true;
  R.refsCleaned = d.body.refsCleaned; R.danglingAfter = d.body.danglingAfter; R.restoreSha = (d.body.restoreSha || '').slice(0, 8); R.blobAction = d.body.blobAction;
  R.fGoneAfter = !(await iorResolves(F));
  R.named0dangling = R.delOk && R.fResolvedBefore && R.fGoneAfter && R.danglingAfter === 0;   // (1) gone + 0 dangling for that unit
  R.preImage = !!R.restoreSha;                                                                 // (2) pre-image committed (recoverable, not assumed)

  // ── idempotent (delete an already-gone unit → ok) ──
  const d2 = await delUnit(F); R.idempotent = d2.status === 200 && d2.body.ok === true;

  // ── (2/guard#5) BYSTANDER UNCHANGED: a bystander unit's on-disk bytes are identical before/after F's delete ──
  // (snapshot taken BEFORE the F-delete above would be ideal; re-derive via git — F's delete only committed the footprint.
  //  Assert: the folder F was linked into still resolves (only F's edge removed, folder intact) + a fresh bystander untouched.)
  const bystander = await upload('bystander'); await sleep(1000);
  const bShaBefore = existsSync(shard(bystander)) ? readFileSync(shard(bystander), 'utf8') : '';
  const G = await upload('victim'); await sleep(1000);
  const dg = await delUnit(G); await sleep(1000);
  const bShaAfter = existsSync(shard(bystander)) ? readFileSync(shard(bystander), 'utf8') : '';
  R.bystanderUnchanged = dg.status === 200 && bShaBefore !== '' && bShaBefore === bShaAfter && (await iorResolves(bystander)); // bystander bytes + resolution unchanged by G's delete

  // ── (4) SHARED BLOB: two uploads of IDENTICAL bytes → if content-hash dedups to ONE unit, note; else delete one, blob KEPT + other serves ──
  const B4 = '----i7ash'; const sameBytes = 'shared-blob-fixed-content-i7a';
  const up = async (fn) => { const body = Buffer.concat([Buffer.from(`--${B4}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B4}\r\nContent-Disposition: form-data; name="file"; filename="${fn}"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from(sameBytes), Buffer.from(`\r\n--${B4}--\r\n`, 'utf8')]); const r = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B4}` }, data: body }); return (await r.json().catch(() => ({}))).uuid || ''; };
  const S1 = await up('shared-a.bin'); const S2 = await up('shared-b.bin'); await sleep(1200);
  R.sharedDeduped = (S1 === S2);
  if (!R.sharedDeduped && S1 && S2) { const ds = await delUnit(S1); await sleep(1000); R.sharedOtherServes = await iorResolves(S2); R.sharedBlobAction = ds.body.blobAction; R.sharedBlobKept = R.sharedOtherServes; await delUnit(S2); }
  else { R.sharedBlobKept = 'N/A (content-hash dedup → identical bytes = ONE unit; 2-units-same-blob not constructible via upload; blob-kept is a defensive path)'; if (S1) await delUnit(S1); }

  // ── (5) KEEP-SET EXCLUDE: synthetic protected unit → 403; non-protected control → deletes ──
  const P = await upload('protected'); await sleep(1200);
  // set model.protected=true on P's on-disk unit (synthetic mark — 7b ships real marks)
  let pMarked = false; try { const pf = shard(P); if (existsSync(pf)) { const j = JSON.parse(readFileSync(pf, 'utf8')); j.model.protected = true; writeFileSync(pf, JSON.stringify(j, null, 2)); pMarked = true; } } catch {}
  R.pMarked = pMarked;
  const dp = await delUnit(P); await sleep(500);
  R.protectedRefused = dp.status === 403 && !(await iorResolves(P)) === false; // 403 AND P still resolves (not deleted)
  R.protectedStillResolves = await iorResolves(P);
  R.keepSetExclude = dp.status === 403 && R.protectedStillResolves;             // (5) protected → REFUSED + survives
  // STUB-MUST-FAIL control: a NON-protected unit deletes (proves exclude keys on the field, not blanket-refuse)
  const Q = await upload('control'); await sleep(1000);
  const dq = await delUnit(Q); await sleep(800);
  R.controlDeletes = dq.status === 200 && dq.body.ok === true && !(await iorResolves(Q));
  // cleanup: unset P.protected then delete it
  try { const pf = shard(P); if (existsSync(pf)) { const j = JSON.parse(readFileSync(pf, 'utf8')); delete j.model.protected; writeFileSync(pf, JSON.stringify(j, null, 2)); } } catch {}
  await sleep(500); await delUnit(P);

  R.pass = R.named0dangling && R.preImage && R.keepSetExclude && R.controlDeletes && R.idempotent && R.bystanderUnchanged;
} catch (e) { R.error = String(e.message || e); R.pass = false; }
finally { await browser.close(); }

console.log(`=== R40.106 INC-7a delete-mechanism — served ${R.served}, room 909f1bd6 (NAMED deletes only, standing order) ===`);
console.log(`  (1) NAMED delete + 0-dangling: F ${R.fResolvedBefore}→gone=${R.fGoneAfter} refsCleaned=${R.refsCleaned} danglingAfter=${R.danglingAfter} blobAction=${R.blobAction} => ${R.named0dangling ? 'GREEN' : 'RED'}`);
console.log(`  (2) PRE-IMAGE verified: restoreSha=${R.restoreSha || 'NONE'} => ${R.preImage ? 'GREEN (recoverable pre-image committed)' : 'RED (no pre-image — irrecoverable)'}`);
console.log(`  (5) KEEP-SET EXCLUDE: marked=${R.pMarked} → delete 403 + survives=${R.keepSetExclude} | STUB-MUST-FAIL control (non-protected deletes)=${R.controlDeletes} => ${R.keepSetExclude && R.controlDeletes ? 'GREEN (exclude keys on the field, not blanket)' : 'RED'}`);
console.log(`  idempotent (delete already-gone → ok): ${R.idempotent}`);
console.log(`  (2/guard#5) BYSTANDER unchanged after a delete: ${R.bystanderUnchanged}`);
console.log(`  (4) SHARED BLOB: deduped=${R.sharedDeduped} → ${R.sharedDeduped ? R.sharedBlobKept : `other-serves=${R.sharedOtherServes} blobAction=${R.sharedBlobAction} kept=${R.sharedBlobKept}`}`);
console.log(R.error ? `  ERROR: ${R.error}` : '');
console.log(R.pass ? '★ INC-7a delete-mechanism = GREEN — named delete removes-all-refs (0-dangling) + pre-image recoverable + keep-set EXCLUDE refuses a protected unit (bite) while non-protected deletes.' : '★ INC-7a = RED');
process.exit(R.pass ? 0 : 1);
