// R37.11 slice-1 BINDING LINT — the ONE mutation seam. Asserts NO ScenarioIndex .put() (a unit persist) happens
// OUTSIDE UnitController.{apply,create} — because those are the only entries that ALSO emit UNIT_CHANGED, so a write
// that bypasses them goes stale (F8 omission-by-default: a write never BOUND to notify). The seam itself (unit-
// controller.ts) + the primitive it calls (index-store.ts) are exempt BY DEFINITION. Any other exemption is a DECLARED
// allow-list entry with a reason (pre-transport batch: bootstrap/migration/generator/self-heal that runs before the WS
// transport is live) — declared, never silently skipped; a too-generous list is how the lint stops binding (architect
// audits it). MODE: report-only until the ~15 current bypassers are routed, THEN --strict (RED on any un-allowed .put).
// Run: node --import tsx scripts/check-mutation-seam.ts [--strict]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT = process.argv.includes('--strict');
const SCAN_DIRS = ['src/ts', 'src/public/ts'];

// Exempt BY DEFINITION (the seam + the disk primitive it wraps):
const SEAM = new Set(['src/ts/scenario/unit-controller.ts', 'src/ts/scenario/index-store.ts']);
// DECLARED exceptions (reason required; architect-audited). Populate as routing proves a site is legitimately pre-seam.
const ALLOW: { file: string; reason: string }[] = [
  // e.g. { file: 'src/ts/scenario/some-migration.ts', reason: 'one-time migration, runs before the WS transport is live' }
];
const ALLOW_FILES = new Set(ALLOW.map((a) => a.file));

// A unit-persist call on a ScenarioIndex handle (idx/index/this.idx/this.index/this.put in an index-holder).
const PUT_RE = /\b(?:idx|index|this\.idx|this\.index|this)\.put\(/;

export function scanCode(src: string): string {
  // Blank comment CONTENT but PRESERVE newlines, so reported line numbers stay accurate (a collapsing replace shifted them).
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');
}

export interface SeamFinding { file: string; line: number; text: string; }
export function scanMutationSeam(root: string): SeamFinding[] {
  const findings: SeamFinding[] = [];
  const walk = (dir: string): void => {
    let entries: fs.Dirent[]; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(p); continue; }
      if (!/\.ts$/.test(e.name) || /\.(test|spec|d)\.ts$/.test(e.name)) continue;
      const rel = path.relative(root, p).split(path.sep).join('/');
      if (SEAM.has(rel) || ALLOW_FILES.has(rel)) continue;
      const lines = scanCode(fs.readFileSync(p, 'utf-8')).split('\n');
      lines.forEach((ln, i) => { if (PUT_RE.test(ln)) findings.push({ file: rel, line: i + 1, text: ln.trim().slice(0, 110) }); });
    }
  };
  for (const d of SCAN_DIRS) walk(path.join(root, d));
  return findings;
}

// SELF-BITE: the detector MUST flag a planted bypass write, and MUST ignore a comment mention (proves comment-strip).
const BITE_CODE = '    idx.put(uuid, unit); // a bypass write';
const BITE_COMMENT = '    // never call idx.put(uuid, unit) outside the seam';
const detects = PUT_RE.test(scanCode(BITE_CODE));
const ignoresComment = !PUT_RE.test(scanCode(BITE_COMMENT));

if (process.argv[1] && /check-mutation-seam\.(ts|js|mjs)$/.test(process.argv[1])) {
  if (!detects || !ignoresComment) {
    console.error(`✗ check-mutation-seam: SELF-BITE FAILED (detects=${detects}, ignoresComment=${ignoresComment}) — lint INERT. RED.`);
    process.exit(1);
  }
  const findings = scanMutationSeam(ROOT);
  if (findings.length === 0) {
    console.log(`✓ check-mutation-seam — 0 ScenarioIndex.put outside UnitController.{apply,create} (seam binds; self-BITE ✓).`);
    process.exit(0);
  }
  const header = `${STRICT ? '✗' : '⚠'} check-mutation-seam: ${findings.length} unit-persist(s) BYPASS the seam (must route via UnitController.apply/create, or DECLARE with a reason):`;
  (STRICT ? console.error : console.log)(header);
  for (const f of findings) (STRICT ? console.error : console.log)(`  ${f.file}:${f.line}  ${f.text}`);
  if (STRICT) process.exit(1);
  console.log(`  (report-only: ${findings.length} known bypassers pending slice-1 routing; flip to --strict once routed. self-BITE ✓)`);
}
