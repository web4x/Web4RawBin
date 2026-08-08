/**
 * T36.3 — LOCAL (non-HTTP) generate-project trigger. Runs the SAME code path/invariants as the owner-gated HTTP handler
 * via the shared generateProjectModel (reuse, not reimplement). Safe because a root shell on the box already exceeds an
 * owner browser session — NO new network surface, and the HTTP owner-gate stays exactly as strict (no token/localhost-exempt).
 *
 * (d1) LEAF: no request-serving module imports this file (enforced by scripts/check-regen-leaf.ts in ci:gates).
 * (d2) ISOLATION: writes ONLY MODEL_STORE (data/model-store/index), NEVER prod scenario/index — inherited from generateProjectModel.
 * (d3) ARGV-GATED: main-module guard + an explicit --run flag, so importing this file never auto-executes.
 * (d4) AUDIT-LOG: who/when/dir appended to data/logs/regen-model-audit.log + echoed.
 * Run: /opt/node22/bin/node --import tsx scripts/regen-model.ts --run [--dir src/ts/scenario]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateProjectModel } from '../src/ts/server/generate-project.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODEL_STORE = path.join(ROOT, 'data/model-store/index'); // d2: the ISOLATED store (prod scenario/index untouched)
const PROD_INDEX = path.join(ROOT, 'scenario/index');

function main(): void {
  if (!process.argv.includes('--run')) { console.error('regen-model: refusing — pass --run to execute (argv-gated; import never auto-runs).'); process.exit(2); }
  const di = process.argv.indexOf('--dir');
  const relDir = di !== -1 && process.argv[di + 1] ? process.argv[di + 1] : 'src/ts/scenario';
  const who = (() => { try { return os.userInfo().username; } catch { return 'unknown'; } })();
  const stamp = new Date().toISOString();
  const audit = `${stamp}\t${who}\tregen-model --dir ${relDir}\n`;
  try { fs.mkdirSync(path.join(ROOT, 'data/logs'), { recursive: true }); fs.appendFileSync(path.join(ROOT, 'data/logs/regen-model-audit.log'), audit); } catch { /* audit best-effort */ }
  console.error(`[regen-model] ${audit.trim()} (MODEL_STORE only, prod scenario/index untouched)`);
  const g = generateProjectModel(ROOT, relDir, MODEL_STORE, PROD_INDEX);
  console.log(JSON.stringify(g));
  process.exit(g.ok ? 0 : 1);
}

// d3 main-module guard: execute ONLY when run directly as the entry script, NEVER on import.
if (process.argv[1] && /regen-model\.(ts|js|mjs)$/.test(process.argv[1])) main();
