// v0.6.85 getThreeSlots sprint-scope gate. Bug: nextBacklog showed a DONE Sprint-20 task
// (T-drawer-full-width) from a global scan. FIX (f5d38bdb7/4aa2d913a): all 3 CurrentSprint
// slots derive from the CURRENT sprint tasks[] only. Slots are persisted in singleton
// model.slots (server reads cached) — read-only, no re-persist needed here.
//
// Gate (DET-3x): GET /api/trace/children/<current-sprint-singleton> -> 3 slots
//   (Current / Last Completed / Next Backlog) all Sprint 24 tasks; NO cross-sprint or DONE
//   phantom (no 'drawer-full-width', no Sprint 20/21/22/23 task as a slot).

import https from 'https';
const SINGLETON = 'current-sprint-singleton-0000-000000000001';
const SPRINT = 24;
const get = (p) => new Promise((res) => {
  const req = https.get({ host: 'prod.wo-da.de', port: 4444, path: p, rejectUnauthorized: false, timeout: 8000 }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, json: j }); }); });
  req.on('error', () => res({ status: 0, json: null })); req.on('timeout', () => { req.destroy(); res({ status: 0, json: null }); });
});
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// extract "Task <n>.<m>" sprint number from a slot name
const sprintOf = (name) => { const m = String(name || '').match(/Task\s+(\d+)\.\d+/i); return m ? parseInt(m[1]) : null; };

const results = [];
for (let run = 1; run <= 3; run++) {
  const r = await get(`/api/trace/children/${SINGLETON}?mode=trace`);
  const kids = r.json?.children || [];
  const slots = kids.map(c => ({ name: c.name || '', sprint: sprintOf(c.name) }));
  // 3 slots present (Current / Last Completed / Next Backlog)
  const labels = ['Current', 'Last Completed', 'Next Backlog'];
  const found = labels.map(l => slots.find(s => s.name.includes(l + ':')));
  const allPresent = found.every(Boolean);
  // every slot is a Sprint-24 task
  const allCurrentSprint = slots.length > 0 && slots.every(s => s.sprint === SPRINT);
  // no phantom: no DONE Sprint-20 'drawer-full-width', no slot from an earlier sprint
  const noPhantom = !kids.some(c => /drawer-full-width/i.test(c.name || '')) && !slots.some(s => s.sprint !== null && s.sprint < SPRINT);

  const pass = r.status === 200 && allPresent && allCurrentSprint && noPhantom;
  results.push(pass);
  console.log(`run ${run}: status=${r.status} slots=[${slots.map(s => s.name.replace(/Task /, 'T').match(/[📌✅📋].*?:\s*T?(\d+\.\d+)/)?.[1] || '?').join(', ')}] allSprint${SPRINT}=${allCurrentSprint} noPhantom=${noPhantom} => ${pass ? 'GREEN' : 'RED'}`);
  await sleep(300);
}

console.log('\n=== VERDICT getThreeSlots sprint-scope (DET-3x) ===');
results.forEach((p, i) => console.log(`  run ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
