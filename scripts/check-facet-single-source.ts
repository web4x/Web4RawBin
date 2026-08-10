// R40.23 FAMILY LINT — facet-type single source. FAILS CI on any hardcoded viewKind literal assignment OR a 'class'
// (or any literal) default on a facet key, ANYWHERE OUTSIDE src/ts/shared/facet-type.ts (deriveViewKind is the ONE
// source of a facet type). renderFacet's ROUTING comparisons (k === 'UmlUseCase') and the CLASS_FACETS known-set are
// NOT assignments/defaults → not flagged. Registered in ci:gates:raw. Run: node --import tsx scripts/check-facet-single-source.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOW = 'src/ts/shared/facet-type.ts'; // the ONE source — the only place a facet-type literal is authored
const SCAN_DIRS = ['src/ts', 'src/public/ts'];

// The R40.23 defect shapes (assignments/defaults, NOT === comparisons or Set membership):
const PATTERNS: { re: RegExp; why: string }[] = [
  { re: /viewKind\s*:\s*['"]/, why: "hardcoded viewKind literal assignment — derive via deriveViewKind, never assign a literal" },
  { re: /viewKind\s*\|\|\s*['"]/, why: "'viewKind || <literal>' default — route through deriveViewKind, no literal fallback" },
  { re: /viewKind.*\|\|\s*['"]class['"]/, why: "silent 'class' default on a viewKind/facetKind line — use || null so facetKind reaches the unknown branch (scoped to facet lines by the viewKind mention; MOF/other .kind defaults are out of scope)" },
];

export interface FacetLintFinding { file: string; line: number; text: string; why: string; }
export function scanFacetSingleSource(root: string): FacetLintFinding[] {
  const findings: FacetLintFinding[] = [];
  const walk = (dir: string): void => {
    let entries: fs.Dirent[]; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(p); continue; }
      if (!/\.(ts|js|mjs)$/.test(e.name) || /\.(test|spec|d)\.ts$/.test(e.name)) continue;
      const rel = path.relative(root, p).split(path.sep).join('/');
      if (rel === ALLOW) continue; // the single source is exempt
      const lines = fs.readFileSync(p, 'utf-8').split('\n');
      lines.forEach((ln, i) => { for (const { re, why } of PATTERNS) if (re.test(ln)) findings.push({ file: rel, line: i + 1, text: ln.trim().slice(0, 120), why }); });
    }
  };
  for (const d of SCAN_DIRS) walk(path.join(root, d));
  return findings;
}

// SELF-BITE (bite ii, meta-assert): the detector MUST flag a planted hardcoded viewKind. Proven IN-PROCESS so that if
// anyone weakens/removes the patterns the gate goes RED here rather than silently passing (the present-in-file-absent
// -in-effect class we caught with check:task-status). A companion tester BITE plants a real fixture (bite i) + asserts
// this gate is wired in ci:gates:raw.
const BITE_SAMPLE = "  const v = { unit, x, y, viewKind: 'class' };";
const detectorDiscriminates = PATTERNS.some((p) => p.re.test(BITE_SAMPLE));

if (process.argv[1] && /check-facet-single-source\.(ts|js|mjs)$/.test(process.argv[1])) {
  if (!detectorDiscriminates) { console.error("✗ check-facet-single-source: SELF-BITE FAILED — the detector no longer flags a planted viewKind:'class'. The lint is INERT. RED."); process.exit(1); }
  const findings = scanFacetSingleSource(ROOT);
  if (findings.length) {
    console.error(`✗ check-facet-single-source: ${findings.length} facet-type single-source violation(s) — deriveViewKind @ ${ALLOW} is the ONLY facet-type source:`);
    for (const f of findings) console.error(`  ${f.file}:${f.line}  ${f.text}  — ${f.why}`);
    process.exit(1);
  }
  console.log(`✓ check-facet-single-source — 0 hardcoded viewKind / literal facet-default outside ${ALLOW} (self-BITE: detector flags a planted literal ✓).`);
}
