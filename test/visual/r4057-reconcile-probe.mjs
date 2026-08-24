// R40.57 #3 RECONCILIATION with expert — answer EXACTLY: on MY specimen (LIVE scratch@HEAD v0.8.126, after a LIVE
// make-current), does /api/trace/children?mode=trace return current=40.1 or NONE for the designated task, and am I
// reading .uuid vs .taskUuid (the false-negative the expert caught). Print BOTH fields + the no-arg-getThreeSlots side.
import { setupFoundation } from './r4031-foundation.mjs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const CSU = 'current-sprint-singleton-0000-000000000001';
const TASK = '7a956c21-5f37-4062-b921-9bdd5a461546'; // Task 40.1 (the designated one)

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
console.log(`STATE: LIVE scratch@HEAD served=${f.servedVersion} sha=${f.worktreeSha} (in-memory served process, NOT persisted disk) · designated=${TASK.slice(0,8)}`);
const jf = (u) => fetch(`${f.base}${u}`, { headers: oh }).then(r => r.json()).catch(e => ({ __err: String(e) }));
try {
  // LIVE make-current the designated task on the served process
  const mc = await fetch(`${f.base}/api/task/${TASK}/make-current`, { method: 'POST', headers: oh });
  console.log(`make-current(40.1) → ${mc.status} (LIVE on the served process)`);

  const dumpCurrent = async (url) => {
    const d = await jf(url);
    const kids = Array.isArray(d?.children) ? d.children : [];
    const cur = kids.find(k => k.role === 'current');
    // ALSO scan by name marker in case role isn't stamped
    const byName = kids.find(k => /📌 Current|Current\b/.test(String(k.name || '')) && !/CurrentSprint/.test(String(k.name || '')));
    return {
      roleCurrent_present: !!cur,
      roleCurrent_uuid: cur?.uuid?.slice?.(0, 8) ?? '(none)',
      roleCurrent_taskUuid: cur?.taskUuid?.slice?.(0, 8) ?? '(no .taskUuid field)',
      byNameCurrent_uuid: byName?.uuid?.slice?.(0, 8) ?? '(none)',
      byNameCurrent_taskUuid: byName?.taskUuid?.slice?.(0, 8) ?? '(no .taskUuid field)',
      childKeys: kids[0] ? Object.keys(kids[0]).join(',') : '(no children)',
    };
  };

  console.log('\n── (A) /api/trace/children?mode=trace (the drawer/bar endpoint) ──');
  console.log(JSON.stringify(await dumpCurrent(`/api/trace/children/${CSU}?mode=trace`), null, 1));
  console.log('\n── (A2) /api/trace/children (no mode, the pin path) ──');
  console.log(JSON.stringify(await dumpCurrent(`/api/trace/children/${CSU}`), null, 1));

  // reconcile: does the endpoint honor the designation (40.1) on EITHER field?
  const t = await dumpCurrent(`/api/trace/children/${CSU}?mode=trace`);
  const honors = [t.roleCurrent_uuid, t.roleCurrent_taskUuid, t.byNameCurrent_uuid, t.byNameCurrent_taskUuid].some(v => v === TASK.slice(0, 8));
  console.log(`\n⇒ ENDPOINT honors designation (40.1 on any current-field)? ${honors}`);
  console.log(`⇒ FIELD NOTE: role:current child exposes taskUuid? ${t.roleCurrent_taskUuid !== '(no .taskUuid field)'} — if my agreement gate read .uuid not .taskUuid, that is the same false-negative the expert caught.`);
} finally {
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}

// ── PARK-then-DESIGNATE read-after-write (matches my agreement RED's staging) — bug(ii) discriminator ──
// (the above is a fresh foundation per run; this block re-runs the exact park→designate→immediate-read sequence)
