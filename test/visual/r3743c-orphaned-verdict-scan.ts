// ORPHANED-VERDICT invariant scan (PO 2026-08-18) — a class the split-brain scan (stored-status vs checklist) CANNOT
// catch: a unit carrying approvedBy (a real Tron verdict) whose status/checklist AGREE at a pre-Done state = the verdict
// is recorded but the ADVANCE never happened. INVARIANT: approvedBy present ⇒ status MUST be 'Done' (+ Done box ticked).
// FAMILY: orphaned-verdict (approval-evidence-without-advance). CAPTURE-ONLY, report-only (NOT wired into ci) — the WRITE
// PATH is broken (architect root-causing); repairing the DATA now would mask a live defect that re-orphans the next tap.
// Widened to ALL scenario units (approval evidence may live off Task units). node22: PATH=/opt/node22/bin:$PATH npx tsx <this>
import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin/scenario/index';
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : (e.name.endsWith('.scenario.json') ? [path.join(d, e.name)] : []));
// approvedBy present ⇒ status MUST be 'Done' (and, when a checklist exists, its Done box ticked). Else = ORPHANED.
const orphanedVerdict = (m: any): boolean => { if (!m.approvedBy) return false; const doneTicked = /- \[x\] Done/.test(String(m.statusChecklist ?? '')); return m.status !== 'Done' || (m.statusChecklist != null && !doneTicked); };
let total = 0, withApproval = 0; const orphaned: any[] = [], ok: any[] = [];
for (const f of walk(ROOT)) { let u: any; try { u = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; } const m = u.model || {}; total++; if (!m.approvedBy) continue; withApproval++;
  const rec = { uuid: (m.uuid || '').slice(0, 8), ior: u.ior, status: m.status, doneTicked: /- \[x\] Done/.test(String(m.statusChecklist ?? '')), approvedBy: m.approvedBy, doneBasis: m.doneBasis || null, name: (m.name || '').slice(0, 42) };
  (orphanedVerdict(m) ? orphaned : ok).push(rec); }
console.log(`Scanned ${total} units. Carrying approvedBy: ${withApproval}. OK(=Done): ${ok.length}. ★ ORPHANED-VERDICT: ${orphaned.length}`);
for (const o of ok) console.log(`  OK       ${o.uuid} ${o.ior} status='${o.status}' doneTicked=${o.doneTicked} :: ${o.name}`);
for (const o of orphaned) console.log(`  ORPHANED ${o.uuid} ${o.ior} status='${o.status}' doneTicked=${o.doneTicked} approvedBy=${o.approvedBy} doneBasis=${o.doneBasis} :: ${o.name}`);
// STUB-MUST-FAIL (non-vacuous): an approvedBy+pre-Done unit is CAUGHT; an approvedBy+Done unit is CLEAN.
const bite = orphanedVerdict({ approvedBy: 'x', status: 'QA Review', statusChecklist: '- [x] QA Review\n- [ ] Done' })
  && !orphanedVerdict({ approvedBy: 'x', status: 'Done', statusChecklist: '- [x] QA Review\n- [x] Done' });
console.log(`stub-must-fail (orphaned caught + done clean): ${bite}`);
console.log('CAPTURE-ONLY — report, do NOT repair (write path broken; a data-fix would mask + re-orphan the next tap).');
process.exitCode = (bite && orphaned.length >= 0) ? 0 : 1; // report-only; exit reflects the bite validity, not the finding count
