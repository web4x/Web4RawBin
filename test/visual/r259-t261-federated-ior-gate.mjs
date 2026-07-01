// [test:uuid:79643883-2892-4894-a0d7-7601fb3bf055] R26.1 resolveFederated
// T26.1 v0.7.2 gate — federated IOR (provenance + pluggable resolver). PURE-FUNCTION tests on
// federated-ior.ts (parseFederatedIor / isLocalOrigin / federatedIor / resolveFederated) + one
// real-IOR HTTP read for backward-compat end-to-end. ZERO pollution (no prod writes). DET-3x.
//   (1) bare uuid -> originHost null, resolves LOCALLY.
//   (2) uuid@remoteHost -> originHost=remote, NOT local (a federated ref; no local resolve).
//   (3) uuid@self -> originHost null (self collapses), resolves LOCALLY.
//   (4) backward-compat: ior:instance:<uuid> still parses local; federatedIor(uuid,null) stays bare;
//       an EXISTING real IOR still resolves via /api/ior (HTTP 200).

import { execSync } from 'child_process';
import https from 'https';

const REPO = '/var/dev/Workspaces/2cuGitHub/Web4RawBin';
const REAL_IOR = 'ior:instance:c8dc9d0d-ad6d-4d1e-a3af-7967cccdb37d'; // existing WebItem
const httpGet = (p) => new Promise((res) => { const r = https.get({ host: 'prod.wo-da.de', port: 4444, path: p, rejectUnauthorized: false, timeout: 8000 }, (x) => { let d = ''; x.on('data', c => d += c); x.on('end', () => res({ status: x.statusCode, body: d })); }); r.on('error', () => res({ status: 0 })); r.on('timeout', () => { r.destroy(); res({ status: 0 }); }); });

function pureFns() {
  const out = execSync(`npx tsx -e "` +
    `import {parseFederatedIor,isLocalOrigin,federatedIor,resolveFederated} from './src/ts/scenario/federated-ior.ts';` +
    `const self='prod.wo-da.de';const localGet=(u)=>u==='abc-123'?{model:{uuid:'abc-123'}}:null;` +
    `(async()=>{` +
    `const r1=parseFederatedIor('abc-123');const l1=isLocalOrigin(r1.originHost,self);const res1=await resolveFederated('abc-123',localGet,self);` +
    `const r2=parseFederatedIor('abc-123@other.host');const l2=isLocalOrigin(r2.originHost,self);const res2=await resolveFederated('abc-123@other.host',localGet,self);` +
    `const r3=parseFederatedIor('abc-123@self');const l3=isLocalOrigin(r3.originHost,self);const res3=await resolveFederated('abc-123@self',localGet,self);` +
    `const r4=parseFederatedIor('ior:instance:abc-123');const bc=federatedIor('abc-123',null,self);const res4=await resolveFederated('ior:instance:abc-123',localGet,self);` +
    `const rSelfHost=parseFederatedIor('abc-123@prod.wo-da.de');const lSelf=isLocalOrigin(rSelfHost.originHost,self);const remoteBuilt=federatedIor('abc-123','other.host',self);` +
    `console.log(JSON.stringify({r1o:r1.originHost,l1,res1:!!res1,r2o:r2.originHost,l2,res2:res2,r3o:r3.originHost,l3,res3:!!res3,r4u:r4.uuid,r4o:r4.originHost,bc,res4:!!res4,lSelf,remoteBuilt}));` +
    `})();"`, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(out.trim().split('\n').filter(l => l.startsWith('{')).pop());
}

const results = [];
for (let i = 1; i <= 3; i++) {
  const f = pureFns();
  // (1) bare -> local origin null, resolves local
  const item1 = f.r1o === null && f.l1 === true && f.res1 === true;
  // (2) uuid@remote -> origin=remote, NOT local, no local resolve (federated ref, loader absent -> null)
  const item2 = f.r2o === 'other.host' && f.l2 === false && f.res2 === null;
  // (3) uuid@self -> origin null (self collapses), local + resolves; and @<selfHost> also local
  const item3 = f.r3o === null && f.l3 === true && f.res3 === true && f.lSelf === true;
  // (4) back-compat: ior:instance: parses local, federatedIor(null) stays bare, remote build appends @host, real IOR resolves via HTTP
  const real = await httpGet(`/api/ior/${REAL_IOR}`);
  const item4 = f.r4u === 'abc-123' && f.r4o === null && f.bc === 'ior:instance:abc-123' && f.res4 === true && f.remoteBuilt === 'ior:instance:abc-123@other.host' && real.status === 200;
  const pass = item1 && item2 && item3 && item4;
  results.push(pass);
  console.log(`iter ${i}: (1)bareLocal=${item1} (2)remoteFederated=${item2} (3)@selfLocal=${item3} (4)backCompat=${item4}[realIOR=${real.status}] => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT T26.1 federated IOR (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('PURE-FN + 1 real-IOR HTTP read — 0 prod writes, 0 pollution.');
process.exit(green ? 0 : 1);
