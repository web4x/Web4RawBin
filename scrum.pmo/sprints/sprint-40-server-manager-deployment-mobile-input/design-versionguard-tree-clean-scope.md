# versionGuardTreeClean — honest scope (architect, 2026-08-12)

**Type: CHECK-GATE** (CI/deploy assertion, not an auth-gate or QA-gate). PO-dispatched, time-sensitive (expert mid-deploy). Problem: a full tree-clean check can NEVER pass on a live prod server — the running server writes scenario units continuously (approve/decline verdicts, lazy mints, usage-index), so ~152 dirty is normal and a tree-clean guard would be perma-red → bypass-under-pressure (how we already lost a check-gate).

## Measured (build.mjs)
The deploy build consumes **only**: `src/public/ts/**` (esbuild entryPoints) + the **config-singleton unit's `version` field** (R31.7 → stamps package.json / `__BUILD_VERSION__` / build-manifest.json / sw.js CACHE_NAME+STATIC_SHELL) + `src/public/sw.js`. It does **NOT** read or embed general scenario units — those are served **live at runtime**. So the deploy build reads **exactly ONE unit** (config). "The build generates views from units" is imprecise for the served artifact: unit views render live at runtime, not at build.

## The honest scope: SOURCE-clean + config-unit-clean (NOT tree-clean)
This is a **strengthening** (checks exactly what makes served==committed true), not a loosening.

**MUST BE CLEAN** — the served==committed set (uncommitted here = corrupted/phantom-deploy class, e.g. the blank /model page):
- `src/**`  — ★ WHY (PO, durable so nobody later relaxes src/ts as "runtime-only"): prod RUNS `src/ts/server/server.ts` via tsx **directly from the working tree**, so dirty `src/ts` means prod EXECUTES uncommitted code — served!=committed in the most literal sense, the exact class that blanked /model. It is both a build input (esbuild bundles `src/public/ts`) AND the live server's own source.
- `build.mjs`
- `src/public/sw.js`  (CACHE_NAME/STATIC_SHELL rule-pair; build stamps it)
- `scenario/index/c/o/n/f/i/config-singleton-0000-000000000001.scenario.json`  (the ONE build-input unit = version single-source)

**MAY CHURN FREELY** — not build inputs; blocking on them certifies nothing:
- `scenario/index/**` EXCEPT the config unit  (runtime unit writes; served live regardless of commit state — self-heals on commit)
- `data/**`, `data/logs/**`, `test-results/**`, `scrum.pmo/**`
- `scripts/**`  — build.mjs imports only esbuild/fs/path, never scripts/; a dirty script is a check-gate-integrity concern, NOT a phantom-deploy one. Keep this guard tight to real build inputs.

## Rationale vs the PO's starting split
- (a) refined: SOURCE must be clean — YES, but SOURCE for the *served artifact* = `src/**` + `build.mjs` + `sw.js` + config unit. `scripts/**` is NOT consumed by build.mjs → not in scope.
- (b) confirmed: generated `.md` views are precommit-guaranteed (regen==committed-units by construction) AND are not served-app inputs → no separate tree check.
- (c) confirmed: runtime-written units churn freely — with the ONE exception of the config unit (the sole build-input unit).

## Implementation (no judgment calls)
`git status --porcelain -- src build.mjs src/public/sw.js scenario/index/c/o/n/f/i/config-singleton-0000-000000000001.scenario.json` → must be **EMPTY**, else FAIL (fail-closed). **Run BEFORE build.mjs runs** — the build write-backs package.json's version field from the config unit, so package.json is build OUTPUT, not a clean-input (that's why it's not in the set). Satisfiable on a live prod server by construction; certifies served==committed for everything the build actually consumes.
