<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.2: WODA.prod as a UML deployment-Node (SSH/domain/letsencrypt refs + otmux sessions->windows->panes children)

[task:uuid:ce92294f-2a53-4f41-b15d-ac60f416e121]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.2 (WODA.prod UML deployment-NODE: SSH/domain/letsencrypt refs + otmux sessions->windows->panes children). ACs MIRRORED from req R40.2 adab1bb5 (requirements.md 3bd0fb847); coveredRequirements resolves. ★ refs-resolve-REAL: ALL 4 refs CONFIRMED measured-real + semantically-correct (architect 6276f73e1) — SSH = /etc/ssh/sshd_config (inbound) + host key ~/.ssh/public_keys/root.WODA.prod.public_key; DOMAIN = .env LE_DOMAIN/BASE_DOMAIN; CERT = /etc/letsencrypt/live/prod.wo-da.de/; ~/.ssh/config EXCLUDED (outbound client). Mint the 4 ref units at build-go. In Progress: architect design 389912465 + refs 6276f73e1; impl a25b0fbf7 (renderFacet-extend). ★ implementing [x] on VERIFY-OWNER-FIRST PASS 4/4 (req + planner disk-confirmed): ride impl 94ad4f50 DiagramViewModel.renderFacet owner=a6a05d34 UNTOUCHED (R30.11 original, not re-flipped), markerPending=false, tests[]=[e21b876d,0172b45d] NOT padded, distinct-intent R30.11 node-branch, M1 fc327458 4-refs+lens intact. QA-Review: R40.2 CHAIN-COMPLETE-TO-TEST (planner disk-verified) — Test e9b21f74 status=pass riding Impl 94ad4f50 (owner a6a05d34 UNTOUCHED verify-owner-first, tests[]=[e21b876d,0172b45d,e9b21f74] distinct-intent NOT padded, M1 fc327458 4-refs+lens). Diagram surface PROVEN. All 4 In-Progress sub-steps [x]. ★ RE-ROOT LANDED (expert 658f7b130 v0.8.68; served now v0.8.69) — prior 'tree STILL FLAT' note CORRECTED. NOW PROVEN [+ server-side, tester 09b3c7543]: /api/server-manager/tree 403s non-owner with ZERO tree-content leak · readSessionTree = genuine LIVE LENS (5 sessions/23 panes, fresh per call, read-only so INV-T==0 BY CONSTRUCTION) · node fc327458 kind:node with ALL 4 deploymentRefs RESOLVING (ssh-service/ssh-host-identity/domain/letsencrypt-cert). ★★ ZERO OPEN DEFECTS (item-3 fail-open VERIFIED CLOSED, tester re-gate 1dc1a469b RED->GREEN served==committed==0.8.69): BOTH degradation paths LOUD — else-branch (node missing/not-a-node) AND catch-branch (exception) each emit server console.warn + a VISIBLE type:'notice' ⚠ row NAMING the uuid, wrapping the flat sessions so availability is preserved; plant-missing -> roots[0].type='notice' (NOT bare flat); stub-must-fail HOLDS (strip the notice -> RED back to the 0.8.67 silent baseline). ⇒ everything remaining is UNPROVEN-PENDING, NOT broken (the unproven!=broken distinction is the point of certScope). CERT-SCOPE PENDING (2 genuinely-open, NEITHER a defect): (1) buildRootedTree EXTRACT — the composed structure is currently gated as a [REPLICATED] copy (composition INLINE in the handler); expert extracts (after T36.3) so the REAL fn is gated, not the tester's replica; (2) VISUAL @390 render on the owner-only page -> TRON. Done-gate [ ] — NOT Done w/o Tron (7-check batch, root node visible on served v0.8.69).

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.2 `[requirement:uuid:adab1bb5-a292-490b-84fb-6e921dfb6a8f]`
  - down
    - None (atomic task)

## Task Description

R40.2 (Tron-authorized S40). A scenario-first representation of the SERVER (WODA.prod) as a UML DEPLOYMENT NODE, rendered in deployment-node style in the UML diagram, with REFERENCES to (a) the SSH config for WODA.prod, (b) the configured DOMAIN, (c) the LETSENCRYPT CERTIFICATE for that server. The CURRENT OTMUX ITEMS (sessions -> windows -> panes) are CHILDREN of that root node. Builds on the S40 Server-Manager surface + the existing UML/deployment model + otmux item hierarchy. Reuse the UML node render + otmux enumeration, NO fork. Scenario-first: req mints R40.2 (adab1bb5) + ACs; architect designs the deployment-node chain + child hierarchy; expert implements; tester gates @390.

## Acceptance Criteria

- [ ] (node-exists) A deployment-node unit for WODA.prod exists on disk (UML deployment-Node facet), with its 3 references present.
- [ ] (refs-resolve-REAL) The 3 refs — SSH config, configured domain, LetsEncrypt certificate — RESOLVE to REAL MEASURED artefacts on WODA.prod AND are SEMANTICALLY CORRECT (the node's OWN inbound service config, not a resolvable-but-wrong outbound client file); NEVER invented/assumed paths. Measured: DOMAIN=.env LE_DOMAIN/BASE_DOMAIN (prod.wo-da.de); CERT=/etc/letsencrypt/live/prod.wo-da.de/; SSH=/etc/ssh/sshd_config (inbound) + host identity ~/.ssh/public_keys/root.WODA.prod.public_key — NOT ~/.ssh/config (outbound client).
- [ ] (otmux-children) The current otmux items appear as CHILDREN under the node root in the correct hierarchy: session -> window -> pane.
- [ ] (deployment-style) Renders in the UML diagram in DEPLOYMENT-NODE style (the 3D node-box notation), NOT a plain class box.
- [ ] (inv-t) INV-T: tree byte-diff == 0 — the node projection is compute-on-read / non-mutating (no write-back to the scenario tree).
- [ ] (device-gate) @390 mobile REAL-WebKit: the node + its otmux children render legibly.

## Subtasks

None (atomic task).
