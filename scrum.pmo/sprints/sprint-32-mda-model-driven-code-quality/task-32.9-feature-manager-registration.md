<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.9: FeatureManager auto-discovers Features — MDA feature auto-appears + launchable @390, membership-gated (Tron device-QA REOPEN)

[task:uuid:fb995055-7fcb-4496-83e0-abffc64e31c2]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

RESOLVED (Done): FeatureManager auto-discovers Features (SEED_FEATURES dropped), MDA feature auto-appears+launchable @390. Chain-complete-to-Test c01354dff (Test 16c10d4d, both Impls co-credited), tester two-key CLEAN, Tron-confirmed IMG_4715 (owner-render). 1st device-QA miss CLOSED.

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.9 `[requirement:uuid:96e88399-e8a6-4ce8-b1e3-379edff0eb86]` (Tron device-QA)
  - down
    - None (atomic task)

## Task Description

Tron device-QA (2026-07-30): the MDA / Model-Driven Code Quality feature — built + gated across R32.1-8 — does NOT appear in the FeatureManager, so it is unreachable/unlaunchable. Root: FeatureManager.ts SEED_FEATURES=[ServerManager,FeatureManager] is a hardcoded list; MDA was never registered. TRON DIRECTIVE: registration must be DISCOVERED, not hardcoded — the FeatureManager DISCOVERS all ior:class:Feature units (drop SEED_FEATURES), a new feature auto-appears by EXISTING as a Feature unit (DRY / single-source, same as R31.7). Membership-gated per R31.8 (discovered != world-visible). This is the missed USER-FACING surface — 'functionally complete' was premature.

## Context

Scenario-first REOPEN (PO): req minted R32.9 96e88399 + 2 UCs (feature.discover reuse bootstrapSeed + feature.launch); architect designing the discover mechanism (drop SEED_FEATURES, featuresForToken-driven, bootstrapSeed enumerates discovered Features). T32.5 go-live visual is BLOCKED until the feature is reachable via this task.

## Intention

Feature-completion of the MDA sprint: make the built model machinery REACHABLE via the FeatureManager launcher. Gate where the AC specifies (the user launcher @390), not the model API.

## Acceptance Criteria

- [ ] **(functional)** INV-D1 - the FeatureManager DISCOVERS + lists ALL ior:class:Feature units via the EXISTING featuresForToken (server.ts:932, enumerate + per-user membership-filter; listFeatures():53 is the mgmt-view twin). The hardcoded SEED_FEATURES-as-list is DROPPED - what appears is driven by the Feature units on disk, not a code list (correct-by-construction / DRY single-source).
- [ ] **(security)** INV-D2 (the crux) - dropping SEED_FEATURES PRESERVES the R31.8 first-run owner-membership bootstrap: bootstrapSeed ENUMERATES every discovered ior:class:Feature unit and seedOwnerInto each one's allowedUsers at boot (NOT the 2 hardcoded features). So a NEW Feature is owner-reachable by construction - the hardcoded 2-feature seed list (the fragility that hid the MDA feature) is gone.
- [ ] **(functional)** Design-B + INV-D3 - creating the MDA 'Model-Driven Code Quality' ior:class:Feature unit (launchPage '/model', an icon, in PROD scenario/index) makes it AUTO-APPEAR and be LAUNCHABLE in the FeatureManager @390 with NO code/list edit - proving discovery + data-launch.
- [ ] **(functional)** INV-D3 - launch is DATA-DRIVEN via Feature.launchPage: featuresForToken + renderFeatureGrants use f.launchPage / f.icon, and the hardcoded launch name-ternary (renderFeatureGrants:~1020) is DROPPED. launchPage is backfilled onto the existing Features (ServerManager -> /server-manager, FeatureManager -> /feature-manager) so the ternary fully retires.
- [ ] **(security)** INV-D4 (fail-closed guard) - each discovered Feature is membership-gated by R31.8 allowedUsers: DISCOVERED != WORLD-VISIBLE. A non-member does NOT see the MDA feature (per-user featuresForToken filter) AND the gated /model route returns 403 for a non-member (requireFeatureAccess('Model-Driven Code Quality'), reusing R31.8) - only owner/members reach it.
- [ ] **(gate)** Acceptance is GATED at the FEATUREMANAGER SURFACE @390 (Tron viewport): the MDA feature APPEARS in the FeatureManager list AND LAUNCHES -> the gated /model route -> the R32.5 model view (drop -> tree/diagram/edges), reachable end-to-end - NOT gated at the model API (gate where the AC specifies, the user launcher). A device-QA regression here = a missing AC.

## Subtasks

None (atomic task).
