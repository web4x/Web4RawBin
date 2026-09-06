// T37.37 AXIS-4 lint — drift-metric COMPLETENESS (R37.34 7698c63b, OWNER=tester). The drift check (generate-sprint-md --check)
// reports a FLOOR as the total: it accounts for SPRINT-level MDs (in-scope + frozen) while ~690 generated task/req MDs are
// silently outside the metric — the 7-vs-200 undercount class (~28x). Reporting a floor as the total is the same false-confidence
// the sprint kills. INVARIANT: checked + excluded(by declared category) == TOTAL generated artifacts; a silent exclusion => RED.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const ROOT = path.resolve('.');
const PMO = path.join(ROOT, 'scrum.pmo');

// TRUE total = every GENERATED md artifact on disk (header-marked). This is what a complete drift metric must account for.
function countGenerated() {
  let total = 0; const byType = { task: 0, req: 0, sprint: 0, other: 0 };
  (function w(d) { let e; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const x of e) { const p = path.join(d, x.name); if (x.isDirectory()) { w(p); continue; }
      if (!x.name.endsWith('.md')) continue; let head = ''; try { head = fs.readFileSync(p, 'utf8').slice(0, 80); } catch {}
      if (/GENERATED FROM SCENARIO UNITS|DO NOT HAND-EDIT/i.test(head)) { total++; if (/task-/.test(x.name)) byType.task++; else if (/req/.test(x.name)) byType.req++; else if (/sprint-\d/.test(x.name)) byType.sprint++; else byType.other++; } } })(PMO);
  return { total, byType };
}

// what the drift-check ACTUALLY accounts for (parse its own report).
function toolAccounting() {
  let out = ''; try { out = execSync('npx tsx scripts/generate-sprint-md.ts --check --all', { cwd: ROOT, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const m = out.match(/(\d+)\/(\d+)\s+IN-SCOPE/); const fz = out.match(/\+\s*(\d+)\s+frozen/i);
  const inScope = m ? Number(m[2]) : 0; const frozen = fz ? Number(fz[1]) : 0;
  // declared exclusion CATEGORIES the report names (AC: frozen-legacy, missing-file, hand-authored — each COUNTED + DECLARED)
  const declares = { frozen: /frozen/i.test(out), missing: /missing/i.test(out) && /\bmissing[^]*\d/i.test(out), handAuthored: /hand-authored[^]*\d|\bhand-authored\b.*count/i.test(out) };
  return { inScope, frozen, accounted: inScope + frozen, declares, raw: (out.match(/Result:.*/) || ['(no Result line)'])[0] };
}

// completeness predicate (the FAILABLE core): accounted must equal true total.
const isComplete = (accounted, total) => accounted >= total;

const { total, byType } = countGenerated();
const tool = toolAccounting();
const unaccounted = total - tool.accounted;
R(`═══ T37.37 AXIS-4 — drift-metric COMPLETENESS (checked + excluded == total) ═══`);
R(`  drift-check accounts: ${tool.accounted} (in-scope ${tool.inScope} + frozen ${tool.frozen}) — "${tool.raw}"`);
R(`  TRUE total generated artifacts on disk: ${total} (task ${byType.task} · req ${byType.req} · sprint ${byType.sprint} · other ${byType.other})`);
R(`  SILENTLY UNACCOUNTED (total − accounted) : ${unaccounted}  ${unaccounted <= 0 ? 'GREEN' : 'RED'}  ${unaccounted > 0 ? '← task/req generated MDs are NOT in the metric (floor read as total)' : ''}`);
R(`  exclusion categories DECLARED with a count: frozen=${tool.declares.frozen} · missing=${tool.declares.missing} · hand-authored=${tool.declares.handAuthored}  ${tool.declares.frozen && tool.declares.missing && tool.declares.handAuthored ? '' : '← a category is not separately counted+declared'}`);

// FAILABLE 1->0 (self-biting): a SILENT-exclusion input (accounted < total) MUST be RED; a complete one (accounted == total) GREEN.
const teeth = isComplete(total, total) === true && isComplete(total - 1, total) === false;
R(`  FAILABLE self-test (accounted<total→RED, accounted==total→GREEN): ${teeth ? 'PASS (a floor can no longer read as a total)' : 'FAIL'}`);

const categoriesComplete = tool.declares.frozen && tool.declares.missing && tool.declares.handAuthored;
const green = unaccounted <= 0 && categoriesComplete && teeth;
R(`OVERALL: ${green ? 'GREEN — every artifact accounted; each exclusion category counted+declared' : `RED — ${unaccounted > 0 ? `${unaccounted} generated artifacts silently outside the metric (accounted ${tool.accounted}/${total})` : 'an exclusion category is not counted+declared'}`}`);
R(`  (SEEDS the 7-vs-200: the drift report EMITS neither a task/req total nor a per-category missing/hand-authored count → a floor reads as the total. GREEN when the report emits 'checked N / excluded M (frozen/missing/hand-authored) / total N+M' over ALL ${total} artifacts.)`);
process.exit(green ? 0 : 1);
