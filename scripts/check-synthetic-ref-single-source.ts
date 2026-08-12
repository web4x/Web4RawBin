// inc-3 FAMILY LINT — synthetic-ref parse single source. FAILS CI on any hand-rolled synthetic-prefix parse (the
// multi-prefix alternation `dir:|file:|puml-src:…` OR a `.startsWith('rawbin:')`-style ref sniff) ANYWHERE OUTSIDE
// src/public/ts/trace/synthetic-ref.ts — resolveRefUnit/SYNTHETIC_PREFIX is the ONE place a ref (real or synthetic)
// becomes a real unit. Two agreeing call sites is how nav & detail drifted (A3); a 4th consumer must not hand-roll a
// 4th parse. Comments are STRIPPED before matching (a prose mention of the regex must not false-RED). Registered in
// ci:gates:raw. Run: node --import tsx scripts/check-synthetic-ref-single-source.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOW = 'src/public/ts/trace/synthetic-ref.ts'; // the ONE synthetic-ref parser
const SCAN_DIRS = ['src/ts', 'src/public/ts'];

// The drift shapes (a SECOND synthetic-ref parse). NOT flagged: isSyntheticRef()/resolveRefUnit() CALLS (those import
// the one source), and refUuid() on a ref already proven non-synthetic.
const PATTERNS: { re: RegExp; why: string }[] = [
  { re: /dir:\|file:\|puml-src:/, why: 'inline synthetic-prefix regex alternation — import SYNTHETIC_PREFIX/isSyntheticRef from synthetic-ref.ts, never re-author the prefix set' },
  { re: /\/api\/ior\/ior:instance:\$\{\s*(?:ref|rawRef)\b/, why: 'hard-coded /api/ior/ior:instance:${rawRef} on a possibly-synthetic ref — route through resolveRefUnit (404s on a path-key = A3)' },
];

// strip /* block */ and // line comments (keep strings intact enough for these patterns) so a prose mention of the
// regex in a comment cannot false-RED the gate (the present-in-comment-absent-in-code trap, inverted).
export function scanCode(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

export interface Finding { file: string; line: number; text: string; why: string; }
export function scanSyntheticSingleSource(root: string): Finding[] {
  const findings: Finding[] = [];
  const walk = (dir: string): void => {
    let entries: fs.Dirent[]; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(p); continue; }
      if (!/\.(ts|js|mjs)$/.test(e.name) || /\.(test|spec|d)\.ts$/.test(e.name)) continue;
      const rel = path.relative(root, p).split(path.sep).join('/');
      if (rel === ALLOW) continue; // the single source is exempt
      const lines = scanCode(fs.readFileSync(p, 'utf-8')).split('\n');
      lines.forEach((ln, i) => { for (const { re, why } of PATTERNS) if (re.test(ln)) findings.push({ file: rel, line: i + 1, text: ln.trim().slice(0, 120), why }); });
    }
  };
  for (const d of SCAN_DIRS) walk(path.join(root, d));
  return findings;
}

// SELF-BITE (meta-assert): the detector MUST flag a planted inline synthetic parse — else the lint is INERT (present-in-
// file-absent-in-effect). A comment-only mention MUST be ignored (proves the comment-strip works).
const BITE_CODE = "  if (/^(dir:|file:|puml-src:|project:)/.test(rawRef)) doThing();";
const BITE_COMMENT = "  // matches dir:|file:|puml-src: prefixes — see synthetic-ref.ts";
const detects = PATTERNS.some((p) => p.re.test(scanCode(BITE_CODE)));
const ignoresComment = !PATTERNS.some((p) => p.re.test(scanCode(BITE_COMMENT)));

if (process.argv[1] && /check-synthetic-ref-single-source\.(ts|js|mjs)$/.test(process.argv[1])) {
  if (!detects || !ignoresComment) {
    console.error(`✗ check-synthetic-ref-single-source: SELF-BITE FAILED (detects=${detects}, ignoresComment=${ignoresComment}) — the lint is INERT. RED.`);
    process.exit(1);
  }
  const findings = scanSyntheticSingleSource(ROOT);
  if (findings.length) {
    console.error(`✗ check-synthetic-ref-single-source: ${findings.length} second-parse violation(s) — resolveRefUnit @ ${ALLOW} is the ONLY synthetic-ref parser:`);
    for (const f of findings) console.error(`  ${f.file}:${f.line}  ${f.text}  — ${f.why}`);
    process.exit(1);
  }
  console.log(`✓ check-synthetic-ref-single-source — 0 hand-rolled synthetic parses outside ${ALLOW} (self-BITE: detects a planted parse ✓, ignores a comment mention ✓).`);
}
