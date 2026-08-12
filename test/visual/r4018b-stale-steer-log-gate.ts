// [test:uuid:7d4a1f83-2e69-4c05-b8a1-3f60d9c274eb] R40.18 BITE-6b — StaleSteerLog.logStaleSteerExpiry (Impl c0cfbbad) is the OBSERVABLE stale-steer emission: when an explicit currentTaskUuid steer's task reaches Done (R40.10 approve), a NAMED addLog states the drop-to-auto ('explicit current-task steer … expired … → auto-progress resumed') — never a silent drop, and LOG-ONLY (a pin write here would be the two-source hook R40.17 bans). The class is module-local (server.ts, not exported) and R40.18 is build-not-deploy, so this is a SYMBOL-ANCHORED SOURCE-AUDIT of the emission properties (reads git-show HEAD == committed, never the dirty working tree — my banked src-audit law). Distinct from 3f9c1e75 (the derivation gate) — this verifies the OBSERVER.
// Asserts: (1) LOG-ONLY — the fn body calls addLog and does NOT write the pin (no idx.put / no model mutation); (2) EVENT-DRIVEN-ONCE — exactly one call-site, at the approve-success transition (never derive-time, which would spam + fight idempotency); (3) NAMED reason text; STUB-MUST-FAIL — inject a pin write into the body → the log-only assertion goes RED. DET-3x (deterministic source read). node22: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r4018b-stale-steer-log-gate.ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const headSource = (rel: string): string => execFileSync('git', ['show', `HEAD:${rel}`], { cwd: ROOT, encoding: 'utf-8' });

// symbol-anchored: extract the logStaleSteerExpiry fn body (marker → first balanced-brace close), never a line pin
function fnBody(src: string): string {
  const at = src.indexOf('static logStaleSteerExpiry');
  if (at < 0) return '';
  let depth = 0, started = false, out = '';
  for (let i = src.indexOf('{', at); i < src.length; i++) {
    const c = src[i]; out += c;
    if (c === '{') { depth++; started = true; } else if (c === '}') { depth--; if (started && depth === 0) break; }
  }
  return out;
}
// the log-only invariant: addLog present, and NO pin write (idx.put / a .currentTaskUuid = / singleton write)
const logOnly = (body: string): boolean => /\baddLog\s*\(/.test(body) && !/\.put\s*\(|currentTaskUuid\s*=|writeFileSync|\.model\.[a-z]+\s*=/.test(body);

const results: Record<string, boolean> = {};
for (let r = 1; r <= 3; r++) {
  const src = headSource('src/ts/server/server.ts');
  const body = fnBody(src);

  // (1) LOG-ONLY
  results['1-log-only'] = body.length > 0 && logOnly(body);

  // (2) EVENT-DRIVEN-ONCE at the approve-success transition (not derive-time)
  const callSites = (src.match(/StaleSteerLog\.logStaleSteerExpiry\s*\(/g) || []).length;
  const approveGuarded = /verb === 'approve'[^\n]*logStaleSteerExpiry|logStaleSteerExpiry[^\n]*\/\/[^\n]*approve/.test(src)
    || /approve[\s\S]{0,120}logStaleSteerExpiry/.test(src);
  results['2-event-driven-once'] = callSites === 1 && approveGuarded;

  // (3) NAMED reason (states WHY, never a silent drop) + gated on completed==steer
  results['3-named-reason'] = /expired/.test(body) && /auto-progress resumed/.test(body) && /steer\b/.test(body) && /=== taskUuid|steer === /.test(body);

  // STUB-MUST-FAIL: a pin write injected into the body MUST flip log-only to RED (the assertion can fail)
  results['stub-must-fail'] = logOnly(body) === true && logOnly(body + "\nidx.put('x', {} as any); // PLANTED pin write") === false;
}

console.log('===== R40.18 BITE-6b stale-steer log source-audit (DET-3x) =====');
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
console.log('OVERALL:', green ? 'GREEN — logStaleSteerExpiry is LOG-ONLY, event-driven-once at approve, names the reason; stub-must-fail holds' : 'RED');
process.exitCode = green ? 0 : 1;
