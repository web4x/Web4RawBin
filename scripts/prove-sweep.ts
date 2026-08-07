// R-C7 sweep — run the FIXED proveComplete over EVERY Sprint unit → the authoritative apply-ready set.
// READ-ONLY (proveComplete never writes). Run: /opt/node22/bin/node --import tsx scripts/prove-sweep.ts
import { proveComplete } from './migrate-boards.js';
import { allUnits } from './generate-sprint-md.js';

const sprints = [...allUnits().values()].filter((u) => u.ior === 'ior:class:Sprint');
const ready: { slug: string; uuid: string }[] = [];
const refusing: { slug: string; why: string }[] = [];
for (const s of sprints) {
  const uuid = (s.model as any).uuid;
  const r = proveComplete(uuid);
  if (r.complete) ready.push({ slug: r.sprintSlug, uuid });
  else refusing.push({ slug: r.sprintSlug, why: r.reason ? r.reason.slice(0, 50) : `${r.gaps.length}gap/${r.needsReview.length}review` });
}
const num = (slug: string) => { const m = /sprint-(\d+)/.exec(slug); return m ? parseInt(m[1], 10) : -1; };
ready.sort((a, b) => num(a.slug) - num(b.slug));
refusing.sort((a, b) => num(a.slug) - num(b.slug));
console.log(`\n=== PROVE SWEEP (${sprints.length} Sprint units) — FIXED prover ===`);
console.log(`\nAPPLY-READY (${ready.length}):`);
for (const s of ready) console.log(`  [${num(s.slug) >= 1 && num(s.slug) <= 18 ? 'FROZEN S01-18' : 'IN-SCOPE'}] ${s.uuid}  ${s.slug}`);
console.log(`\nREFUSING (${refusing.length}):`);
for (const r of refusing) console.log(`  ${r.slug} — ${r.why}`);
