// R37.12 (B) FAMILY LINT — detail views render idempotently. The live-MVC duplication (Tron @390 v0.8.121: drawer
// Parent×2 / Status×3) came from every *-detail render() doing a RAW insertAdjacentHTML in its async fetch tail → a live
// re-render (or a superseded tail landing after a newer render repainted the base) STACKED the sections. The fix: every
// detail section insert goes through upsertSection (assign-once per marker; detail-render.ts) or the upsertSourceLink/
// upsertParentLink wrappers built on it. This lint makes the wrong thing UNREACHABLE via CI: a raw insertAdjacentHTML in
// the trace UI dir (outside the ONE primitive that defines upsertSection) = RED. It is a CONTENT scan, not a component
// hand-list and not a second shape-matcher (so a 10th detail component cannot escape it, and it does NOT duplicate the
// AcGuard/structuralDiscover shape-matcher — there is no shape-matcher here to duplicate). Comments are stripped so a
// prose mention cannot false-RED. Registered in ci:gates:raw. Run: node --import tsx scripts/check-detail-idempotent-render.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIR = 'src/public/ts/trace'; // the detail-view UI surface
const PRIMITIVE = 'src/public/ts/trace/detail-render.ts'; // defines upsertSection — the ONE sanctioned insertAdjacentHTML
const RAW = /\.insertAdjacentHTML\s*\(/g; // a raw section append (the primitive that stacked the detail sections)

// strip /* */ + // comments so a prose mention of insertAdjacentHTML can't false-RED.
export function scanCode(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// R40.49 (PO): now that make-current STORES a currentTaskUuid designation (EXPLICIT-WINS), any user-facing string that
// still claims the pin has "no stored pin" / "follows the derivation" is a LIE. The tester cannot reproduce the banner in
// the DOM (owner-403 on /model in scratch), so we gate the lie at SOURCE where it is a static fact. Recursive scan of the
// client UI dir, comments stripped → only live string literals match.
const STALE_CLAIM = /no stored pin|follows the derivation/i;
const CLIENT_DIR = 'src/public/ts';

export interface Finding { file: string; line: number; text: string; rule: 'raw-insert' | 'stale-pin-claim'; }
export function scanDetailIdempotent(root: string): Finding[] {
  const findings: Finding[] = [];
  // (1) raw insertAdjacentHTML in the detail UI (flat scan of the detail surface)
  const dir = path.join(root, SCAN_DIR);
  let entries: fs.Dirent[]; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { entries = []; }
  for (const e of entries) {
    if (!e.isFile() || !/\.(ts|js)$/.test(e.name) || /\.(test|spec|d)\.ts$/.test(e.name)) continue;
    const rel = path.relative(root, path.join(dir, e.name)).split(path.sep).join('/');
    if (rel === PRIMITIVE) continue; // upsertSection itself IS the sanctioned insertAdjacentHTML
    const lines = scanCode(fs.readFileSync(path.join(dir, e.name), 'utf-8')).split('\n');
    lines.forEach((ln, i) => { RAW.lastIndex = 0; if (RAW.test(ln)) findings.push({ file: rel, line: i + 1, text: ln.trim().slice(0, 120), rule: 'raw-insert' }); });
  }
  // (2) stale "no stored pin" / "follows the derivation" claims anywhere in the client UI (recursive)
  const walk = (d: string): void => {
    let ents: fs.Dirent[]; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(p); continue; }
      if (!/\.(ts|js)$/.test(e.name) || /\.(test|spec|d)\.ts$/.test(e.name)) continue;
      const rel = path.relative(root, p).split(path.sep).join('/');
      scanCode(fs.readFileSync(p, 'utf-8')).split('\n').forEach((ln, i) => { if (STALE_CLAIM.test(ln)) findings.push({ file: rel, line: i + 1, text: ln.trim().slice(0, 120), rule: 'stale-pin-claim' }); });
    }
  };
  walk(path.join(root, CLIENT_DIR));
  return findings;
}

// SELF-BITE + STUB-MUST-FAIL: the detector MUST flag a planted raw insertAdjacentHTML and MUST NOT flag an upsertSection
// call. A gate that stays green with a raw section-append re-inserted is vacuous.
const BITE_RAW = "  head.insertAdjacentHTML('afterend', renderParentLink(parent));"; // must FLAG (raw-insert)
const BITE_OK = "  upsertSection(this, 'dv-parent', renderParentLink(parent), head, 'afterend');"; // must NOT flag
const BITE_CLAIM = "  surfaceVerdict(drawer, `Now current (the pin follows the derivation; no stored pin)`, 'ok');"; // must FLAG (stale-pin-claim)
const flagsRaw = (s: string): boolean => { RAW.lastIndex = 0; return RAW.test(scanCode(s)); };
const flagsClaim = (s: string): boolean => STALE_CLAIM.test(scanCode(s));
const detectsRaw = flagsRaw(BITE_RAW);
const ignoresOk = !flagsRaw(BITE_OK) && !flagsClaim(BITE_OK);
const detectsClaim = flagsClaim(BITE_CLAIM);

if (process.argv[1] && /check-detail-idempotent-render\.(ts|js|mjs)$/.test(process.argv[1])) {
  if (!detectsRaw || !detectsClaim || !ignoresOk) {
    console.error(`✗ check-detail-idempotent-render: SELF-BITE FAILED (detectsRaw=${detectsRaw}, detectsClaim=${detectsClaim}, ignoresOk=${ignoresOk}) — the lint is INERT. RED.`);
    process.exit(1);
  }
  const findings = scanDetailIdempotent(ROOT);
  if (findings.length) {
    const raw = findings.filter((f) => f.rule === 'raw-insert');
    const claim = findings.filter((f) => f.rule === 'stale-pin-claim');
    if (raw.length) console.error(`✗ check-detail-idempotent-render: ${raw.length} RAW insertAdjacentHTML in the detail UI (must route through upsertSection / upsertSourceLink / upsertParentLink — assign-once per section, no stacking on live re-render):`);
    for (const f of raw) console.error(`  ${f.file}:${f.line}  ${f.text}`);
    if (claim.length) console.error(`✗ check-detail-idempotent-render: ${claim.length} user-facing string still claims 'no stored pin' / 'follows the derivation' — a designation IS stored now (R40.49), so the claim is a LIE. Fix the string:`);
    for (const f of claim) console.error(`  ${f.file}:${f.line}  ${f.text}`);
    process.exit(1);
  }
  console.log(`✓ check-detail-idempotent-render — every detail section insert routes through upsertSection + no stale 'no stored pin' claim (self-BITE: flags a planted raw insertAdjacentHTML ✓ + planted stale claim ✓, ignores upsertSection ✓).`);
}
