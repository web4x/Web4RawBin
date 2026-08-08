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
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.2 (WODA.prod UML deployment-NODE: SSH/domain/letsencrypt refs + otmux sessions->windows->panes children). ACs MIRRORED from req R40.2 adab1bb5 (requirements.md 3bd0fb847); coveredRequirements resolves. ★ refs-resolve-REAL: ALL 4 refs CONFIRMED measured-real + semantically-correct (architect 6276f73e1) — SSH = /etc/ssh/sshd_config (inbound) + host key ~/.ssh/public_keys/root.WODA.prod.public_key; DOMAIN = .env LE_DOMAIN/BASE_DOMAIN; CERT = /etc/letsencrypt/live/prod.wo-da.de/; ~/.ssh/config EXCLUDED (outbound client). Mint the 4 ref units at build-go. In Progress: architect design 389912465 + refs 6276f73e1; impl a25b0fbf7 (renderFacet-extend). ★ implementing [x] on VERIFY-OWNER-FIRST PASS 4/4 (req + planner disk-confirmed): ride impl 94ad4f50 DiagramViewModel.renderFacet owner=a6a05d34 UNTOUCHED (R30.11 original, not re-flipped), markerPending=false, tests[]=[e21b876d,0172b45d] NOT padded, distinct-intent R30.11 node-branch, M1 fc327458 4-refs+lens intact. QA-Review: R40.2 CHAIN-COMPLETE-TO-TEST (planner disk-verified) — Test e9b21f74 status=pass riding Impl 94ad4f50 (owner a6a05d34 UNTOUCHED verify-owner-first, tests[]=[e21b876d,0172b45d,e9b21f74] distinct-intent NOT padded, M1 fc327458 4-refs+lens). Diagram surface PROVEN. All 4 In-Progress sub-steps [x]. ★ RE-ROOT LANDED (expert 658f7b130 v0.8.68; served now v0.8.69) — prior 'tree STILL FLAT' note CORRECTED. NOW PROVEN [+ server-side, tester 09b3c7543]: /api/server-manager/tree 403s non-owner with ZERO tree-content leak · readSessionTree = genuine LIVE LENS (5 sessions/23 panes, fresh per call, read-only so INV-T==0 BY CONSTRUCTION) · node fc327458 kind:node with ALL 4 deploymentRefs RESOLVING (ssh-service/ssh-host-identity/domain/letsencrypt-cert). CERT-SCOPE PENDING (3 distinct, keep ALL visible): (1) VISUAL @390 render on the owner-only page -> TRON; (2) [REPLICATED] — the composed structure was gated as a REPLICATED copy (composition INLINE in the handler); expert extracting buildRootedTree so the REAL fn becomes gateable; (3) fail-open fallback — WAS an OPEN DEFECT: SILENT=RED at v0.8.68 (tester 09b3c7543: node-missing degrades to the old flat list with NO warning = Tron's complaint could return unnoticed) -> ★ FIX LANDED (7998bee8c v0.8.69: now LOUD, visible notice-row + server WARN) -> awaiting tester RE-GATE to confirm the LOUD fallback (defect fix-landed, not yet re-proven). Done-gate [ ] — NOT Done w/o Tron (now 7-check batch: root node visible on served).

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
