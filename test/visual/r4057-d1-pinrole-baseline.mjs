// R40.57 D1 RED BASELINE — the SERVER-LEVEL specimen (one layer beneath the cross-view frame cbb7a0906). PROVES WHY the
// two views disagree: designate a task, then read that TASK's OWN SERVED pinRole — it comes back 'other' even though it
// IS the designated current (slots.current == it). No browser needed; this is the payload the action-bar consumes.
// ROOT (architect + confirmed in code): attachTaskPinRole(currentUuid) where currentUuid=currentTaskUuidFromSlots(idx),
// and server.ts:1402 reads `slots.current.uuid` via an unsafe `as {current?:{uuid?:string}}` cast — but TaskSlot's field
// is `taskUuid` (CurrentSprint.ts:47) → `.uuid` is undefined → String('')  → attachTaskPinRole('') tags EVERY task 'other'
// (server.ts:1409). So since v0.8.124 NO task is ever tagged current in the action bar. R40.56's replacement never worked;
// the R40.56 verify passed only because it measured the PIN (the resolver's output), never the action-bar CONSUMER.
// CORRECT PROPERTY: a designated task (slots.current == it) MUST have served pinRole == 'current'. Comes back 'other' → RED.
// STOP RULE: if pinRole comes back 'current' (GREEN) the specimen is wrong — STOP, do NOT tune. Scratch v0.8.124,
// phantom-guarded, own owner session, zero prod mutation.
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const CSU = 'current-sprint-singleton-0000-000000000001';
const KNOWN = ['7a956c21-5f37-4062-b921-9bdd5a461546']; // Tron's Task 40.1
const OUT = 'test-results/r4057-d1'; fs.mkdirSync(OUT, { recursive: true });

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
console.log(`scratch: ${f.base} servedVersion=${f.servedVersion} sha=${f.worktreeSha} (prod=0.8.124; phantom-guard by servedVersion)`);
const jf = (u) => fetch(`${f.base}${u}`, { headers: oh }).then(r => r.json()).catch(() => null);
const resolvedCurrent8 = async () => { const d = await jf(`/api/trace/children/${CSU}`); const cur = (d?.children || []).find(c => /Current\b/.test(String(c.name || '')) && !/CurrentSprint/.test(String(c.name || ''))); return cur?.uuid?.slice?.(0, 8) || null; };
const statusOf = async (u) => { const d = await jf(`/api/ior/ior:instance:${u}`); return d?.unit?.model?.status ?? d?.model?.status ?? null; };
const servedPinRole = async (u) => { const d = await jf(`/api/ior/ior:instance:${u}`); return d?.unit?.model?.pinRole ?? d?.model?.pinRole ?? '(none)'; };
const nameOf = async (u) => { const d = await jf(`/api/ior/ior:instance:${u}`); return d?.unit?.model?.name ?? d?.model?.name ?? ''; };

const raw = { servedVersion: f.servedVersion, sha: f.worktreeSha, specimens: [] };
try {
  // gather designatable tasks whose designation resolves as slots.current (Tron's 40.1 + a couple current-sprint tasks)
  const cand = [...KNOWN];
  const tree = await jf(`/api/trace/children/${CSU}`);
  for (const k of (tree?.children || [])) { if (k.uuid && /Task/i.test(k.type || '') && !cand.includes(k.uuid)) cand.push(k.uuid); }

  for (const u of cand) {
    if (raw.specimens.length >= 4) break;
    const mc = await fetch(`${f.base}/api/task/${u}/make-current`, { method: 'POST', headers: oh }).then(r => r.status).catch(() => 0);
    if (mc !== 200) continue;
    const cur8 = await resolvedCurrent8();
    const isDesignatedCurrent = cur8 === u.slice(0, 8);       // slots.current (the PIN's source) == this task
    if (!isDesignatedCurrent) continue;                        // only specimens where the task IS the resolved current
    const pinRole = await servedPinRole(u);                    // the action-bar's payload for THIS task
    const nm = await nameOf(u); const num = (nm.match(/([0-9]+\.[0-9]+)/) || ['', '?'])[1];
    const correct = pinRole === 'current';                     // CORRECT property: designated current ⇒ pinRole 'current'
    raw.specimens.push({ uuid8: u.slice(0, 8), num, status: await statusOf(u), slotsCurrentIsSelf: isDesignatedCurrent, servedPinRole: pinRole, pinRoleCorrect: correct });
    console.log(`  task ${num} (${u.slice(0,8)}): slots.current==self=${isDesignatedCurrent}  servedPinRole='${pinRole}'  → pinRole-correct(=='current')=${correct}  ${correct ? '' : '⟵ RED: designated current but tagged OTHER'}`);
  }

  const staged = raw.specimens.filter(s => s.slotsCurrentIsSelf);
  const allOther = staged.length > 0 && staged.every(s => s.servedPinRole === 'other');
  const anyWrong = staged.some(s => !s.pinRoleCorrect);
  console.log('\n════ R40.57 D1 SERVER-pinRole BASELINE (v' + f.servedVersion + ') ════');
  console.log(`  specimens staged (task IS slots.current): ${staged.length}`);
  console.log(`  every designated-current task served pinRole='other': ${allOther}`);
  const red = anyWrong; // the correct property is VIOLATED → RED (the D1 defect)
  console.log(`  D1 VERDICT: ${red ? 'RED ✓ — designated current tagged pinRole=other (server field-name bug slots.current.uuid vs .taskUuid @server.ts:1402, silenced by the as-cast) → action-bar can never agree' : 'GREEN ✗ — pinRole tracks slots; if GREEN the specimen is wrong, STOP + do NOT tune'}`);
  if (!staged.length) console.log('  ⚠ SETUP: no task resolved as slots.current — cannot stage D1; report as finding, NOT a green.');
  raw.d1Red = red; raw.allOther = allOther;
  fs.writeFileSync(`${OUT}/r4057-d1-raw-v${f.servedVersion}.json`, JSON.stringify(raw, null, 2));
} finally {
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}
