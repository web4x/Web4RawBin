// (5b) detectStatusWrites — SINGLE-WRITER lint for Task status. FAILS CI on ANY direct literal `.status = '<...>'`
// assignment (the mutation that re-introduces the bug Tron hit: a decline/advance writing status DIRECTLY instead of
// editing the checklist so deriveStatusEnum derives it). deriveStatusEnum is THE sole 4-state writer; the sanctioned
// form is `m.status = deriveStatusEnum(...)` (a CALL, no quote → not matched) and object-literal creates use `:` (not
// matched). Comments are STRIPPED before matching (a prose mention must not false-RED). #2/#4 change status and would
// re-open the hole without this guard landing FIRST. Registered in ci:gates:raw. Run: node --import tsx scripts/check-status-writes.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['src/ts', 'src/public/ts'];
// The direct-literal status ASSIGNMENT (= '<literal>'). NOT `= deriveStatusEnum(...)` (the sanctioned derive) and NOT
// object-literal `status: '<...>'` creates (colon, not =).
const PATTERN = /\.status\s*=\s*['"]/;
// Known-legit existing writes, allow-listed with a measured reason (strict for everything NEW):
const ALLOW: { file: string; reason: string }[] = [
  { file: 'src/ts/scenario/task-fsm.ts', reason: 'LEGACY flat-7-state task-fsm, RETIRED as a runtime write target (c4-mvc design) — superseded by TaskPolicy/deriveStatusEnum; not a live single-writer path (pending removal)' },
  { file: 'src/ts/server/TraceConsistency.ts', reason: 'UseCase reset (uc.status=""), NOT a Task status — the single-writer rule governs TASK status; different unit type' },
];

export function scanCode(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1'); // strip /* */ + // comments
}

export interface Finding { file: string; line: number; text: string; }
export function scanStatusWrites(root: string): Finding[] {
  const findings: Finding[] = [];
  const allowFiles = new Set(ALLOW.map((a) => a.file));
  const walk = (dir: string): void => {
    let entries: fs.Dirent[]; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(p); continue; }
      if (!/\.ts$/.test(e.name) || /\.(test|spec|d)\.ts$/.test(e.name)) continue;
      const rel = path.relative(root, p).split(path.sep).join('/');
      if (allowFiles.has(rel)) continue; // legacy/non-task allow-listed
      const lines = scanCode(fs.readFileSync(p, 'utf-8')).split('\n');
      lines.forEach((ln, i) => { if (PATTERN.test(ln)) findings.push({ file: rel, line: i + 1, text: ln.trim().slice(0, 120) }); });
    }
  };
  for (const d of SCAN_DIRS) walk(path.join(root, d));
  return findings;
}

// SELF-BITE / stub-must-fail: the detector MUST flag a planted direct status write, and MUST ignore a comment mention
// (proves the comment-strip). A lint that cannot fail proves nothing (standing rule).
const BITE_CODE = "  m.status = 'Done';";
const BITE_COMMENT = "  // never do m.status = 'Done' — derive it";
const detects = PATTERN.test(scanCode(BITE_CODE));
const ignoresComment = !PATTERN.test(scanCode(BITE_COMMENT));

if (process.argv[1] && /check-status-writes\.(ts|js|mjs)$/.test(process.argv[1])) {
  if (!detects || !ignoresComment) {
    console.error(`✗ check-status-writes: SELF-BITE FAILED (detects=${detects}, ignoresComment=${ignoresComment}) — the lint is INERT. RED.`);
    process.exit(1);
  }
  const findings = scanStatusWrites(ROOT);
  if (findings.length) {
    console.error(`✗ check-status-writes: ${findings.length} direct literal status write(s) — status must be DERIVED (deriveStatusEnum), never assigned a literal (edit the checklist via the seam):`);
    for (const f of findings) console.error(`  ${f.file}:${f.line}  ${f.text}`);
    process.exit(1);
  }
  console.log(`✓ check-status-writes — 0 direct literal status writes outside the ${ALLOW.length} allow-listed legacy/non-task files (self-BITE: detects a planted write ✓, ignores a comment ✓).`);
}
