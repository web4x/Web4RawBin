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
// DECLARED exceptions (reason REQUIRED; architect-audited). PER-SITE (file + a `match` substring of the put line) so a
// SPLIT file can route one put and exempt another — the *-Index profile-side put is ROUTED while the index-unit-side put
// is exempt. Burden of proof on the exception: each carries a MEASURED reason. Tripwire (a) = empty reason → RED.
const ALLOW: { file: string; match: string; reason: string }[] = [
  // ── *-Index SPLIT: the index-unit-side entity put is exempt; the PROFILE-side put is routed via the seam. MEASURED: no trace/public view subscribes to any *-Index entity unit (grep EMPTY).
  { file: 'src/ts/scenario/AddressIndex.ts', match: 'put(addrUuid', reason: 'index-unit-side Address entity — MEASURED no view subscribes; profile-side put routed via the seam' },
  { file: 'src/ts/scenario/CompanyIndex.ts', match: 'put(companyUuid', reason: 'index-unit-side Company entity — MEASURED no view subscribes; profile-side linkToProfile routed via the seam' },
  { file: 'src/ts/scenario/EmailIndex.ts', match: 'put(emailUuid', reason: 'index-unit-side Email entity — MEASURED no view subscribes; profile-side put routed via the seam' },
  { file: 'src/ts/scenario/PhoneIndex.ts', match: 'put(phoneUuid', reason: 'index-unit-side Phone entity — MEASURED no view subscribes; profile-side put routed via the seam' },
  // ── Mint/generator — MEASURED CLI/generate-only (imported by scripts/ not a server request handler). Tripwire (b) re-audits if a server handler imports them.
  { file: 'src/ts/scenario/class-mint.ts', match: 'idx.put(', reason: 'mint/generator — MEASURED CLI/generate-only (imported by scripts/ not a server handler)' },
  { file: 'src/ts/scenario/classes.ts', match: 'put(RAWBIN_SYSTEM_UUID', reason: 'RawBin-system-user bootstrap seed — CLI/generate-only, pre-transport (FileLoader is the server-imported export, not this seed)' },
  { file: 'src/ts/scenario/skill-classes.ts', match: 'this.idx.put(', reason: 'skill mint/generator — MEASURED CLI-only (imported by scripts/ not a server handler)' },
  { file: 'src/ts/scenario/skills.ts', match: 'idx.put(', reason: 'skill mint/generator — MEASURED CLI-only (imported by scripts/ not a server handler)' },
  // ── agent-message — MEASURED no view subscribes + no runtime send-caller (only classes.ts loader + test fixtures). :77 Task messages[] data-merge defers to T37.4.3.
  { file: 'src/ts/scenario/agent-message.ts', match: 'this.idx.put(', reason: 'no view subscribes + no runtime send-caller (measured: 0 send-callers); Task messages[] data-merge defers to T37.4.3' },
  // ── CurrentSprint — DEFERRED-TO-ENDPOINT: an in-process CLI emit reaches 0 WS clients; planner-drive + skill route via the ONE narrow server endpoint (architect ruling). The RUNTIME pin handler in server.ts IS routed.
  { file: 'src/ts/scenario/CurrentSprint.ts', match: 'this.index.put(', reason: 'DEFERRED-TO-ENDPOINT — in-process CLI emit reaches 0 WS clients; planner-drive + skill route via the narrow server endpoint (architect ruling); runtime pin handler routed' },
  // ── approveByOwner + declineToChangeRequest — write model.status LITERALLY + Task DATA; DEFER-T37.4.3 (deriveStatusEnum sole status writer; Done stays Tron's act).
  { file: 'src/ts/server/server.ts', match: 'idx.put(taskUuid, unit)', reason: 'approve/decline write model.status + Task data — DEFER-T37.4.3 (behavior migration; deriveStatusEnum sole status writer, Done stays Tron)' },
];
const isAllowed = (f: SeamFinding): boolean => ALLOW.some((a) => a.file === f.file && f.text.includes(a.match));

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
      if (SEAM.has(rel)) continue; // ALLOW is now PER-SITE (isAllowed), filtered after the scan — a split file is scanned, not whole-file skipped
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
  // TRIPWIRE (a): an exempt entry with NO declared reason (or match) → RED. A reason-less allow-list stops binding.
  const reasonless = ALLOW.filter((a) => !a.reason.trim() || !a.match.trim());
  if (reasonless.length) {
    console.error(`✗ check-mutation-seam: ${reasonless.length} ALLOW entr(y/ies) with NO reason/match — every exemption needs a MEASURED reason (tripwire a). RED.`);
    for (const a of reasonless) console.error(`  ${a.file} (match='${a.match}')`);
    process.exit(1);
  }
  // TRIPWIRE (b): a CLI-only-declared mint/skill module IMPORTED by the server → re-audit (a runtime handler may now
  // reach it → its writes would need routing). Report-only re-audit flag (self-draining), not RED.
  const CLI_ONLY = ['class-mint.ts', 'skill-classes.ts', 'skills.ts', 'agent-message.ts'];
  try {
    const serverSrc = fs.readFileSync(path.join(ROOT, 'src/ts/server/server.ts'), 'utf-8');
    const reimported = CLI_ONLY.filter((m) => new RegExp(`from '[^']*/${m.replace('.ts', '.js')}'`).test(serverSrc));
    if (reimported.length) console.log(`  ⚠ tripwire(b) re-audit: server.ts imports CLI-only-declared module(s) [${reimported.join(', ')}] — confirm no runtime handler reaches their put()s.`);
  } catch { /* server.ts absent → skip */ }

  const all = scanMutationSeam(ROOT);
  const findings = all.filter((f) => !isAllowed(f)); // UN-ALLOWED bypassers only
  const exemptCount = all.length - findings.length;
  if (findings.length === 0) {
    console.log(`✓ check-mutation-seam — 0 UN-ALLOWED ScenarioIndex.put outside UnitController.{apply,create} (${exemptCount} declared exemptions, each with a measured reason; seam binds; self-BITE ✓).`);
    process.exit(0);
  }
  const header = `${STRICT ? '✗' : '⚠'} check-mutation-seam: ${findings.length} UN-ALLOWED unit-persist(s) BYPASS the seam (route via UnitController.apply/create, or DECLARE with a reason) [${exemptCount} already declared]:`;
  (STRICT ? console.error : console.log)(header);
  for (const f of findings) (STRICT ? console.error : console.log)(`  ${f.file}:${f.line}  ${f.text}`);
  if (STRICT) process.exit(1);
  console.log(`  (report-only: ${findings.length} un-allowed pending routing; flip to --strict once 0. self-BITE ✓)`);
}
