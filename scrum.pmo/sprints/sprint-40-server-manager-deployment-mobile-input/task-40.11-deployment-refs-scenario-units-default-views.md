<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.11: deploymentRefs are scenario-first units with default views (fix the permanent-Loading detail drawer)

[task:uuid:6e3cc1b2-abf6-4468-a6c3-a7e54471e39c]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.11 (deploymentRefs -> scenario-first units w/ default views; fixes permanent-Loading drawer). Scenario-first: req minted R40.11 83528e2f (30730eb0a); coveredRequirements + useCases 249fdab6 wired; ACs MIRRORED w/ tags (3 AUTOMATABLE + 2 device @390). ★ RECONCILE at architect design: R40.6 (34d297d91) typed ssh-service as ConfigFile; R40.11 says ssh-service->Service — architect re-types. Reuse R40.6 M2 0022-0033. Depends on R40.6 typed model (landed). No build until build-go.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.11 `[requirement:uuid:83528e2f-60d3-4d62-acf3-2e3b4068fce5]`
  - down
    - None (atomic task)

## Task Description

R40.11 (Tron: 'all deploymentRefs are still buggy on the details view as long as they are not scenario-first units with default views'). The tree hands the drawer a SYNTHETIC pseudo-ref (depref:<name>) that is not a real unit ior -> permanent 'Loading...' + no children (Tron: selected ssh-host-identity under WODA.prod, drawer hung forever). ROOT: R40.6 typed the M1 nodes but kept deploymentRefs as a raw STRING ARRAY read-view (34d297d91). FIX: every deploymentRef becomes a REAL scenario-first unit of its R40.6 type with a DEFAULT VIEW; the tree emits the REAL ior; unresolvable refs FAIL LOUD (never silent Loading). ★ RECONCILE (architect at design): R40.6 typed ssh-service as ConfigFile but PO/Tron mapping = ssh-service -> Service (Deployable, NOT file-backed); re-type / add Service+configuredBy->ConfigFile / supersede. REUSE R40.6 M2 types 0022-0033, NO new machinery. Scenario-first: req mints R40.11 + ACs; architect designs + reconciles; expert implements; tester gates.

## Acceptance Criteria

- [ ] [AUTOMATABLE, graph] EVERY deploymentRef is a REAL minted scenario unit of the right R40.6 type (ssh-service->Service, ssh-host-identity->KeyFile, domain(.env#LE_DOMAIN)->EnvValue, letsencrypt-cert->Certificate; FileBacked realizers where a real file backs them). REUSE the R40.6 M2 types (0022-0033), NOT new machinery — no synthetic pseudo-unit.
- [ ] [AUTOMATABLE, source] The tree emits the REAL unit ior for each deploymentRef node, NEVER a synthetic depref:<name> pseudo-id (grep: no depref: id reaches the drawer).
- [ ] [AUTOMATABLE render + @390 device] The detail drawer renders identity + fields + parent/children via ONE GENERIC default view DRIVEN BY THE M2 TYPE (the type determines the fields) — NOT per-type bespoke views that can drift (PO steer; DRY, the R40.5 lesson). The drawer does NOT hang. Verified @390 real-WebKit it renders content, not Loading.
- [ ] [AUTOMATABLE, ★ silent-failure guard] An UNRESOLVABLE ref renders an EXPLICIT 'unresolved: <ior>' error state — a permanent 'Loading...' is a SILENT failure that HIDES the bug (why it survived). Fail-LOUD, never silent-Loading; stub-must-fail (feed an unresolvable ref -> must show the error, not spin).
- [ ] [DEVICE @390 pixel - Tron on phone] Tron taps the deploymentRef node in the Server-Manager otmux tree -> the drawer RENDERS CONTENT (pixel evidence). AND the deploymentRefs array-removal stays a GATED dry-run+count migration with INV-T byte-diff==0 (leaves unchanged).

## Subtasks

None (atomic task).
