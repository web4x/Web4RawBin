// [test:uuid:5ad927a9-4229-47bc-bb8c-21e52d6a923c] R26.5 reconcileConflict
// [test:uuid:f6de8f4d-78b9-472e-8f1d-4aab2944304c] R26.4 resolveChildrenLazily
// T26.4+T26.5 v0.7.5 gate — federation Transfer (lazy child resolve + conflict reconcile).
// PURE class-method tests on federation-transfer.ts Transfer (no disk writes) → ZERO pollution. DET-3x.
//   (1) R26.4 resolveChildrenLazily: children stay as @host refs, File bytes lazy by contentHash.
//   (2) R26.5 reconcileConflict same-origin re-drag → idempotent (noop/update, NOT remapped).
//   (3) R26.5 reconcileConflict diff-origin collision → re-mint fresh uuid + provenance (remapped).

import { execSync } from 'child_process';

const REPO = '/var/dev/Workspaces/2cuGitHub/Web4RawBin';
const EXISTING = 'c8dc9d0d-ad6d-4d1e-a3af-7967cccdb37d'; // real local unit in the index

function transferChecks() {
  const out = execSync(`npx tsx -e "` +
    `import {Transfer} from './src/ts/server/federation-transfer.ts';` +
    `import {ScenarioIndex} from './src/ts/scenario/index.ts';` +
    `const self='https://prod.wo-da.de:4444';const remote='https://other.host';` +
    `const idx=new ScenarioIndex('${REPO}/scenario/index');` +
    `const t=new Transfer({index:idx,selfHost:self,hasContentHash:()=>false});` +
    `const file={ior:'ior:class:File',model:{uuid:'gate-file',children:['ior:instance:child-1'],contentHash:'deadbeef'}};` +
    `const plan=t.resolveChildrenLazily(file,remote);` +
    `const ex=idx.get('${EXISTING}');` +
    `const r2=t.reconcileConflict(ex,self,new Map());` +          // same-origin (self) -> idempotent
    `const r3=t.reconcileConflict(ex,remote,new Map());` +        // diff-origin -> remint
    `console.log(JSON.stringify({` +
      `childRef:plan.childRefs[0]||'',lazyBytes:plan.lazyBytes,` +
      `r2action:r2.action,r2remap:r2.remapped,r2uuid:r2.localUuid,` +
      `r3action:r3.action,r3remap:r3.remapped,r3uuid:r3.localUuid,r3origin:(r3.unit.model||{}).originHost||'',r3ior:(r3.unit.model||{}).originIor||''` +
    `}));"`, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(out.trim().split('\n').filter(l => l.startsWith('{')).pop());
}

const results = [];
for (let i = 1; i <= 3; i++) {
  const f = transferChecks();
  // (1) child stays a federated @host ref; File bytes lazy (contentHash present)
  const item1 = /^ior:instance:child-1@https:\/\/other\.host/.test(f.childRef) && f.lazyBytes === true;
  // (2) same-origin re-drag = idempotent: noop or update, NOT remapped, uuid unchanged
  const item2 = (f.r2action === 'noop' || f.r2action === 'update') && f.r2remap === false && f.r2uuid === EXISTING;
  // (3) diff-origin collision = re-mint fresh uuid + provenance (originHost + originIor), remapped
  const item3 = f.r3action === 'remint' && f.r3remap === true && f.r3uuid !== EXISTING && f.r3origin === 'https://other.host' && /@https:\/\/other\.host$/.test(f.r3ior);
  const pass = item1 && item2 && item3;
  results.push(pass);
  console.log(`iter ${i}: (1)lazy@host=${item1}[${f.childRef.slice(0, 42)},bytes=${f.lazyBytes}] (2)idempotent=${item2}[${f.r2action},remap=${f.r2remap}] (3)remint+prov=${item3}[${f.r3action},remap=${f.r3remap},new=${f.r3uuid.slice(0, 8)}] => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT T26.4+T26.5 federation Transfer (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('PURE class-method tests (no disk writes) — 0 pollution.');
process.exit(green ? 0 : 1);
