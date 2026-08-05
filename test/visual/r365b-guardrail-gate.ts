// R36.5 GUARDRAIL re-gate — usedIn moved to the OFF-ELEMENT usage-index backend (data/model-store/usage-index.json,
// server.ts:1247). INDEPENDENT tester gate, served DET-3x, pollution-safe. Re-verifies the R36.5 ACs hold on the NEW
// backend (the R36.5 foundation gate r365-usedin-webkit-gate.mjs tested the OLD on-element backend):
//   (1) BIDIRECTIONAL — add-view → element.usedIn gains the diagram AND Diagram.views gains the element; remove → both
//       clear (net-zero on faa4acad, the inverse restores).
//   (2) /api/ior shows usedIn (compute-on-read MERGE) while the on-disk element file stays PRISTINE (INV-RM1) — usedIn is
//       never written to the element unit (it lives in usage-index.json).
//   (3) INV-T byte-diff==0 — /api/model/tree NEVER emits usedIn and its bytes are UNCHANGED by an add-view (tree-invisible).
//   (4) SURVIVES re-generation — re-generate the element's class → usedIn STILL present + element file byte-identical.
// Pollution-safe: MODEL_STORE snapshot/restore + usage-index.json byte-restore + add/remove-view net-zero; prodClean.
// [test:uuid:af74aef0-9758-481f-9b7c-0df6825891d0] R36.5 guardrail — usedIn off-element usage-index backend: bidirectional element↔diagram + net-zero + /api/ior MERGES usedIn yet element file PRISTINE (INV-RM1) + INV-T tree bytes unchanged/no-usedIn + survives re-generation. served DET-3x, pollution-safe.
import { keyToUuid } from '../../src/ts/scenario/TsToModel.ts';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const TARGET = process.env.R365B_TARGET || '0.8.61';
const STORE = path.join(ROOT, 'data/model-store/index');
const USAGE = path.join(ROOT, 'data/model-store/usage-index.json');
const FIXREL = 'test/fixtures/r363-sig-fixture.ts';
const G = keyToUuid(`${FIXREL}::Greeter`);
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const gShard = path.join(STORE, ...G.slice(0, 5).split(''), `${G}.scenario.json`);

const http = (method: string, p: string, body?: any): Promise<{ status: number; json: any; text: string }> => new Promise((res) => {
  const data = body ? JSON.stringify(body) : undefined;
  const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: p, method, rejectUnauthorized: false, headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, (r) => { let b = ''; r.on('data', (c) => b += c); r.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: r.statusCode || 0, json: j, text: b }); }); });
  q.on('error', () => res({ status: 0, json: null, text: '' })); if (data) q.write(data); q.end();
});
const snapStore = (): Set<string> => { const s = new Set<string>(); const walk = (d: string) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : s.add(p); } }; walk(STORE); return s; };
const usedInHas = async (u: string, diag: string): Promise<boolean> => ((await http('GET', `/api/model/used-in/${u}`)).json?.usedIn || []).some((x: any) => String(x.ref || '').includes(diag));
const viewsHas = async (d: string, elem: string): Promise<boolean> => ((await http('GET', `/api/ior/${d}`)).json?.unit?.model?.views || []).some((v: any) => String(v.unit || '').includes(elem));
const iorUsedIn = async (u: string): Promise<boolean> => { const m = (await http('GET', `/api/ior/${u}`)).json?.unit?.model; return !!m && Array.isArray(m.usedIn) && m.usedIn.some((x: any) => String(x?.ref || x || '').includes(DIAG)); };
const fileBytes = (): string => fs.existsSync(gShard) ? fs.readFileSync(gShard, 'utf8') : '';
const tree = async (): Promise<string> => (await http('GET', '/api/model/tree')).text;

const served = (await http('GET', '/api/config')).json?.version || '?';
console.log(served === TARGET ? `served==${TARGET} verified.` : `⚠ PHANTOM-GUARD: served=${served} != ${TARGET}.`);

async function iter() {
  const baseline = snapStore();
  const usageBefore = fs.existsSync(USAGE) ? fs.readFileSync(USAGE) : null;
  const R: any = {};
  try {
    R.genOk = (await http('POST', '/api/model/generate', { file: FIXREL })).json?.ok === true;
    const fileBefore = fileBytes();
    const treeBefore = await tree();
    R.invTnoUsedInPre = !/usedIn/.test(treeBefore) && treeBefore.length > 2;   // (3) tree never emits usedIn
    // (1) bidirectional add
    R.addedOk = (await http('POST', '/api/model/diagram/add-view', { diagramUuid: DIAG, elementUuid: G })).status === 200;
    R.biElem = await usedInHas(G, DIAG);                                        // element side
    R.biDiag = await viewsHas(DIAG, G);                                        // diagram side
    // (2) /api/ior shows usedIn (compute-on-read) BUT the on-disk element file is PRISTINE
    R.iorShowsUsedIn = await iorUsedIn(G);
    R.filePristineAfterAdd = fileBytes() === fileBefore && fileBefore.length > 2;
    // (3) INV-T byte-diff==0: tree bytes UNCHANGED by the add-view + still no usedIn
    const treeAfter = await tree();
    R.invTbyteUnchanged = treeAfter === treeBefore && !/usedIn/.test(treeAfter);
    // (4) survives re-generation
    R.regenOk = (await http('POST', '/api/model/generate', { file: FIXREL })).json?.ok === true;
    R.survivesRegen = await usedInHas(G, DIAG);
    R.filePristineAfterRegen = fileBytes() === fileBefore;
    // net-zero remove (inverse restores both sides)
    const removed = (await http('POST', '/api/model/diagram/remove-view', { diagramUuid: DIAG, elementUuid: G })).status === 200;
    R.netZero = removed && !(await usedInHas(G, DIAG)) && !(await viewsHas(DIAG, G));
    R.prodClean = !fs.existsSync(path.join(ROOT, 'scenario/index', ...G.slice(0, 5).split(''), `${G}.scenario.json`));
  } finally {
    for (const f of snapStore()) if (!baseline.has(f)) { try { fs.unlinkSync(f); } catch { /* */ } }
    if (usageBefore) { try { fs.writeFileSync(USAGE, usageBefore); } catch { /* */ } }
  }
  R.ok = R.genOk && R.invTnoUsedInPre && R.addedOk && R.biElem && R.biDiag && R.iorShowsUsedIn && R.filePristineAfterAdd && R.invTbyteUnchanged && R.regenOk && R.survivesRegen && R.filePristineAfterRegen && R.netZero && R.prodClean;
  return R;
}

const runs: any[] = [];
for (let i = 1; i <= 3; i++) runs.push(await iter());
console.log(`\n===== R36.5 guardrail (off-element usage-index) — served ${served} DET-3x =====`);
runs.forEach((r, i) => console.log(`iter ${i + 1}: ${JSON.stringify(r)}`));
const green = served === TARGET && runs.length === 3 && runs.every((r) => r.ok);
console.log('OVERALL R36.5 guardrail:', green ? 'GREEN DET-3x' : 'RED');
console.log('CORE: (1) bidirectional element↔diagram + net-zero; (2) /api/ior MERGES usedIn yet element file PRISTINE; (3) INV-T tree bytes unchanged + no usedIn; (4) survives re-generation.');
process.exitCode = green ? 0 : 1;
