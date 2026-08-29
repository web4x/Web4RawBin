// FORWARD-BEHAVIOR proof of the checklist fix dc514665b (R40.59): a decline must KEEP QA Review [x] + add the [ ]
// processing-change-requests sub-step (NOT untick QA Review). Exercised on SCRATCH at HEAD (=deploy-branch 0.8.140),
// on a REAL QA-Review task — pollution-safe (scratch worktree, torn down). Distinguishes 'fix works forward' from
// 'fix is broken': T40.1's live state is still [ ] (pre-fix regression, not retroactive) — this proves the CODE.
import { setupFoundation } from './r4031-foundation.mjs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const QA = '9f11a990-79bd-46e4-95e2-abe066f4b95b'; // real Sprint-40 Task 40.28 (QA Review)
const HARD = setTimeout(() => { console.log('RED: WATCHDOG'); process.exit(1); }, 180000);
const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
const box = (cl, label) => { const m = new RegExp(`^\\s*-\\s*\\[([ xX])\\]\\s*${label}`, 'im').exec(cl || ''); return m ? m[1].trim() || ' ' : 'NONE'; };
const sub = (cl) => { const m = /^\s+-\s*\[([ xX])\]\s*processing change requests/im.exec(cl || ''); return m ? (m[1].trim() || ' ') : 'NONE'; };
const readCl = async () => { const r = await fetch(`${f.base}/api/ior/ior:instance:${QA}`, { signal: AbortSignal.timeout(15000) }).catch(() => null); if (!r) return ''; const d = await r.json(); return (d?.unit?.model || {}).statusChecklist || ''; };
try {
  console.log(`scratch@HEAD served=${f.servedVersion} sha=${f.worktreeSha}`);
  const before = await readCl();
  console.log(`BEFORE decline: QA Review box=[${box(before, 'QA Review')}] sub-step=[${sub(before)}]`);
  const dc = await fetch(`${f.base}/api/task/${QA}/decline`, { method: 'POST', headers: oh, signal: AbortSignal.timeout(15000) }).then(r => r.status).catch(() => 0);
  const after = await readCl();
  const qaAfter = box(after, 'QA Review'), subAfter = sub(after);
  console.log(`decline POST → ${dc}`);
  console.log(`AFTER decline:  QA Review box=[${qaAfter}] sub-step=[${subAfter}]`);
  const keptTicked = qaAfter === 'x';         // ★ the fix: QA Review STAYS [x]
  const subAdded = subAfter === ' ';          // + the [ ] sub-step added
  console.log(`\n── FORWARD-FIX (decline keeps QA Review [x] + adds [ ] sub-step) ──`);
  console.log(`  QA Review stays [x]: ${keptTicked ? 'YES' : `NO (=[${qaAfter}])`} | sub-step [ ] added: ${subAdded ? 'YES' : `NO (=[${subAfter}])`}`);
  console.log(keptTicked && subAdded
    ? 'GREEN: the fix WORKS forward — a decline keeps QA Review [x] and adds the [ ] sub-step (no untick regress).'
    : `RED: forward decline ${keptTicked ? 'kept [x] but' : 'UNTICKED QA Review ([' + qaAfter + '])'} sub-step=[${subAfter}] — fix did not achieve keep-[x].`);
} finally { const td = await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); clearTimeout(HARD); process.exit(0); }
