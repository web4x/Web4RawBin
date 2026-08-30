// R37.26 dead-guard PREVENTION (PO ruling, correct-by-construction) — bans the HAZARD SHAPE, not the actor.
// A hardcoded ABSOLUTE host filesystem path in a test/ or scripts/ file pins it to one machine + location. On a repo
// MOVE it silently breaks: readdirSync throws -> the guard goes INERT (the 22 visual gates), or the script crashes
// (strict-marker-audit). This lint bans ANY absolute host-path literal — NOT the specific stale string '2cuGitHub'
// (a ban on the old value would miss the NEXT stale path = the text-not-structure trap the PO called out). Fix = derive
// from the file location (fileURLToPath(import.meta.url)) OR process.cwd() OR an env var resolved once — never a 2nd hardcode.
// Register in ci:gates. Run: node scripts/check-no-hardcoded-repo-path.mjs  (exit 0 GREEN / 1 RED). Self-bites.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['test', 'scripts'];

// Absolute HOST mount roots that must never be hardcoded (machine-specific fs paths). Deliberately NOT matched:
// URL/API routes ('/api/ior', '/trace', '/md/...') — not host paths; and '/tmp/...' — portable scratch by convention.
// A string literal starting with one of these prefixes = pinned-to-a-machine = the hazard.
const HOST_ABS = /['"`](\/(?:Users|home|var|srv|opt|mnt|data|private|Volumes)\/[^'"`\n]*)['"`]/g;

export function findHardcodedPaths(src) {
  const out = [];
  let m;
  HOST_ABS.lastIndex = 0;
  while ((m = HOST_ABS.exec(src)) !== null) out.push(m[1]);
  return out;
}

// Blank COMMENT content (preserve newlines) so a documented example path inside a comment is not flagged — only live code.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (x) => x.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const isMain = process.argv[1] && /check-no-hardcoded-repo-path\.mjs$/.test(process.argv[1]);
if (isMain) {
  // SELF-BITE: MUST flag a planted absolute host path AND MUST pass a derived/relative path + api/tmp routes.
  const bites = findHardcodedPaths(`const R = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';`).length === 1
    && findHardcodedPaths(`const R = '/Users/Shared/x/Web4RawBin';`).length === 1;
  const passes = findHardcodedPaths(`const R = path.join(ROOT, 'scenario/index'); fetch('/api/ior'); f('/tmp/x.json'); nav('/md/a');`).length === 0;
  if (!bites || !passes) {
    console.error(`✗ check-no-hardcoded-repo-path SELF-BITE FAILED (flagsAbs=${bites}, passesDerived=${passes}) — the lint is INERT.`);
    process.exit(1);
  }
  const findings = [];
  const walk = (d) => {
    let ents;
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|js|mjs)$/.test(e.name)) {
        for (const h of findHardcodedPaths(stripComments(fs.readFileSync(p, 'utf-8')))) findings.push(`${path.relative(ROOT, p)}: ${h}`);
      }
    }
  };
  for (const d of DIRS) walk(path.join(ROOT, d));
  if (findings.length) {
    console.error(`✗ check-no-hardcoded-repo-path: ${findings.length} hardcoded absolute host path(s) under test/+scripts/ — each pins to one machine/location → breaks on move → INERT guard. Derive from fileURLToPath/process.cwd/env:`);
    for (const f of findings) console.error('  ✗ ' + f);
    process.exit(1);
  }
  console.log('✓ check-no-hardcoded-repo-path — 0 hardcoded absolute host paths under test/+scripts (self-bite: flags a planted abs path ✓, passes derived/relative + /api + /tmp + /md ✓).');
}
