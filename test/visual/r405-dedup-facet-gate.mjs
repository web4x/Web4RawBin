// [test:uuid:8d1f4a70-2c6e-4b93-a5d1-9e0f3b7c6a24] R40.5 detail/feature-view EXTRA-button DE-DUPLICATION — R40.5's OWN dedup impl = scripts/check-detail-bespoke-actions.ts (the scoped grep-zero-bespoke lint), DISTINCT from the shared universalActionBar (ffd44b17) and NOT R34.7's Test (cbdb3210). Verifies: (A) lint PASSES on the current de-duplicated state + the editor-chrome exclusion is RECORDED (not silently dropped) + the inventory is SCOPED to rb-*detail*.ts only; (B) STUB-MUST-FAIL — plant a bespoke action duplicated into a 2nd detail view → lint FAILS (exit 1, names the dup); (C) editor chrome is OUT of scope — a duplicated button in the editor chrome does NOT trip the lint. Worktree-isolated (all plants happen in a throwaway git worktree; the shared tree is never touched). DET-3x.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const WT = path.join(REPO, '.gate-wt-r405');
const LINT = 'PATH=/opt/node22/bin:$PATH node --import tsx scripts/check-detail-bespoke-actions.ts';
const sh = (cmd, cwd) => { try { return { code: 0, out: execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { code: e.status || 1, out: (e.stdout || '') + (e.stderr || '') }; } };

sh(`git worktree remove --force "${WT}"`, REPO);
execSync(`git worktree add --force --detach "${WT}" HEAD`, { cwd: REPO });
execSync(`ln -sfn "${REPO}/node_modules" "${WT}/node_modules"`);
const run = () => sh(LINT, WT);

const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    sh('git checkout -- . ; git clean -fdq src/public/ts', WT); // pristine worktree each iter

    // (A) baseline PASS on the de-duplicated state + exclusion RECORDED + inventory scoped to rb-*detail*.ts
    const a = run();
    const passA = a.code === 0 && /R40\.5 PASS/.test(a.out) && /EXCLUDED editor chrome: rb-editor-toolbar\.ts, rb-editor-layout\.ts/.test(a.out) && /INVENTORY/.test(a.out);
    const invFiles = [...a.out.matchAll(/^ {2}(rb-\S+\.ts):/gm)].map((m) => m[1]);
    const scopeOK = invFiles.length > 0 && invFiles.every((f) => /^rb-.*detail.*\.ts$/.test(f));

    // (B) STUB-MUST-FAIL: plant a bespoke "reset" (already exists in rb-webitem-detail.ts) into a 2nd detail view → cross-view dup → RED
    const stub = path.join(WT, 'src/public/ts/trace/rb-stubdup-detail.ts');
    fs.writeFileSync(stub, `// planted bespoke duplicate (stub-must-fail)\nconst b = document.createElement('button');\nb.textContent = 'reset';\n`);
    const b = run();
    const failB = b.code === 1 && /R40\.5 FAIL/.test(b.out) && /reset/.test(b.out) && /rb-stubdup-detail\.ts/.test(b.out);
    fs.unlinkSync(stub);

    // (C) EDITOR-CHROME OUT OF SCOPE: a duplicated action button in the editor chrome must NOT trip the lint
    const chrome = path.join(WT, 'src/public/ts/components/rb-editor-toolbar.ts');
    const orig = fs.readFileSync(chrome, 'utf8');
    fs.writeFileSync(chrome, orig + `\n// planted chrome duplicate — must be IGNORED by the R40.5 dedup lint\nconst z = document.createElement('button');\nz.textContent = 'reset';\n`);
    const c = run();
    const passC = c.code === 0 && /R40\.5 PASS/.test(c.out);
    fs.writeFileSync(chrome, orig);

    const pass = passA && scopeOK && failB && passC;
    results.push(pass);
    console.log(`iter ${i}: (A)current-PASS+exclusion-recorded=${passA} scope-only-detail=${scopeOK}(${invFiles.length} files) | (B)stub-must-fail=${failB} | (C)editor-chrome-excluded=${passC} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { sh(`git worktree remove --force "${WT}"`, REPO); }

console.log('\n===== R40.5 detail-view dedup-facet gate (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
