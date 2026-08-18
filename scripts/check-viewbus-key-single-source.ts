// R40.45 (architect 98ac90205) FAMILY LINT — ViewBus key single-source. Every ViewBus.subscribe / ViewBus.notify with a
// DYNAMIC ref MUST route through the ONE viewBusKey builder, so notify and subscribe CANNOT define the key differently
// (the drift that made live-MVC inert: notify `type:uuid` ≠ subscribe rawRef → controls/badge/detail never re-rendered).
// A raw/dynamic ref not wrapped in viewBusKey → RED. FIXED CHANNEL LITERALS (no drift — identical string both sides) are
// allowlisted. Comments are STRIPPED first (a prose mention must not false-RED). Registered in ci:gates:raw. Run:
// node --import tsx scripts/check-viewbus-key-single-source.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOW_FILE = 'src/public/ts/trace/ViewBus.ts'; // defines viewBusKey — exempt
const SCAN_DIRS = ['src/ts', 'src/public/ts'];
// FIXED channel keys — bare, identical on both sides, no type:uuid drift surface (allowlisted as a first arg).
const FIXED = ["'graph'", "'current-sprint-singleton-0000-000000000001'"];

// strip /* */ + // comments so a prose mention of ViewBus.subscribe/notify can't false-RED.
export function scanCode(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}
// A call is COMPLIANT iff its first arg begins with viewBusKey( OR is a fixed-channel literal.
const CALL = /ViewBus\.(?:subscribe|notify)\(\s*([^\n]*?)(?:,|\))/g;
function isCompliant(firstArg: string): boolean {
  const a = firstArg.trim();
  return a.startsWith('viewBusKey(') || FIXED.some((f) => a.startsWith(f));
}

export interface Finding { file: string; line: number; text: string; }
export function scanViewBusKeySingleSource(root: string): Finding[] {
  const findings: Finding[] = [];
  const walk = (dir: string): void => {
    let entries: fs.Dirent[]; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(p); continue; }
      if (!/\.(ts|js|mjs)$/.test(e.name) || /\.(test|spec|d)\.ts$/.test(e.name)) continue;
      const rel = path.relative(root, p).split(path.sep).join('/');
      if (rel === ALLOW_FILE) continue;
      const lines = scanCode(fs.readFileSync(p, 'utf-8')).split('\n');
      lines.forEach((ln, i) => {
        let m: RegExpExecArray | null; CALL.lastIndex = 0;
        while ((m = CALL.exec(ln)) !== null) if (!isCompliant(m[1])) findings.push({ file: rel, line: i + 1, text: ln.trim().slice(0, 120) });
      });
    }
  };
  for (const d of SCAN_DIRS) walk(path.join(root, d));
  return findings;
}

// SELF-BITE + STUB-MUST-FAIL: the detector MUST flag a planted RAW-ref subscribe (the exact drift defect), and MUST NOT
// flag a viewBusKey-wrapped call or a fixed-channel literal. A gate that stays green with the raw-ref re-inserted is vacuous.
const BITE_RAW = "  this.unsub = ViewBus.subscribe(ref, () => this.render());";        // must FLAG
const BITE_OK = "  this.unsub = ViewBus.subscribe(viewBusKey(ref), () => this.render());"; // must NOT flag
const BITE_FIXED = "  ViewBus.notify('graph');";                                          // must NOT flag
const grab = (s: string): string => { CALL.lastIndex = 0; const m = CALL.exec(scanCode(s)); return m ? m[1] : ''; };
const detectsRaw = !isCompliant(grab(BITE_RAW));
const ignoresOk = isCompliant(grab(BITE_OK)) && isCompliant(grab(BITE_FIXED));

if (process.argv[1] && /check-viewbus-key-single-source\.(ts|js|mjs)$/.test(process.argv[1])) {
  if (!detectsRaw || !ignoresOk) {
    console.error(`✗ check-viewbus-key-single-source: SELF-BITE FAILED (detectsRaw=${detectsRaw}, ignoresOk=${ignoresOk}) — the lint is INERT. RED.`);
    process.exit(1);
  }
  const findings = scanViewBusKeySingleSource(ROOT);
  if (findings.length) {
    console.error(`✗ check-viewbus-key-single-source: ${findings.length} ViewBus call(s) with a raw/dynamic ref NOT through viewBusKey (notify+subscribe must share the ONE key builder):`);
    for (const f of findings) console.error(`  ${f.file}:${f.line}  ${f.text}`);
    process.exit(1);
  }
  console.log(`✓ check-viewbus-key-single-source — every dynamic-ref ViewBus.subscribe/notify routes through viewBusKey (fixed channels allowlisted; self-BITE: flags a planted raw-ref ✓, ignores viewBusKey+literal ✓).`);
}
