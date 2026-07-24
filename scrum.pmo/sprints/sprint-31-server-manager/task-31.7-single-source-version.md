<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.7: DRY single-source app version via ONE typed Config scenario unit — all consumers generated/derived, never hand-copied

[task:uuid:5372ab26-8779-44d8-844b-6b556f338b3f]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

DONE->In-Progress CORRECTION (PO+planner measured a real board-vs-units gap, same class as /edit-swap). SINGLE-SOURCE-VERSION CORE (7 ACs) BUILT+TESTED (v0.7.103: test GREEN 7/7 adf69f5a2 + BACKSTOP 8bdcea019 all-6-consumers-derive-equal) but the unit ACs were unflipped (status=None board-vs-units lag; req reconciling). ⚠ INV-V4 (AC-INV-V4-served-equals-booted) UNBUILT — VERIFIED ARTIFACT: getVersion() server.ts:57-62 reads build-manifest.json per-request (fsSync.readFileSync every call, fallback PKG_VERSION), NOT a BOOT-STAMPED const. INV-V4 needs getVersion to return a boot-stamped const (read once at boot) = a real PENDING BUILD. So T31.7-Done was dishonest. NON-BLOCKING for the Tron device batch. NEXT: expert boot-stamps getVersion -> tester gates INV-V4 -> req flips INV-V4 met -> planner flips T31.7. req reconciling the 7 core AC statuses to met.

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.7 `[requirement:uuid:15aab895-a792-45a1-b9b5-923fd6f728a0]`
  - down
    - None (atomic task)

## Task Description

TYPED single-source-of-truth for the app version, correct-by-construction (Tron 2026-07-21 principle + architect design 23c7873da APPROVED). ROOT the incident exposed: the version was SCATTERED across >=4 hand-maintained locations that desynced (package.json version stray-edited to 0.7.99, sw.js CACHE_NAME 0.7.102, build-manifest, /api/config per-request package.json read) -> phantom update-available/downgrade + broken PWA. Scattered = fragile by construction. FIX: the version lives in ONE typed scenario unit (ior:class:Config, schema-typed version field) = THE source; build.mjs ATOMICALLY GENERATES every consumer (package.json version, sw.js CACHE_NAME, build-manifest, a bundle-const __BUILD_VERSION__) from it (never hand-copied, like requirements.md is a generated view); /api/config + any version display READ the build-stamped __BUILD_VERSION__ (NOT a per-request package.json read — that per-request read is EXACTLY what let a stray file edit make served LIE = Tron phantom; reading the build-stamp = served equals what was actually BUILT+deployed, by construction). Accepted tradeoff (PO): version changes only via build/deploy, never a hand-edit (no-restart-pickup is CORRECT). A guard (INV-V1/V2/V3) asserts unit==pkg==sw==manifest==HEAD AND working-tree-clean, failing LOUDLY on divergence — this roots the served==committed==SW==unit phantom-guard in ONE source and hardens the landmine (verifies working-tree==HEAD, not just the version string). Generalizes: configs = typed scenario units (schema-validated, the ONE config mechanism, data-on-disk-is-truth), version FIRST, extend as practical. SUPERSEDES the earlier R31.7 deploy-runbook framing (single-source-by-construction > runbook discipline; the PID/tree-clean insight is folded into INV-V3). Route: architect designed (23c7873da) -> req formalizes (this) -> expert implements the generator + retires the hand-maintained copies -> tester gates: mutate the ONE source -> every consumer changes; hand-editing any copy is impossible or caught.

## Acceptance Criteria

- [x] **[AC-typed-version-source]**: The app version lives in ONE typed scenario unit (ior:class:Config, schema-typed version field) = THE single source of truth. No other location holds an authored version; every other occurrence is derived.
- [x] **[AC-build-generates]**: build.mjs ATOMICALLY GENERATES all version consumers from the typed Config unit — package.json version, sw.js CACHE_NAME, build-manifest, and a bundle-const __BUILD_VERSION__ — as a generator step (never hand-edited, like requirements.md is a generated view). They cannot desync because there is one source.
- [x] **[AC-apiconfig-buildstamp]**: /api/config and any version display READ the build-stamped __BUILD_VERSION__, NOT a per-request package.json read. Served == what was actually BUILT+deployed by construction (the per-request package.json read was EXACTLY what let a stray file edit make served lie = Tron phantom). Accepted tradeoff: version changes via build/deploy only, never a hand-edit.
- [x] **[INV-V1]**: INV-V1 (derive-equal): unit == package.json version == sw.js CACHE_NAME == build-manifest == __BUILD_VERSION__ — all consumers derive-equal from the one typed Config unit. A guard/CI fails LOUDLY on any inequality.
- [x] **[INV-V2]**: INV-V2 (served==committed): the generated consumers == HEAD (committed) — no drift between what is built/served and what is committed. Guard fails loudly on divergence.
- [x] **[INV-V3]**: INV-V3 (tree-clean, SCOPED, landmine hardening): git diff --quiet HEAD -- src/ts/server/server.ts package.json src/public/sw.js (+ optionally the Config unit + build-manifest) — the DEPLOY-CRITICAL generator input+outputs must equal HEAD; a reverted/stray-checkout of any of these fails LOUDLY BEFORE deploy (catches the exact 3-file landmine from the incident: server.ts strip + package.json revert + sw.js revert; a per-file checkout leaves no reflog so this guard is the only catch). SCOPED to the generator input+outputs, NOT the whole working tree — this shared multi-agent repo ALWAYS carries unrelated uncommitted churn (scenario units, merge-visual PNGs, data/logs, dirty since session start); a whole-tree-clean guard would false-positive on EVERY deploy -> get ignored/disabled -> defeated. Team lesson folded: inspect an old version with git show <ref>:<file> (read-only), NEVER git checkout <ref> -- <file> (mutates the tree = the landmine).
- [x] **[AC-typed-config-pattern]**: Configs generally are TYPED SCENARIO UNITS (schema-validated, the ONE config mechanism, consistent with data-on-disk-is-truth) — no scattered hardcoded constants / .env sprawl / ad-hoc JSON / hand-maintained copies. Version is the FIRST; extend to other configs as far as practical.
- [ ] **[AC-INV-V4-served-equals-booted]** (UNBUILT — getVersion server.ts:57 reads manifest per-request, NOT boot-stamped const): INV-V4 (served==booted): getVersion() returns a BOOT-STAMPED const — at module load, const BOOT_VERSION = (read build-manifest.json ONCE) ?? PKG_VERSION; getVersion() returns BOOT_VERSION (frozen at boot). So /api/config version == the version the RUNNING PROCESS booted with; a rebuild-WITHOUT-restart leaves /api/config UNCHANGED (honest — shows what is actually running), and only a REAL restart re-reads. Closes the last version-lie axis: /api/config becomes a valid deploy signal again (no longer needs the PID/uptime workaround). sw.js CACHE_NAME stays a static build-updated file (correct for PWA client cache-bust) — this fix is only the server self-reported version. Thin impl-edit on getVersion (server.ts:55-59), NO new node; expert builds + a real restart.

## Implementation

Config unit -> Build.generateVersion (Method dee42cc1, impl 4a4f69985 v0.7.103); test 317b67d0 GREEN 7/7 (adf69f5a2, MUTATE-ONE-SOURCE + INV-V guards); architect BACKSTOP PASS v0.7.103 (8bdcea019 — all 6 consumers derive-equal, anti-confound proven decoy pkg=0.7.999 ignored). Chain-complete-to-Test, version-desync class designed out.

## Subtasks

None (atomic task).
