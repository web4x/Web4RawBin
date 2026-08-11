// [test:uuid:8d1c4f60-2e97-4b53-9a6f-0c7e2b1d5a84] R-C2 SprintViewGenerator.generateAll (Impl b31ae393, Method eddf2836,
// UC bf1cf902 sprintBoard.reconcileAll) — the reconcile-all WRITE path. Exercises generateAll (--all WRITE) then verifies
// byte-match via --check --all, on the IN-SCOPE owned-output set ONLY. Deliberately NOT two-keyed to generateSprint 41c86206
// (the --check checker) — this gate drives the WRITE (b31ae393), the T24.4 cross-credit did not.
// R40.30 doctrine applied: FAMILY = reconcile-all-write; stub-must-fail (corrupt a written file → --check MUST go RED);
// behavioural hook = the tool's own ✓/✗ byte-match report (not a cosmetic selector); NO hardcoded 37 — the in-scope count is
// READ from the tool, the out-of-scope (header-less legacy req.md/planning.md, R-C7 scope) count is DECLARED honestly, never
// asserted as pass; a missing/errored tool fails LOUD (never a silent empty pass). Pollution-safe: runs in an ISOLATED git
// worktree (live tree NEVER touched); worktree removed in finally.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const WT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/rc2-wt';
const sh = (cmd, cwd) => { try { return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { return (e.stdout || '') + '\n' + (e.stderr || ''); } };
const run = (args) => sh(`npx tsx scripts/generate-sprint-md.ts ${args}`, WT);
const matchCount = (s, re) => { let n = 0, m; const r = new RegExp(re, 'g'); while ((m = r.exec(s))) n++; return n; };

// isolate
sh(`git worktree remove --force "${WT}"`, REPO);
execSync(`git worktree add --force --detach "${WT}" HEAD`, { cwd: REPO });
execSync(`ln -sfn "${REPO}/node_modules" "${WT}/node_modules"`);

let verdict = { ok: false };
try {
  const HEAD = sh('git rev-parse --short HEAD', WT).trim();
  const VER = (sh('git show HEAD:package.json', WT).match(/"version":\s*"([^"]+)"/) || [])[1] || 'UNKNOWN';

  // (A) baseline check (read-only) — is the on-disk already reconciled?
  const baseline = run('--check --all');
  const baseMatch = matchCount(baseline, '✓ \\S+ — byte-match');
  const baseDrift = matchCount(baseline, '✗ \\S+ — DRIFT');

  // (B) THE WRITE: generateAll (b31ae393) regenerates every sprint board MD in one pass
  const write = run('--all');
  const wroteEmpty = !/✓ \d+ files/.test(write) && !/SKIP/.test(write);
  const outOfScopeDeclared = matchCount(write, '⚠ SKIP');           // header-less legacy preserved = R-C7 scope, DECLARED not asserted

  // (C) post-write check: classify EACH drift FILE by GENERATED_HEADER — owned (in-scope, must match) vs header-less legacy
  // (out-of-scope, R-C7). The reconcile-all WRITE only owns header-carrying files; it correctly cannot converge legacy ones.
  const HEADER = '<!-- GENERATED FROM SCENARIO UNITS';
  const check = run('--check --all');
  const loudRan = /byte-match|DRIFT/.test(check);                    // LOUD: the tool actually produced a report (not empty)
  const inScopeFail = [], outOfScope = [];
  let curSlug = null;
  for (const line of check.split('\n')) {
    const dm = line.match(/✗ (\S+) — DRIFT/); if (dm) { curSlug = dm[1]; continue; }
    const mm = line.match(/^\s+(mismatched|missing|extra):\s+(\S+)/);
    if (mm && curSlug) {
      const kind = mm[1], f = mm[2], fp = path.join(WT, 'scrum.pmo/sprints', curSlug, f);
      let owned = false; try { owned = fs.readFileSync(fp, 'utf8').startsWith(HEADER); } catch { owned = false; }
      // IN-SCOPE R-C2 = a file the reconcile WRITES that doesn't byte-match (mismatched-owned) or is missing. 'extra'
      // (a header file the generator NO LONGER produces = a pre-gen-migration orphan) is out-of-scope (R-C7).
      const inScopeR = (kind === 'mismatched' && owned) || kind === 'missing';
      (inScopeR ? inScopeFail : outOfScope).push(`${curSlug}/${f}(${kind})`);
    }
  }
  const inScopeMatch = matchCount(check, '✓ \\S+ — byte-match');     // sprints fully byte-matched
  const allInScopeMatch = loudRan && inScopeFail.length === 0;       // ZERO owned/in-scope files drift after the write

  // (D) STUB-MUST-FAIL: corrupt ONE just-written generated file → --check MUST report DRIFT (proves the write-faithfulness gate can fail)
  let stubProven = false, corruptedFile = '';
  const sprintsDir = path.join(WT, 'scrum.pmo/sprints');
  const matchedSlugs = [...check.matchAll(/✓ (\S+) — byte-match/g)].map((m) => m[1]); // a fully byte-matched sprint = its owned files ARE actively produced+match → corrupting one MUST be caught
  outer: for (const slug of matchedSlugs) {
    const dp = path.join(sprintsDir, slug); if (!fs.existsSync(dp)) continue;
    for (const f of fs.readdirSync(dp)) {
      if (!f.endsWith('.md')) continue;
      const fp = path.join(dp, f);
      if (fs.readFileSync(fp, 'utf8').startsWith(HEADER)) {
        fs.appendFileSync(fp, '\nCORRUPT-BYTE-STUB-MUST-FAIL\n'); corruptedFile = `${slug}/${f}`; break outer;
      }
    }
  }
  const cfBase = corruptedFile ? corruptedFile.split('/')[1].replace(/[.]/g, '\\.') : '';
  const stubCheck = corruptedFile ? run('--check --all') : '';
  stubProven = !!corruptedFile && new RegExp(`mismatched:\\s+${cfBase}`).test(stubCheck); // the corrupted OWNED file is caught as an in-scope mismatch → gate CAN fail

  const pass = !wroteEmpty && allInScopeMatch && stubProven;
  verdict = { ok: pass, HEAD, VER, inScopeFail, outOfScope, stubProven };
  console.log(`R-C2 reconcile-all WRITE gate @ ${VER} (HEAD ${HEAD}), isolated worktree:`);
  console.log(`  baseline --check --all:   ${baseMatch} sprints byte-match / ${baseDrift} drift (pre-write)`);
  console.log(`  (B) generateAll --all WRITE (b31ae393): wrote-nonempty=${!wroteEmpty}; ${outOfScopeDeclared} header-less legacy files DECLARED out-of-scope (R-C7 scope, correctly skipped — NOT asserted)`);
  console.log(`  (C) IN-SCOPE (owned/header) files drifting after write: ${inScopeFail.length} ${inScopeFail.length ? '→ ' + inScopeFail.slice(0, 6).join(', ') : '(all owned files byte-match ✓)'}`);
  console.log(`      out-of-scope (header-less legacy, R-C7) drift files: ${outOfScope.length} (declared, not asserted); ${inScopeMatch} sprints fully byte-matched`);
  console.log(`  (D) STUB-MUST-FAIL: corrupted owned ${corruptedFile || '(none!)'} → caught as in-scope mismatch => ${stubProven ? 'PROVEN — gate can fail' : 'NOT-PROVEN'}`);
  console.log(`OVERALL: ${pass ? 'GREEN — reconcile-all WRITE byte-stable on the in-scope owned set + stub-must-fail proven' : 'RED'}`);
} finally {
  sh(`git worktree remove --force "${WT}"`, REPO);
  // pollution-safe proof: the gate's writes + stub-corruption happened ONLY in the (now-removed) worktree; the live tree
  // must NOT contain the corruption marker (raw git-status false-alarms on OTHER agents' pre-existing shared-tree dirt).
  const leaked = sh("grep -rl CORRUPT-BYTE-STUB-MUST-FAIL scrum.pmo/sprints", REPO).trim();
  console.log(`pollution-safe (no gate write leaked to live tree): ${leaked ? 'NO — LEAKED: ' + leaked : 'YES (worktree isolation held)'}`);
}
process.exitCode = verdict.ok ? 0 : 1;
