// T40.1 final pass — BEHAVIORAL halves on SCRATCH @HEAD (0.8.130), owner system-session (R40.31 foundation).
// NEVER mutates prod/Tron's task — scratch worktree, torn down.
//   (3-clears) a QA-Review task DECLINED → QA-Review-with-open-CR band → resolve-cr → back to CLEAN 'QA Review'.
//   (4) single-focus: make-current(A) then make-current(B) ⇒ current=B AND next=A, never two currents.
import { setupFoundation } from './r4031-foundation.mjs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const A = '9f11a990-79bd-46e4-95e2-abe066f4b95b'; // real Sprint-40 Task 40.28 (QA Review, in resolved sprint → designation wins)
const B = '9a70ce5e-7e88-45f9-b921-0f8e9caf07a6'; // real Sprint-40 Task 40.10 (QA Review)
const CS = 'current-sprint-singleton-0000-000000000001';

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
console.log(`scratch@HEAD served=${f.servedVersion} sha=${f.worktreeSha} owner=${f.ownerIsServerManager}`);
const post = (u, verb) => fetch(`${f.base}/api/task/${u}/${verb}`, { method: 'POST', headers: oh }).then(r => r.status).catch(() => 0);
const statusOf = async (u) => { const r = await fetch(`${f.base}/api/ior/ior:instance:${u}`).catch(() => null); if (!r) return '?'; const d = await r.json(); return d?.unit?.model?.status ?? '?'; };
const slots = async () => {
  const r = await fetch(`${f.base}/api/trace/children/${CS}`).catch(() => null); if (!r) return {};
  const d = await r.json(); const ch = Array.isArray(d) ? d : (d.children || []);
  const find = (marker) => { const c = ch.find(x => (x.name || '').includes(marker)); return c ? { uuid: c.uuid, name: (c.name || '').slice(0, 40) } : null; };
  return { current: find('📌 Current'), next: find('📋 Next Backlog'), currentCount: ch.filter(x => (x.name || '').includes('📌 Current')).length };
};

try {
  // ── (3) decline → band → resolve-cr → clean QA ──
  const qa = f.seeded.qaReview;
  const before = await statusOf(qa);
  const dCode = await post(qa, 'decline');
  const banded = await statusOf(qa);
  const rCode = await post(qa, 'resolve-cr');
  const cleared = await statusOf(qa);
  console.log(`\n(3) seeded QA task ${qa.slice(0,8)}: "${before}" --decline(${dCode})--> "${banded}" --resolve-cr(${rCode})--> "${cleared}"`);
  const item3 = /qa-?review-with-open-cr/i.test(banded) && rCode === 200 && /^qa.?review$/i.test(cleared.replace(/-/g,' ').trim());
  console.log(`(3) band clears to clean QA-Review via resolve-cr: ${item3 ? 'GUARANTEED' : 'NOT-GUARANTEED'}`);

  // ── (4) single-focus: make-current A, then B ──
  // A/B are clean QA-Review → a designation on clean-QA AUTO-ADVANCES (#86-4) so it wouldn't stick and single-focus
  // couldn't be observed. Decline both to the BAND (QA-Review-with-open-CR) first — a band designation STAYS current
  // (#86-4) → the designation sticks → single-focus demotion is observable. (scratch mutation, torn down.)
  await post(A, 'decline'); await post(B, 'decline');
  console.log(`\n(4 setup) A→band=${await statusOf(A)} B→band=${await statusOf(B)} (bands stick; clean-QA auto-advances)`);
  const mcA = await post(A, 'make-current'); const afterA = await slots();
  const mcB = await post(B, 'make-current'); const afterB = await slots();
  console.log(`\n(4) make-current A=40.28(${A.slice(0,8)})→${mcA}: current=${afterA.current?.uuid?.slice(0,8)} count=${afterA.currentCount}`);
  console.log(`    make-current B=40.10(${B.slice(0,8)})→${mcB}: current=${afterB.current?.uuid?.slice(0,8)} next=${afterB.next?.uuid?.slice(0,8)} currentCount=${afterB.currentCount}`);
  const curIsB = afterB.current?.uuid === B;
  const nextIsA = afterB.next?.uuid === A;
  const oneCurrent = afterB.currentCount === 1;
  const item4 = curIsB && nextIsA && oneCurrent;
  console.log(`    current=B: ${curIsB} | next=A(demoted): ${nextIsA} | exactly one current: ${oneCurrent}`);
  console.log(`(4) single-focus (Set-Current B ⇒ current=B, next=A, never two currents): ${item4 ? 'GUARANTEED' : 'NOT-GUARANTEED'}`);

  console.log(`\n=== SCRATCH BEHAVIORAL: (3) ${item3 ? 'GUARANTEED' : 'NOT-GUARANTEED'} · (4) ${item4 ? 'GUARANTEED' : 'NOT-GUARANTEED'} ===`);
} finally { const td = await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
