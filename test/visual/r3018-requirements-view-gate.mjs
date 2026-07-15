// [test:uuid:7fb32104-2ef5-4bb6-8a66-978c09f2a4b4] R30.18 SprintViewGenerator.generateRequirementsMd (Impl 72c57f72) — requirements.md is a GENERATED VIEW from the sprint's Requirement units (fixes Tron's 'where is R30.10-17'): (1) generateRequirementsMd wired into buildSprintOutput → GENERATED_HEADER present; (2) lists ALL requirements[] incl R30.10..R30.17 with [requirement:uuid:] + use-case refs; (3) generate-sprint-md --check byte-match GREEN (idempotent/deterministic round-trip).
// R30.18 (tooling, no version-bump). DET-3x on the --check round-trip. Read-only (--check compares, does not mutate).

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const NODE18 = '/root/.vscode-server/bin/903b1e9d8990623e3d7da1df3d33db3e42d80eda';
const S30 = '2173e549-ca99-43e5-aea8-946b02141c13'; // Sprint 30 FULL uuid (idx.get needs full, not the 8-char prefix)
const REQMD = path.join(REPO, 'scrum.pmo/sprints/sprint-30-traceability-improvement/requirements.md');
const GENERATED_HEADER = '<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->';
const runCheck = () => { try { const out = execSync(`npx tsx scripts/generate-sprint-md.ts --check ${S30}`, { cwd: REPO, encoding: 'utf8', timeout: 90000, env: { ...process.env, PATH: `${NODE18}:${process.env.PATH}` } }); return { ok: true, out }; } catch (e) { return { ok: false, out: (e.stdout || '') + (e.stderr || '') }; } };

// (A) DET-3x round-trip byte-match (idempotent: generated view == on-disk)
const checks = [];
for (let i = 1; i <= 3; i++) {
  const r = runCheck();
  const byteMatch = r.ok && /byte-match/i.test(r.out) && !/DRIFT|mismatch|missing:|extra:/i.test(r.out);
  checks.push(byteMatch);
  console.log(`check iter ${i}: exit-ok=${r.ok} byteMatch=${byteMatch} | ${(r.out.split('\n').filter(l => /Result|byte-match|mismatch/i.test(l))[0] || r.out.trim().split('\n').pop() || '').slice(0, 80)}`);
}
const checkGreen = checks.length === 3 && checks.every(Boolean);

// (B) generated-view structure + ALL requirements incl R30.10..R30.17
const md = fs.existsSync(REQMD) ? fs.readFileSync(REQMD, 'utf8') : '';
const isGeneratedView = md.startsWith(GENERATED_HEADER);
const hasTitle = /# Sprint 30 Requirements/.test(md) && /## Requirements/.test(md);
const missing = [];
for (let n = 10; n <= 17; n++) { if (!new RegExp(`R30\\.${n}\\b`).test(md)) missing.push(`R30.${n}`); }
const listsR1017 = missing.length === 0;
const hasReqUuids = (md.match(/\[requirement:uuid:[0-9a-f-]+\]/g) || []).length >= 8;   // one per requirement
const hasUcRefs = /-> .*\[uc:uuid:[0-9a-f-]+\]/.test(md);                                // use-case refs
const structGreen = isGeneratedView && hasTitle && listsR1017 && hasReqUuids && hasUcRefs;

console.log('\n===== R30.18 requirements.md generated-view (DET-3x) =====');
console.log(`  (A) --check byte-match idempotent DET-3x: ${checkGreen ? 'GREEN' : 'RED'}`);
console.log(`  (B) generated-view=${isGeneratedView} title=${hasTitle} lists-R30.10-17=${listsR1017}${missing.length ? ' (missing ' + missing.join(',') + ')' : ''} req-uuids=${hasReqUuids} uc-refs=${hasUcRefs} => ${structGreen ? 'GREEN' : 'RED'}`);
const green = checkGreen && structGreen;
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
