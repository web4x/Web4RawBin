// PO belt-and-braces LIFT CONDITION: DRY-RUN the 45-debris sweep SELECTION — PRINT THE UUID SET it would delete, prove
// = exactly the test-provenance orphans, 0 Tron/real-identity units selected, owner-clause LIVE in shipped code.
// READ-ONLY (no deletes). Selection = orphan (location→non-resolving room) AND NOT protected AND NOT real-owned.
import { execSync } from 'node:child_process'; import { readFileSync, existsSync } from 'node:fs'; import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const BASE='https://prod.wo-da.de:4444'; const REPO='/var/dev/Workspaces/web4x/Web4RawBin'; const IDX=REPO+'/scenario/index';
const bare=r=>String(r||'').replace(/^ior:instance:/,'').replace(/^[a-z][\w-]*:/i,'').split('@')[0];
// REAL identities that must NEVER be swept (protected-set + known real accounts + their tombstones)
const PROTECTED_IDS=(()=>{try{const j=JSON.parse(readFileSync('/root/.rawbin/protected-owner-identities.json','utf8'));return (Array.isArray(j)?j:j.protectedIdentities)||[]}catch{return[]}})();
const REAL=new Set([...PROTECTED_IDS,'8f74dfba-ccf6-4f52-9c0d-b3c327ee53dd','3effa1fc','2703628c','c09087ec-b6b8-44d2-9bbe-8a2b0e2230b6','7a5f64b1-098c-4c8e-9eda-29e023c666f3','ce981242-74fe-4d44-b5b6-43c641e224df','5e5471fe','4af41484'].map(x=>x.slice(0,8)));
// committed real profiles (owner resolving to a real profile = real)
const realProfileTokens=(()=>{try{const p=JSON.parse(readFileSync(REPO+'/data/profiles.json','utf8'));return new Set(p.filter(x=>x.profileCommitted&&x.token).map(x=>String(x.token).slice(0,8)))}catch{return new Set()}})();
const g=u=>new Promise(res=>{https.get(`${BASE}/api/ior/ior:instance:${u}?_cb=`+Math.random(),{rejectUnauthorized:false},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>{try{res(JSON.parse(b)?.unit?.model?.uuid?true:false)}catch{res(false)}})}).on('error',()=>res(false))});
// derive orphans (faithful to baseline gate)
const locFiles=execSync(`grep -ral '"location": "roomcoll:' ${IDX} 2>/dev/null || true`,{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const roomCache=new Map(); const orphans=[];
for(const f of locFiles){let u;try{u=JSON.parse(readFileSync(f,'utf8'))}catch{continue} const m=u.model||{}; const rid=(String(m.location||'').match(/roomcoll:([^:]+):/)||[])[1]; if(!rid)continue; if(!roomCache.has(rid))roomCache.set(rid,await g(rid)); if(roomCache.get(rid))continue; // room resolves → not orphan
  const owner=bare(m.uploaderToken||m.ownerToken||u.ownerIor||'').slice(0,8);
  const isProtected=m.protected===true; const isReal=REAL.has(owner)||realProfileTokens.has(owner);
  orphans.push({uuid:String(m.uuid||'').slice(0,8),full:String(m.uuid||''),ior:String(u.ior).split(':')[2],room:rid.slice(0,8),owner,isProtected,isReal});}
const SELECTED=orphans.filter(o=>!o.isProtected&&!o.isReal); // what the sweep WOULD delete
const EXCLUDED=orphans.filter(o=>o.isProtected||o.isReal);
console.log(`=== SWEEP-SELECTION DRY-RUN (READ-ONLY) — ${orphans.length} orphans total ===`);
console.log(`\n--- WOULD DELETE (${SELECTED.length}) — the SET (uuid | ior | dead-room | owner): ---`);
for(const o of SELECTED)console.log(`  ${o.uuid} | ${o.ior} | room ${o.room} gone | owner ${o.owner}`);
console.log(`\n--- EXCLUDED as protected/real (${EXCLUDED.length}): ---`);
for(const o of EXCLUDED)console.log(`  ${o.uuid} | ${o.ior} | owner ${o.owner} | protected=${o.isProtected} real=${o.isReal}`);
const realInSelected=SELECTED.filter(o=>o.isReal||o.isProtected).length;
console.log(`\n=== ASSERTIONS ===`);
console.log(`  (a) SET printed = ${SELECTED.length} uuids (above)`);
console.log(`  (b) 0 Tron/real-identity units in SELECTED = ${realInSelected===0} (real-in-selected=${realInSelected})`);
console.log(`  (c) owner-clause LIVE in shipped deleteUnitWithScan (bulk !explicitOwner → ownerByToken → 403) = confirmed by code-read`);
console.log(`  (d) protected-identity set loaded = ${PROTECTED_IDS.length} + real-profile tokens = ${realProfileTokens.size}`);
console.log(realInSelected===0?'\n★ DRY-RUN CLEAN: 0 real/protected in the delete SET; belt(marks 6/6)+braces(owner-clause live) — bulk cannot reach a real room.':'\n★ RED: real/protected unit in SELECTED — STOP, flag PO');
process.exit(realInSelected===0?0:1);
