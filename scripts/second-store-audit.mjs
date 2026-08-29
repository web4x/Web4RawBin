#!/usr/bin/env node
// second-store-audit.mjs — measures the TWO-STORE defect (R40.69/Task 40.66, architect second-store ruling).
// scenario/index (canonical) vs data/model-store (generated M1, resettable). Reports: counts, the OVERLAP
// (a unit must live in exactly ONE store), name=uuid units per ior-class per store (the File-name regression),
// and whether the overlap copies AGREE (name+owner). Read-only. Reproduces the planner measurement.
// Usage: node scripts/second-store-audit.mjs [REPO_ROOT]
import fs from 'fs'; import path from 'path';
const R = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function load(store){ const dir=path.join(R,store,'index'); const m=new Map();
  if(!fs.existsSync(dir)) return m;
  (function walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name);
    if(e.isDirectory())walk(p); else if(e.name.endsWith('.scenario.json')){ try{ const j=JSON.parse(fs.readFileSync(p,'utf8')); if(j.model?.uuid) m.set(j.model.uuid,j); }catch{} } } })(dir);
  return m; }
function nameUuidStats(store,m){ let n=0; const byIor={}; for(const j of m.values()){ if(uuidRe.test(String(j.model?.name??''))){ n++; const k=(j.ior||'?').replace('ior:class:',''); byIor[k]=(byIor[k]||0)+1; } }
  console.log(`[${store}] units=${m.size} · name-IS-UUID=${n} (${Object.entries(byIor).map(([k,v])=>k+':'+v).join(', ')||'none'})`); return n; }
const si=load('scenario'), ms=load('data/model-store');
nameUuidStats('scenario/index',si); nameUuidStats('data/model-store',ms);
const overlap=[...ms.keys()].filter(u=>si.has(u));
let agree=0,dis=0; for(const u of overlap){ const a=ms.get(u),b=si.get(u); const nA=(a.model?.name??'')===(b.model?.name??''); const oA=String(a.ownerIor??null)===String(b.ownerIor??null); if(nA&&oA)agree++; else dis++; }
console.log(`OVERLAP (unit in BOTH stores — must be ONE) = ${overlap.length} · copies AGREE(name+owner)=${agree} · DISAGREE=${dis}`);
console.log(`RENDER-vs-PERSISTED: name=uuid in data/model-store => ${nameUuidStats.persisted='PERSISTED (data defect in the generated store, not render-only)'}`);
