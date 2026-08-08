<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.2: WODA.prod as a UML deployment-Node (SSH/domain/letsencrypt refs + otmux sessions->windows->panes children)

[task:uuid:ce92294f-2a53-4f41-b15d-ac60f416e121]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.2 (WODA.prod UML deployment-NODE: SSH/domain/letsencrypt refs + otmux sessions->windows->panes children). ACs MIRRORED from req R40.2 adab1bb5 (requirements.md 3bd0fb847); coveredRequirements resolves. ★ refs-resolve-REAL: ALL 4 refs CONFIRMED measured-real + semantically-correct (architect 6276f73e1) — SSH = /etc/ssh/sshd_config (inbound) + host key ~/.ssh/public_keys/root.WODA.prod.public_key; DOMAIN = .env LE_DOMAIN/BASE_DOMAIN; CERT = /etc/letsencrypt/live/prod.wo-da.de/; ~/.ssh/config EXCLUDED (outbound client). Mint the 4 ref units at build-go. In Progress: build-go GIVEN (PO); architect R40.2 design committed 389912465 (UMLNode M2 renderFacet + children-by-lens) + refs 6276f73e1; req minting chain, expert building. Task.useCases wire from req's chain mint (UC b9a549e4).

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
