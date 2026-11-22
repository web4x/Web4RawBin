#!/usr/bin/env node
// R42.4 two green suites: run a test suite and prove the run left the git tree clean.
// Usage: node scripts/ci-suites.mjs unit|e2e [--warn-dirty] [-- extra args]
//   unit → npm test ; e2e → npm run test:e2e
// Exit code: the suite's exit code; or 1 when the suite passed but changed tracked/untracked files
// (unless --warn-dirty, which only prints them — used for e2e until the server writes scenario/ into its data dir).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const SUITES = {
  unit: ['npm', ['test']],
  e2e: ['npm', ['run', 'test:e2e']],
};

/** Lines of `git status --porcelain` (untracked files included). */
export function gitStatus(cwd = process.cwd()) {
  const r = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd, encoding: 'utf8' });
  return r.stdout.split('\n').filter(Boolean);
}

// [impl:uuid:1ec6afd4-8e5e-4a69-8e73-ce445c934053] CiWorkflow.runSuites — run one suite, then diff git status before/after
export function runSuites(suite, { run = defaultRun, status = gitStatus, extraArgs = [] } = {}) {
  const spec = SUITES[suite];
  if (!spec) throw new Error(`unknown suite '${suite}' (expected: ${Object.keys(SUITES).join(', ')})`);
  const before = new Set(status());
  const code = run(spec[0], extraArgs.length ? [...spec[1], '--', ...extraArgs] : spec[1]);
  const dirtied = status().filter((l) => !before.has(l));
  return { suite, code, dirtied, ok: code === 0 && dirtied.length === 0 };
}

function defaultRun(cmd, args) {
  return spawnSync(cmd, args, { stdio: 'inherit' }).status ?? 1;
}

function main(argv) {
  const sep = argv.indexOf('--');
  const own = sep >= 0 ? argv.slice(0, sep) : argv;
  const extraArgs = sep >= 0 ? argv.slice(sep + 1) : [];
  const suite = own.find((a) => !a.startsWith('--'));
  const warnDirty = own.includes('--warn-dirty');
  const r = runSuites(suite, { extraArgs });
  if (r.dirtied.length) {
    console.error(`[ci-suites] the ${suite} run changed ${r.dirtied.length} file(s) in the repo:`);
    for (const l of r.dirtied.slice(0, 50)) console.error('  ' + l);
  }
  if (r.code !== 0) return r.code;
  if (r.dirtied.length && !warnDirty) return 1;
  console.log(`[ci-suites] ${suite}: green${r.dirtied.length ? ' (dirty tree tolerated: --warn-dirty)' : ', tree clean'}`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(main(process.argv.slice(2)));
