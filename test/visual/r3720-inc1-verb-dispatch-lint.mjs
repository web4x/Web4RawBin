// T37.20 INC-1 (v0.8.208) — FAILABLE lint: the universal-actions invoke path must be
// registry-driven (actionRegistry.get(verb)?.run(ctx)) with ZERO verb-dispatch conditionals.
// A 7th action/3rd affordance = a registerAction() call, NOT an edit to a central switch (OCP).
//
// GREEN scope (INC-1's claim): src/public/ts/trace/universal-actions.ts invoke path.
// ALSO reports the fleet-wide OCP residual (other verb-dispatch chains) HONESTLY — not folded
// into the INC-1 verdict, but surfaced as the next OCP debt.
//
// FAILABLE: a seeded `if (verb === 'x')` in a scratch copy MUST flip this RED (proven below).

import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const INVOKE = 'src/public/ts/trace/universal-actions.ts';

// Strip comments so prose mentioning "if(verb===)" (lines 15/45) is not counted — code only.
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')      // block comments
    .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n'); // line + trailing // comments
}
// A verb-dispatch conditional = branching on the verb value (the anti-pattern INC-1 removes).
const VERB_DISPATCH = /\bverb\s*===|\bverb\s*==[^=]|switch\s*\(\s*verb\b/g;
const countDispatch = (src) => (codeOnly(src).match(VERB_DISPATCH) || []).length;

function run() {
  const invokeSrc = readFileSync(join(REPO, INVOKE), 'utf8');
  const invokeDispatch = countDispatch(invokeSrc);
  const hasRegistry = /actionRegistry\.get\(\s*verb\s*\)/.test(codeOnly(invokeSrc));
  const inc1Green = invokeDispatch === 0 && hasRegistry;

  // FAILABLE self-proof: inject one violation into a scratch copy → must count > 0.
  const dir = mkdtempSync(join(tmpdir(), 'inc1lint-'));
  const poisoned = invokeSrc.replace(
    'const cmd = actionRegistry.get(verb);',
    "if (verb === '__seeded_violation__') return;\n    const cmd = actionRegistry.get(verb);"
  );
  writeFileSync(join(dir, 'poison.ts'), poisoned);
  const poisonedDispatch = countDispatch(readFileSync(join(dir, 'poison.ts'), 'utf8'));
  const failable = poisonedDispatch > invokeDispatch; // the lint DID catch the seeded switch

  return { invokeDispatch, hasRegistry, inc1Green, poisonedDispatch, failable };
}

// DET-3x
let prev = null, allGreen = true;
for (let i = 1; i <= 3; i++) {
  const r = run();
  const det = !prev || (prev.invokeDispatch === r.invokeDispatch && prev.failable === r.failable);
  prev = r;
  const pass = r.inc1Green && r.failable && det;
  allGreen = allGreen && pass;
  console.log(`run ${i}: invoke verb-dispatch=${r.invokeDispatch} registryInvoke=${r.hasRegistry} FAILABLE(seeded ${r.invokeDispatch}->${r.poisonedDispatch})=${r.failable} det=${det} => ${pass ? 'GREEN' : 'RED'}`);
}

// Fleet-wide OCP residual — reported, NOT part of the INC-1 verdict.
console.log('\n=== FLEET-WIDE OCP RESIDUAL (informational — other verb-dispatch surfaces) ===');
for (const f of ['src/public/ts/model/model.ts', 'src/public/ts/trace/rb-detail-drawer.ts']) {
  try { console.log(`  ${f}: ${countDispatch(readFileSync(join(REPO, f), 'utf8'))} verb-dispatch conditional(s)`); }
  catch { console.log(`  ${f}: (unreadable)`); }
}

console.log('\n=== INC-1 VERDICT (universal-actions invoke path, DET-3x) ===');
console.log(allGreen ? 'GREEN DET-3x — registry-driven, 0 verb-dispatch, FAILABLE-proven' : 'RED');
process.exit(allGreen ? 0 : 1);
