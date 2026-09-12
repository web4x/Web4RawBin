// R40.81 residual → CLOSED exhaustively at ZERO PROD COST (PO proportionality ruling: a LOW check must never load Tron's live prod).
// read-store==write-store proven by CONSTRUCTION + measured on the LOCAL store — NOT 7136 prod /api/ior reads.
// (a) all units physically under the WRITE store scenario/index (filesystem census, node walk, full-uuid).
// (b) MODEL_STORE_SOURCE flag = 'scenario-index' (durable .env flip) → ModelStoreLocator.modelDir() returns PROD_INDEX.
// (c) old MODEL_STORE (data/model-store/index) DRAINED = 0 units → nothing reachable in an alternate store.
// (d) BY-CONSTRUCTION: read (resolveReadDir→dirFor) AND write both route through the SAME modelDir() flag → they cannot diverge
//     for ANY unit (dirFor: non-model→PROD_INDEX always; model→modelDir()=PROD_INDEX when flipped). Covers future units too.
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'; import path from 'node:path';
const ROOT='/var/dev/Workspaces/web4x/Web4RawBin', IDX=path.join(ROOT,'scenario/index'), MODEL_STORE=path.join(ROOT,'data/model-store/index');
const countJson=(d)=>{let n=0;const w=x=>{if(!existsSync(x))return;for(const e of readdirSync(x)){const f=path.join(x,e);const st=statSync(f);if(st.isDirectory())w(f);else if(e.endsWith('.scenario.json'))n++;}};w(d);return n;};
const a_units = countJson(IDX);
const envTxt = existsSync(path.join(ROOT,'.env')) ? readFileSync(path.join(ROOT,'.env'),'utf8') : '';
const b_flag = /MODEL_STORE_SOURCE\s*=\s*scenario-index/.test(envTxt);
const c_drained = countJson(MODEL_STORE);
// (d) by-construction: assert the locator source still couples read+write to one flag (NUL-safe read of server.ts)
const srv = readFileSync(path.join(ROOT,'src/ts/server/server.ts'),'utf8').replace(/\000/g,'');
const norm = srv.replace(/\s+/g,' ');
const d_oneFlag = norm.includes("src === 'scenario-index' ? PROD_INDEX : MODEL_STORE")
  && norm.includes('return ModelStoreLocator.dirFor(uuid)')
  && norm.includes('return isModelUnit(uuid) ? ModelStoreLocator.modelDir() : PROD_INDEX');
console.log('=== R40.81 ONE-STORE read==write — EXHAUSTIVE, ZERO PROD COST ===');
console.log('(a) units under WRITE store scenario/index :', a_units);
console.log('(b) MODEL_STORE_SOURCE=scenario-index flip :', b_flag);
console.log('(c) old MODEL_STORE drained (0 units)      :', c_drained, c_drained===0?'(DRAINED)':'(NOT DRAINED!)');
console.log('(d) locator couples read+write to one flag :', d_oneFlag, '(non-model→PROD_INDEX always; model→modelDir()=PROD_INDEX when flipped)');
const clean = a_units>0 && b_flag && c_drained===0 && d_oneFlag;
console.log(clean?'★ READ-STORE==WRITE-STORE EXHAUSTIVELY CONFIRMED (all '+a_units+' on disk + flip-set + alternate-drained + one-locator by-construction). Stronger than a 7136-sample; ZERO prod load. Residual closable.':'★ NOT clean — see legs.');
process.exit(clean?0:1);
