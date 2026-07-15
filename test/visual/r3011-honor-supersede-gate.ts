// [test:uuid:4ad7879f-e140-4431-82e0-b11f5cdcb1e7] R30.11 Chain.implRetiredBySupersede (Impl 7f15c149) — honorSupersededBy at IMPL/hop level: an impl supersededBy a LIVE non-superseded successor reads RETIRED-not-open; ANTI-GREEN-WASH guards: dangling successor (AC4) + chained/superseded successor (AC2) do NOT clear; no-supersededBy does not clear. Integration: scoreboard clears EXACTLY R30.10+R30.6.1+R30.6.3, preserves real opens (R30.11/R30.18 test), R30.10 fileHistory UC stays tracked.
// R30.11 (v0.7.x, skill-classes.ts). Run: npx tsx test/visual/r3011-honor-supersede-gate.ts. DET-3x.
import { Chain } from '../../src/ts/scenario/skill-classes.js';
import { ScenarioIndex } from '../../src/ts/scenario/index.js';
import fs from 'fs';
import path from 'path';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const shard = (u: string) => path.join(REPO, 'scenario/index', ...u.slice(0, 5).split(''), u + '.scenario.json');
const mkChain = () => new Chain(new ScenarioIndex(path.join(REPO, 'scenario/index')), path.join(REPO, 'src'), path.join(REPO, 'test')) as any;

// throwaway impls: dangling successor (AC4) + chained successor 58c11039-is-itself-superseded (AC2)
const DANGLING = 'a0000000-0000-4000-8000-000000000001';
const CHAINED = 'b0000000-0000-4000-8000-000000000002';
const fakes: Record<string, string> = {
  [DANGLING]: 'ior:instance:deadbeef-0000-4000-8000-000000000099', // → non-existent
  [CHAINED]: 'ior:instance:58c11039-3f11-464d-a8fe-641722f78e2b',  // → 58c11039, which is supersededBy 751934c1 (chained)
};
function writeFakes() { for (const [u, sup] of Object.entries(fakes)) { const p = shard(u); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify({ ior: 'ior:class:Implementation', model: { uuid: u, name: 'r3011-guard-fake', supersededBy: sup }, ownerIor: '' }, null, 2) + '\n'); } }
function cleanFakes() { for (const u of Object.keys(fakes)) { try { fs.rmSync(shard(u), { force: true }); } catch {} } }

writeFakes();
const results: boolean[] = [];
try {
  for (let i = 1; i <= 3; i++) {
    const chain = mkChain();
    const call = (u: string) => chain.implRetiredBySupersede(u) as string | null;
    // (valid) 58c11039 supersededBy 751934c1 (live) → non-null successor
    const valid = call('58c11039-3f11-464d-a8fe-641722f78e2b');
    // (AC4) dangling → null
    const dangling = call(DANGLING);
    // (AC2) chained (successor 58c11039 is itself superseded) → null
    const chained = call(CHAINED);
    // (no supersededBy) live impl eb994dcd → null
    const none = call('eb994dcd-d9dc-4b55-84e8-13b2be3b47d5');

    const validOk = typeof valid === 'string' && valid.length > 0;      // retires to a live successor
    const danglingOk = dangling === null;                                // AC4
    const chainedOk = chained === null;                                  // AC2
    const noneOk = none === null;                                        // no-supersede
    const pass = validOk && danglingOk && chainedOk && noneOk;
    results.push(pass);
    console.log(`iter ${i}: valid(58c11039→${valid})=${validOk} | AC4 dangling→${dangling}=${danglingOk} | AC2 chained→${chained}=${chainedOk} | no-supersede eb994dcd→${none}=${noneOk} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { cleanFakes(); }

// integration: scoreboard clears EXACTLY the 3 + preserves real opens + R30.10 fileHistory tracked
const sb = mkChain().scoreboard([], 'S30') as string;
const line = (r: string) => (sb.split('\n').find(l => l.includes(`| ${r} `)) || '');
const retired = (r: string) => /retired/.test(line(r));
const complete = (r: string) => /\| check .*\| check /.test(line(r)) && !/open/.test(line(r));
const stillOpenTest = (r: string) => /open tester/.test(line(r));
const int = {
  r61Retired: retired('R30.6.1'), r63Retired: retired('R30.6.3'),
  r10CompleteViaFileHistory: /fileHistory/.test(line('R30.10')) && complete('R30.10'),   // AC3: fileHistory UC tracked → R30.10 complete
  r11ImplCheck: /check 7f15c149/.test(line('R30.11')),
  realOpensPreserved: stillOpenTest('R30.11') && stillOpenTest('R30.18'),                 // real opens NOT masked
};
const intPass = int.r61Retired && int.r63Retired && int.r10CompleteViaFileHistory && int.r11ImplCheck && int.realOpensPreserved;

console.log('\n===== R30.11 honorSupersededBy (anti-green-wash) =====');
console.log(`  GUARDS DET-3x: ${results.every(Boolean) && results.length === 3 ? 'GREEN' : 'RED'} (valid retires, dangling/chained/none do NOT)`);
console.log(`  INTEGRATION: R30.6.1 retired=${int.r61Retired} R30.6.3 retired=${int.r63Retired} R30.10 complete-via-fileHistory=${int.r10CompleteViaFileHistory} R30.11 impl check=${int.r11ImplCheck} real-opens-preserved(R30.11/R30.18 test)=${int.realOpensPreserved} => ${intPass ? 'GREEN' : 'RED'}`);
const green = results.length === 3 && results.every(Boolean) && intPass;
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
