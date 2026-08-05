// T36.2 usedIn SURVIVES a TsToModel re-generation — INDEPENDENT tester gate, served DET-3x.
// R36.2 usedIn lives in data/model-store/usage-index.json (keyed by keyToUuid(sourceFile::qualifiedName)), OUTSIDE the
// element file + outside the scanned index shards (server.ts:1247) → the generated element stays PRISTINE (INV-RM1) and
// usedIn SURVIVES re-generation BY CONSTRUCTION. Gate: add-view an element → RE-GENERATE its class → usedIn STILL present
// AND the element unit file is byte-identical. BITE: if usedIn were stored on the element file, the re-gen rewrite would
// clear it → the survived-assert would fail. Pollution-safe: MODEL_STORE snapshot/restore + usage-index.json byte-restore
// + add/remove-view net-zero on the shared diagram; prod scenario/index untouched (prodClean).
// [test:uuid:a81a82c4-c12f-443b-99ca-1a2af815c8ba] T36.2 usedIn survives-regeneration — add-view populates usedIn, RE-GENERATE the element's class, usedIn STILL present + element unit byte-identical (INV-RM1); the side-index lives in usage-index.json OUTSIDE the element (server.ts:1247), untouched by TsToModel.generate. served DET-3x, pollution-safe.
import { keyToUuid } from '../../src/ts/scenario/TsToModel.ts';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const TARGET = process.env.R362_TARGET || '0.8.61';
const STORE = path.join(ROOT, 'data/model-store/index');
const USAGE = path.join(ROOT, 'data/model-store/usage-index.json');
const FIXREL = 'test/fixtures/r363-sig-fixture.ts';
const G = keyToUuid(`${FIXREL}::Greeter`);           // the Greeter class element (canonical uuid the usage-index keys on)
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7'; // a stable real diagram — add/remove-view net-zero

const http = (method: string, p: string, body?: any): Promise<{ status: number; json: any }> => new Promise((res) => {
  const data = body ? JSON.stringify(body) : undefined;
  const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: p, method, rejectUnauthorized: false, headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, (r) => { let b = ''; r.on('data', (c) => b += c); r.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: r.statusCode || 0, json: j }); }); });
  q.on('error', () => res({ status: 0, json: null })); if (data) q.write(data); q.end();
});
const snapStore = (): Set<string> => { const s = new Set<string>(); const walk = (d: string) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : s.add(p); } }; walk(STORE); return s; };
const usedInHas = async (u: string, diag: string): Promise<boolean> => ((await http('GET', `/api/model/used-in/${u}`)).json?.usedIn || []).some((x: any) => String(x.ref || '').includes(diag));
const iorBytes = async (u: string): Promise<string> => JSON.stringify((await http('GET', `/api/ior/${u}`)).json?.unit || null);
const prodShard = path.join(ROOT, 'scenario/index', ...G.slice(0, 5).split(''), `${G}.scenario.json`);

const served = (await http('GET', '/api/config')).json?.version || '?';
console.log(served === TARGET ? `served==${TARGET} verified.` : `⚠ PHANTOM-GUARD: served=${served} != ${TARGET}.`);

async function iter() {
  const baseline = snapStore();
  const usageBefore = fs.existsSync(USAGE) ? fs.readFileSync(USAGE) : null;
  let genOk = false, addedOk = false, usedInAdd = false, regenOk = false, survived = false, pristine = false, netZero = false, prodClean = false;
  try {
    genOk = (await http('POST', '/api/model/generate', { file: FIXREL })).json?.ok === true;
    addedOk = (await http('POST', '/api/model/diagram/add-view', { diagramUuid: DIAG, elementUuid: G })).status === 200;
    usedInAdd = await usedInHas(G, DIAG);                 // usedIn populated by add-view
    const bytesPreRegen = await iorBytes(G);
    regenOk = (await http('POST', '/api/model/generate', { file: FIXREL })).json?.ok === true; // RE-GENERATE the element's class
    survived = await usedInHas(G, DIAG);                  // ★ the core claim: usedIn STILL present after re-gen
    const bytesPostRegen = await iorBytes(G);
    pristine = bytesPreRegen === bytesPostRegen && bytesPostRegen.length > 2; // INV-RM1: re-gen left the element unit byte-identical
    const removed = (await http('POST', '/api/model/diagram/remove-view', { diagramUuid: DIAG, elementUuid: G })).status === 200;
    netZero = removed && !(await usedInHas(G, DIAG));      // remove-view clears usedIn (bidirectional inverse)
    prodClean = !fs.existsSync(prodShard);                // prod scenario/index NEVER got the fixture element
  } finally {
    for (const f of snapStore()) if (!baseline.has(f)) { try { fs.unlinkSync(f); } catch { /* */ } } // MODEL_STORE restore
    if (usageBefore) { try { fs.writeFileSync(USAGE, usageBefore); } catch { /* */ } } // usage-index byte-restore
  }
  return { genOk, addedOk, usedInAdd, regenOk, survived, pristine, netZero, prodClean, ok: genOk && addedOk && usedInAdd && regenOk && survived && pristine && netZero && prodClean };
}

const runs: any[] = [];
for (let i = 1; i <= 3; i++) runs.push(await iter());
console.log(`\n===== T36.2 usedIn survives-regeneration — served ${served} DET-3x =====`);
runs.forEach((r, i) => console.log(`iter ${i + 1}: ${JSON.stringify(r)}`));
const green = served === TARGET && runs.length === 3 && runs.every((r) => r.ok);
console.log('OVERALL T36.2 survives-regen:', green ? 'GREEN DET-3x' : 'RED');
console.log('CORE: add-view→usedIn present→RE-GENERATE class→usedIn SURVIVES + element file byte-identical (usage-index is outside the element, server.ts:1247).');
process.exitCode = green ? 0 : 1;
