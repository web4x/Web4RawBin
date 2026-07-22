# R31.7 DESIGN — single-source typed version + typed-config-scenario pattern (robbin-architect 2026-07-21)

Tron principle: "ONE single source for the version… scenarios are the ONLY configs… TYPED SCENARIOS." Correct-by-construction so the desync I chased (Tron phantom 7.99) becomes structurally impossible. MEASURED ground truth first (below), then design. Hand to req (formalize AC) → expert (implement generator + retire hand-copies + guard) → tester (mutate the one source → every consumer changes; hand-edit impossible/caught).

## MEASURED — current version topology (why it desynced)
- `package.json` `"version"` — the HAND-EDITABLE root source (this is what got reverted to 0.7.99).
- `build.mjs` (repo ROOT) ALREADY generates FROM `pkg.version` (build.mjs:17): stamps `sw.js` CACHE_NAME by regex-replace (`:68` `rawbin-v${pkg.version}`, fail-loud-if-malformed guard :65), writes `build-manifest.json` (`:51-58`, `built` timestamp + bundle hashes), and bakes `__BUILD_VERSION__` into bundles (`:29`). So sw.js/manifest are DERIVED-at-build, not independently hand-kept.
- `/api/config` (server.ts:1246) returns `getVersion()` which **LIVE-reads package.json per-request** (server.ts:47/55) — a DELIBERATE choice (comment :51: pick up a rebuild's version without a server restart). UI badge (server.ts:2085/2146) reads `/api/config`.
- `generate-sprint-md.ts` = the generator model: reads ScenarioIndex → emits a view with header `<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->`, OWNS only what it emits.

**Two divergence axes that bit us:** (1) `package.json.version` is hand-editable → a stray edit/checkout desyncs the root source; (2) `/api/config` LIVE-reads package.json while sw.js is BUILD-stamped → a source change without a rebuild makes served (live) ≠ SW (build-time). Both must be closed.

## DESIGN — the one typed version unit + generation + guard

### (1) THE SOURCE — one typed version scenario unit
`ior:class:Config` singleton (typed, schema'd), stored in `scenario/index` exactly like the existing `ior:class:CurrentSprint` singleton precedent. Fixed uuid (e.g. `config-singleton-0000-000000000001`).
```
{ "ior": "ior:class:Config",
  "model": { "uuid": "config-singleton-…001", "name": "RawBin Config",
             "version": "0.7.102",            // THE source of truth (typed string field, semver-validated)
             "branch": "rawbin" } }
```
Bumping the version = edit THIS field only. Typed = a schema (ConfigModel.interface) validates `version` on read/write (semver shape) — an accidental non-version value fails loudly, not silently served.

### (2) THE GENERATOR — build.mjs derives every copy from the unit (retire hand-maintenance)
build.mjs's FIRST step reads the unit (ScenarioIndex.get(config-singleton)) → `const version = config.model.version` — REPLACING `pkg.version` as the build's version input. Then it stamps, atomically in the one build step, ALL derivatives from that `version`:

| Derivative | File | Current | R31.7 |
|-----------|------|---------|-------|
| npm version | `package.json` `"version"` | hand-edited root source | **GENERATED** from the unit each build (write-back); add a repo note / the guard makes a hand-edit fail loudly. package.json becomes a DERIVATIVE, not the source. |
| SW cache | `src/public/sw.js` CACHE_NAME | regex-stamped from pkg.version (:68) | same stamp, but from `unit.version` (source swap only) |
| build-manifest | `dist/build-manifest.json` | from build | add `"version": <unit.version>` field |
| bundle const | `__BUILD_VERSION__` (:29) | from pkg.version | from `unit.version` |
| runtime | `/api/config` getVersion() | LIVE-reads package.json (:55) | **read `__BUILD_VERSION__`** (the build-stamped const) so served == sw.js == build BY CONSTRUCTION — closes axis-2 (live-vs-build). TRADEOFF: a version bump now needs a rebuild to change /api/config (it did anyway to re-stamp sw.js — a bump without a rebuild is exactly the desync we're killing). Flag to req: if the no-restart-pickup is required, keep the live-read but point it at the UNIT and let the guard enforce unit==sw — weaker but preserves current behavior. RECOMMEND build-stamped. |
| UI badge | `#ver` (:2085/2146) | reads /api/config | unchanged (derives transitively) |

Generator carries the `generate-sprint-md.ts` discipline: package.json/sw.js get a machine-owned marker; the generator OWNS only the version field it stamps (never clobbers unrelated package.json keys — surgical field write).

### (3) THE DIVERGENCE GUARD (fails loudly) — folds in the expert's start.mjs tree-clean guard
A guard run in start.mjs PRE-DEPLOY (before build/spawn) AND in CI:
- **INV-V1 (single-source agreement):** `unit.version == package.json.version == sw.js CACHE_NAME == build-manifest.version`. Any mismatch → refuse deploy, print the diverging pair.
- **INV-V2 (committed agreement):** the deployed `unit.version == committed HEAD unit.version` (served == committed).
- **INV-V3 (tree-clean landmine guard — expert's proposal):** `git diff --quiet HEAD -- src/ts/server/server.ts package.json src/public/sw.js` — a reverted/stray-checkout working tree fails loudly BEFORE it deploys (catches the exact 3-file landmine from the incident; a per-file checkout leaves no reflog so this is the only catch).
- INV-V1/V2 are structural (one source → generated copies agree by construction); INV-V3 catches the manual-mutation class. Tester gate: mutate ONLY the unit → rebuild → all consumers change; hand-edit package.json/sw.js → guard fails (or the next build overwrites it).

### (4) TYPED-CONFIG-SCENARIO PATTERN (version is first; others adopt)
`ior:class:Config` + `ConfigModel.interface` (typed fields) is the pattern: any scattered config (baseDomain/branch/ports/feature-flags — currently constants/env in server.ts) migrates to a typed field on the Config unit (or its own `ior:class:<Name>Config` singleton), READ at runtime, GENERATED into any file copy, GUARDED for agreement. "Scenarios are the only configs." Migrate as-practical after version proves the pattern (don't big-bang; version first, then the next-most-fragile config).

## Root-cause tie-in (expert-confirmed)
Expert's tree-vs-HEAD diff = clean, R31 wiring 5/5; by-elimination NO script does git-checkout/stash/restore → the 0.7.99 revert was a MANUAL per-file `git checkout 86c4033fb -- <3 files>` to inspect the old version during my deploy-finding investigation, left unrestored (per-file checkout = no reflog = untraceable). **Team lesson (into the AC):** inspect an old version with `git show <ref>:<file>` (read-only), NEVER `git checkout <ref> -- <file>` (mutates the tree = the landmine). INV-V3 is the by-construction backstop for when the lesson is forgotten.

## Route / handoff
Design-only (architect). req formalizes R31.7 ACs scenario-first (the ConfigModel schema + generation + INV-V1/2/3 + the pattern) → expert implements: create the `ior:class:Config` unit, swap build.mjs's version input from pkg.version → unit, add the version field to build-manifest + /api/config source swap, add the start.mjs pre-deploy guard (INV-V1/2/3), retire package.json/sw.js as hand-sources (mark generated) → tester gates the mutate-one-source-all-change + hand-edit-caught. Expert's standalone "start.mjs tree-clean guard" = INV-V3 here — build it AS PART of R31.7 (not ad-hoc) so it composes with the single-source generation. I backstop the generator + guard + a real restart when it ships.

## ARCHITECT BACKSTOP — R31.7 v0.7.103 / 4a4f69985 (robbin-architect 2026-07-22): **PASS**
Real restart (Ctrl-C→npm start, sole driver): fresh server.ts pid 498575 (etimes 28s). start.mjs INV-V3 (scoped tree-clean) + build-from-unit + INV-V1 (derive-equal) all passed (a failure `process.exit(1)`s and blocks boot — successful boot = guards green).
- **STATIC:** source = `ior:class:Config` singleton (scenario/index/c/o/n/f/i/config-singleton…001); `build.mjs generateVersion()` reads the unit (:24, marker [impl:b5eb6953] on decl) → stamps package.json/sw.js/manifest/__BUILD_VERSION__; `server.ts getVersion()` (:55-59) reads build-manifest.json (per-request package.json demoted to fallback const); start.mjs INV-V1 (:97) + INV-V3 (:66) both `process.exit(1)` on divergence.
- **LIVE derive-equal (all 6 == 0.7.103):** Config unit == package.json == sw.js CACHE_NAME == build-manifest == /api/config served == committed HEAD. INV-V1 satisfied by construction.
- **ANTI-CONFOUND PROVEN (the incident root, closed by construction):** injected decoy `package.json version=0.7.999` WITHOUT a rebuild → `/api/config` STILL served **0.7.103** (the manifest build-stamp), IGNORING the decoy → `getVersion` reads the build-stamp, NOT per-request package.json. A stray package.json edit can no longer make served lie = the phantom-7.99 is structurally impossible. package.json restored.
- INV-G untouched (/server-manager no-token 403), /trace 200. 
- **Tester owns the mutate-one-source gate** (change ONLY the Config unit → rebuild → every consumer changes + hand-edit caught) — my backstop proved the all-agree state + the reads-manifest anti-confound + guards-block-on-divergence. R31.7 = live + correct-by-construction.
