/**
 * META-GATE (companion to check:gates-wired) — no gate may be BLIND to source. Enforce, do NOT document.
 *
 * STANDING RULE (PO, 2026-09-12, the SECOND gate blind to server.ts for the SAME reason in one hour):
 * NO GATE MAY USE PLAIN GREP ON SOURCE. server.ts carries a NUL byte, so plain `grep` treats it as binary and
 * SILENTLY SKIPS it — an empty grep means NOT-SEARCHED, not ABSENT. A gate that cannot see the biggest server file
 * reports clean forever; a stray reader added there escapes. Every source-scanning gate must use a NUL-safe search:
 * `grep -a` (binary-as-text) or `git grep` (NUL-immune). This gate lints the LINTS: any gate script whose grep
 * targets source without -a (and isn't `git grep`) = RED. A gate suite that can be silently un-wired (check:gates-wired)
 * OR silently blinded (this) is not a suite — the artifact existed but its WIRING and its REACH were unguaranteed.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gateFiles = [];
for (const d of ['scripts', 'test/visual']) {
  let entries = []; try { entries = readdirSync(path.join(ROOT, d)); } catch { continue; }
  for (const f of entries) if (/(check-|lint).*\.(mjs|ts|cjs)$/.test(f) || /-lint\.mjs$/.test(f)) gateFiles.push(path.join(d, f));
}

const offenders = [];
for (const rel of gateFiles) {
  if (rel.endsWith('check-gates-not-blind.mjs')) continue; // this file names 'grep' + 'src' in prose; it performs no source grep
  const txt = readFileSync(path.join(ROOT, rel), 'utf8');
  for (const line of txt.split('\n')) {
    // find a grep invocation with its flag cluster: `grep -rl` / `grep -rn` etc. (NOT `git grep`)
    const m = line.match(/(?<!git\s)\bgrep\s+(-[a-zA-Z]+)/);
    if (!m) continue;
    const flags = m[1];
    const scansSource = /\bsrc\b|\.ts\b|scenario\//.test(line);          // the grep targets source/tree
    const nulSafe = flags.includes('a');                                  // -a = binary-as-text (NUL-safe)
    if (scansSource && !nulSafe) offenders.push(`${rel}: ${line.trim().slice(0, 100)}`);
  }
}

const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
if (offenders.length) fail(`gate(s) use PLAIN grep on source (NUL-blind — server.ts silently skipped = false green). Use grep -a or git grep:\n  ${offenders.join('\n  ')}`);
console.log(`✓ META-GATE: scanned ${gateFiles.length} gate script(s) — none use NUL-blind plain grep on source (all -a / git grep).`);
