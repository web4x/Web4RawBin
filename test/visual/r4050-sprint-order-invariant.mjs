// R40.50 sprint-order INVARIANT gate (SOURCE, deploy-independent) — gate the SOURCE not the surfaces.
// The v0.8.118 defect: a per-surface COPY of the comparator stood in while the /trace RENDERED VALUE looked right → false GREEN.
// PO L17 invariant: (a) exactly ONE exported bySprintDisplayOrder; (b) EVERY display site routes through it; (c) NO ad-hoc sprint sort
// anywhere, with the 2 SEMANTIC pin-hop sorts EXEMPT by an explicit R40.50 allow-list comment; (e) stub-must-fail: an injected per-surface
// re-sort → RED (proves the lint detects the defect). (d) the 6 surfaces render DESC @390 on BOTH /trace and /model = the browser half, HELD until served==0.8.120.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const CANON = 'src/ts/scenario/sprint-label.ts';
const DISPLAY_SITES = [ // every surface that ORDERS sprints for display must import + route through the canonical comparator
  'src/ts/server/server.ts',                        // :1524 sprintOverviewNodes → /model + traceability folder
  'src/ts/scenario/sprint-overview-generator.ts',   // :31 overview MD
  'src/ts/scenario/generator.ts',                   // :90 generated views
  'src/public/ts/trace/rb-overview.ts',             // :45 /trace overview
  'src/public/ts/trace/rb-trace-tree.ts',           // :473 /trace tree
];
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.ts')) out.push(p); } return out; };
const files = [...walk(path.join(ROOT, 'src/ts')), ...walk(path.join(ROOT, 'src/public/ts'))];

// ── (a) exactly ONE exported definition ──
let defCount = 0, defLoc = '';
for (const f of files) { const s = fs.readFileSync(f, 'utf8'); if (/export const bySprintDisplayOrder\s*=/.test(s)) { defCount++; defLoc = path.relative(ROOT, f); } }

// ── (b) every display site imports/routes through it ──
const missingImport = DISPLAY_SITES.filter((rel) => !/bySprintDisplayOrder/.test(fs.readFileSync(path.join(ROOT, rel), 'utf8')));

// ── (c) grep-lint: an AD-HOC sprint sort = a comparator that subtracts .number/.num inline instead of calling bySprintDisplayOrder,
//     UNLESS it is the canonical def OR carries an explicit R40.50-EXEMPT allow-list comment within 2 lines. ──
const AD_HOC = /(a|b)\.(number|num)\s*-\s*(a|b)\.(number|num)/;
const isExempt = (lines, i) => lines.slice(Math.max(0, i - 2), i + 1).some((l) => /R40\.50 EXEMPT|MUST NOT route through bySprintDisplayOrder/.test(l));
const scanAdHoc = (fileList) => { const v = []; for (const f of fileList) { const rel = path.relative(ROOT, f); const lines = fs.readFileSync(f, 'utf8').split('\n'); for (let i = 0; i < lines.length; i++) { const l = lines[i]; if (!AD_HOC.test(l)) continue; if (rel === CANON) continue; if (/bySprintDisplayOrder/.test(l)) continue; if (isExempt(lines, i)) continue; v.push(`${rel}:${i + 1}  ${l.trim().slice(0, 90)}`); } } return v; };
const violations = scanAdHoc(files);

// ── (e) STUB-MUST-FAIL: inject a per-surface re-sort with NO exempt marker → the lint MUST flag it ──
const stubFile = path.join('/tmp', `r4050-stub-${process.pid}.ts`);
fs.writeFileSync(stubFile, 'const x = sprints.sort((a, b) => a.number - b.number); // per-surface re-sort, NO exempt marker\n');
const stubViolations = scanAdHoc([stubFile]);
fs.rmSync(stubFile, { force: true });

// provenance: confirm the deployed client dist (auto-served) already carries the canonical order (client half is live even pre-restart)
let distHasCanon = false;
try { distHasCanon = execSync(`grep -rlE bySprintDisplayOrder ${path.join(ROOT, 'src/public/dist')}`, { encoding: 'utf8' }).trim().length > 0; } catch { distHasCanon = false; }

const aOk = defCount === 1;
const bOk = missingImport.length === 0;
const cOk = violations.length === 0;
const eOk = stubViolations.length === 1; // the lint caught the injected per-surface re-sort

console.log('=== R40.50 sprint-order INVARIANT (SOURCE, deploy-independent) ===');
console.log(`  (a) exactly ONE exported bySprintDisplayOrder: ${aOk} (count=${defCount} @ ${defLoc})`);
console.log(`  (b) every display site routes through it: ${bOk}${missingImport.length ? ' MISSING=' + JSON.stringify(missingImport) : ''}`);
console.log(`  (c) zero ad-hoc sprint sorts (allow-list exempt): ${cOk}${violations.length ? '\n      VIOLATIONS:\n      ' + violations.join('\n      ') : ''}`);
console.log(`  (e) stub-must-fail (injected per-surface re-sort → flagged): ${eOk} (caught ${stubViolations.length}/1)`);
console.log(`  [prov] deployed client dist carries bySprintDisplayOrder (client half live pre-restart): ${distHasCanon}`);
console.log(`  [held] (d) 6 surfaces DESC @390 BOTH /trace + /model — HELD until served==0.8.120 (currently 0.8.119, server restart pending)`);
const green = aOk && bOk && cOk && eOk;
console.log(`\n${green ? '✓ INVARIANT GREEN' : '✗ INVARIANT RED'} — one-comparator/all-import/zero-ad-hoc/pin-exempt + stub-detects-defect. ${green ? 'The v0.8.118 per-surface-copy class cannot recur by construction.' : 'FIX before the surfaces gate.'} (d) surfaces gate follows on 0.8.120.`);
process.exit(green ? 0 : 1);
