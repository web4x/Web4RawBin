// [test:uuid:f2c48a91-6d3e-4b57-a90c-1e8d5f3b74a2] T37.24 / R37.11 slice-1 AC-2 — the mutation-seam BINDING LINT bite (Impl e3729f51). Independently verifies scripts/check-mutation-seam.ts: NO ScenarioIndex.put outside UnitController.{apply,create}. Family: MVC / single-writer / omission-by-default.
// Measured DIFFERENTLY than the lint's own self-bite: I import the REAL scanMutationSeam/scanCode and drive them against POLLUTION-SAFE scratch fixtures (plant a bypass → detected; comment mention → ignored = AST/comment-strip not raw grep; seam-routed → clean), PLUS run the live `check:mutation-seam --strict` and assert 0 un-allowed on the shipped code. Pure-fn tsx, NO served artifact → no SW/served-guard (stated per rule scope). node22: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r3724-mutation-seam-bite.ts
// NOTE: this is the STRUCTURAL bypass-lint. The R40.18 LIVE-path VALUE gate (write-through-seam emits → view updates live, publish PASSED) is separate — pends the full seam+backfill+view ship.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scanMutationSeam, scanCode } from '../../scripts/check-mutation-seam.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'r3724-'));
const results: Record<string, boolean> = {};

try {
  // ── A. LIVE-CLEAN (the actual gate): shipped code has 0 UN-ALLOWED bypassers ──
  let liveClean = false;
  try { execSync('npm run check:mutation-seam', { cwd: REPO, stdio: 'pipe' }); liveClean = true; } catch { liveClean = false; }
  results['live: 0 un-allowed on shipped code (--strict exit 0)'] = liveClean;

  // plant fixtures under scratch/src/ts (scanMutationSeam walks SCAN_DIRS = src/ts + src/public/ts)
  const dir = path.join(scratch, 'src', 'ts'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'bypass.ts'), 'export function bad(idx: any, uuid: string, unit: any) {\n  idx.put(uuid, unit); // planted BYPASS write — must be flagged\n}\n');
  fs.writeFileSync(path.join(dir, 'commented.ts'), 'export function ok() {\n  // never call idx.put(uuid, unit) outside the seam\n  /* idx.put(uuid, unit) in a block comment too */\n  return 1;\n}\n');
  fs.writeFileSync(path.join(dir, 'seam-routed.ts'), 'import { UnitController } from "x";\nexport function good(idx: any, ior: string, uuid: string) {\n  UnitController.apply(idx, ior, uuid, {}); // routed via the seam — NO direct put\n}\n');
  const found = scanMutationSeam(scratch);
  const forFile = (f: string) => found.filter((x) => x.file.endsWith(f)).length;

  // ── B. DETECTOR BITES: a planted idx.put OUTSIDE the seam is flagged (stub-must-fail — proves non-vacuous) ──
  results['bite: planted bypass DETECTED'] = forFile('bypass.ts') >= 1;
  // ── C. COMMENT-STRIP (AST/comment-match doctrine, NOT a raw grep): a .put mention in a comment is IGNORED ──
  results['comment-strip: commented .put IGNORED'] = forFile('commented.ts') === 0;
  // ── D. SEAM-ROUTED → CLEAN: a write via UnitController.apply (no direct .put) is NOT flagged ──
  results['seam-routed: UnitController.apply CLEAN'] = forFile('seam-routed.ts') === 0;

  // ── E. STUB-MUST-FAIL on the CHECK itself (independently verify scanCode's comment-strip is real) ──
  const detectsReal = /\.put\(/.test(scanCode('  idx.put(uuid, unit);'));            // real code survives strip
  const ignoresLine = !/\.put\(/.test(scanCode('  // idx.put(uuid, unit) commented')); // line-comment stripped
  const ignoresBlock = !/\.put\(/.test(scanCode('  /* idx.put(uuid, unit) */ 1;'));    // block-comment stripped
  results['check-self: scanCode detects real, strips comments'] = detectsReal && ignoresLine && ignoresBlock;
} finally {
  fs.rmSync(scratch, { recursive: true, force: true }); // pollution-free
}

console.log('===== T37.24 AC-2 mutation-seam binding-lint bite (DET) =====');
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
const need = ['live: 0 un-allowed on shipped code (--strict exit 0)', 'bite: planted bypass DETECTED', 'comment-strip: commented .put IGNORED', 'seam-routed: UnitController.apply CLEAN', 'check-self: scanCode detects real, strips comments'];
if (need.some((k) => !(k in results))) { green = false; console.log('  INCOMPLETE'); }
console.log('OVERALL:', green ? 'GREEN — seam binds: 0 un-allowed live, planted bypass caught, comments ignored (not grep), seam-routed clean, check self-bites' : 'RED');
process.exitCode = green ? 0 : 1;
