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

- [ ] AC-discover-all-features (INV-D1): FeatureManager DISCOVERS + lists ALL ior:class:Feature units via existing featuresForToken (per-user membership-filter); hardcoded SEED_FEATURES-as-list DROPPED — what appears is driven by Feature units on disk, not a code list.
- [ ] AC-owner-bootstrap-preserved (INV-D2, crux): dropping SEED_FEATURES PRESERVES the R31.8 first-run owner-membership bootstrap — bootstrapSeed ENUMERATES every discovered Feature unit and seedOwnerInto each allowedUsers at boot (not the 2 hardcoded). A NEW Feature is owner-reachable by construction.
- [ ] AC-mda-feature-unit-auto-appears (INV-D3): creating the MDA 'Model-Driven Code Quality' ior:class:Feature unit (launchPage '/model', icon, in PROD scenario/index) makes it AUTO-APPEAR + LAUNCHABLE @390 with NO code/list edit.
- [ ] AC-data-driven-launch: launch is DATA-DRIVEN via Feature.launchPage/icon; the hardcoded launch name-ternary (renderFeatureGrants) is DROPPED (launchPage backfilled onto ServerManager/FeatureManager so the ternary fully retires).
- [ ] AC-membership-gated-discovered (INV-D4, fail-closed): each discovered Feature membership-gated by R31.8 allowedUsers — DISCOVERED != WORLD-VISIBLE; non-member does NOT see MDA AND the gated /model route 403s (requireFeatureAccess).
- [ ] AC-gate-featuremanager-surface: GATED at the FEATUREMANAGER SURFACE @390 (Tron viewport) — MDA APPEARS + LAUNCHES → gated /model → the R32.5 model view (drop→tree/diagram/edges), end-to-end; NOT gated at the model API.

## Subtasks

None (atomic task).
