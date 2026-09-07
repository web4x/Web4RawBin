<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T21.8: Companies as shared dedup units

[task:uuid:842d4f01-8ba6-4917-8b9b-e99d4d70c986]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect — req+architecture.md)
  - [x] AC + test scenarios (in requirement unit)
  - [x] implementing (expert — shipped)
  - [x] architect PDCA Check
  - [ ] testing (tester DET gate)
- [x] QA Review
- [ ] Done

## Traceability

- up
  - requirement:uuid:bf6a0433-6e85-4341-92e5-79acb725e0bf (R-unit, architect-refined AC/TS)
  - Sprint 21 Planning
- chain
  - use case: uc:uuid:a62c6e37-139f-4107-a157-1c67b3e06bfb
- context
  - Sprint 21 shipped without scenario-first planning (no planner on WODA.prod); tasks backfilled by architect per PO directive 2026-06-29.

## Task Description

CompanyIndex.mintOrReuseShared: companyNameKey (NFKD+diacritics, lowercase, &->and, strip legal suffixes, strip non-alnum) is the recall key; domain (from email/URL) is the AUTHORITATIVE key. Domain-hit reuses; domain present-but-miss mints DISTINCT (AC-b3); no-domain nameKey collision dedups (Tron "do not duplicate"). ownerIor:null shared; Profile.companies[] forward-only; /api/company/suggest autocomplete.

## Acceptance Criteria

- [ ] **(namekey)** companyNameKey(raw) is deterministic and pure — identical input always yields identical output; the SAME implementation is shared by server and client.
- [ ] **(namekey)** Normalization steps, in order: NFKD unicode-fold + strip diacritics, lowercase, replace & with " and ", repeat-strip legal suffixes until stable, strip all non-alphanumerics.
- [ ] **(namekey)** Canonical collapse: "Cerulean Circle", "cerulean circle GmbH", and "CeruleanCircle" all map to nameKey "ceruleancircle".
- [ ] **(namekey)** Legal-suffix strip is token-wise, case-insensitive, repeated until stable, and covers at least: gmbh, mbh, ag, se, kg, ug, inc, llc, ltd, limited, corp, corporation, co, company, plc, lp, llp, sa, sarl, bv, nv, oy, ab, as, spa, srl, pty (so "GmbH & Co KG" fully strips).
- [ ] **(namekey)** nameKey is a RECALL/suggestion key ONLY: a nameKey collision NEVER by itself triggers an automatic merge of two companies.
- [ ] **(domain)** When a company email or URL is available, domain = the registrable host derived from it (e.g. cerulean.circle); otherwise domain is null.
- [ ] **(domain)** Domain is AUTHORITATIVE: two inputs with the same domain resolve to the SAME company unit even if their names (and nameKeys) differ.
- [ ] **(domain)** Two inputs with DIFFERENT domains resolve to SEPARATE company units even if their nameKeys collide (e.g. "Apple Inc" vs an unrelated "Apple").
- [ ] **(domain)** Where a domain is present it overrides nameKey in both lookup and mint decisions.
- [ ] **(autocomplete)** GET /api/company/suggest?q=<typed> returns up to 5 existing units ranked: exact nameKey > domain match > nameKey prefix > token-overlap fuzzy (Jaccard on word-set).
- [ ] **(autocomplete)** The suggestion list ALWAYS includes a permanent bottom row "Create \"<typed>\"".
- [ ] **(autocomplete)** Selecting an existing suggestion reuses that Company uuid — NO new unit is minted.
- [ ] **(autocomplete)** Choosing Create mints a NEW unit even if a nameKey neighbour exists (explicit user override = distinct company): no silent merge ever happens from normalization alone.
- [ ] **(autocomplete)** When a user confirms a typed variant onto an existing unit, the raw typed string is appended to that unit aliases[] (for future recall + audit).
- [ ] **(autocomplete)** The company input is debounced (~150 ms) before querying /api/company/suggest.
- [ ] **(dedup)** mintOrReuseShared(name, domain?) step 1: if domain present and alt/company-domain/<domain> exists, return that unit uuid (no mint).
- [ ] **(dedup)** Step 2: else if alt/company/<nameKey> exists, return that unit uuid (no mint).
- [ ] **(dedup)** Step 3: else mint a new ior:class:Company, declare unitLinks (nameKey + domain when known), and index.put (which self-syncs the symlinks).
- [ ] **(dedup)** Concurrent first-mint of the same nameKey does NOT create a duplicate: the alt/company/<nameKey> symlink is created with an atomic exclusive (wx) write — first writer wins, the loser re-reads the winner.
- [ ] **(unit-shape)** Each company is an ior:class:Company unit whose model carries: { uuid, name (display = first-entered form), nameKey, domain|null, aliases[], unitLinks[] }.
- [ ] **(unit-shape)** unitLinks include alt/company/<nameKey>.scenario.json and, when domain is known, alt/company-domain/<domain>.scenario.json — both symlinks point to the Company unit ITSELF (not to a profile).
- [ ] **(unit-shape)** Profile.model.companies[] holds the forward IOR(s) to Company unit(s); a profile may reference multiple companies.
- [ ] **(shared)** Company.ownerIor === null — a company is owned by NO single profile (legitimate null, like a Skill unit).
- [ ] **(shared)** Multiple profiles reference the SAME Company uuid via their own companies[]; there is exactly one unit, no duplication.
- [ ] **(shared)** There is NO back-pointer/members[] array on Company (forward-only): "who works here" is answered by walking all profiles companies[]; any member count shown in UI is a derived read, never stored as source of truth.

## Dependencies

- Requires: Sprint 21 requirement + UC/Class/Method chain seeds
- Enables: tester DET gate

## Definition of Done

- [ ] All req ACs met; chain resolves Req->UC->Class->Method->Impl->Test
- [ ] Tester DET gate PASS
- [ ] Tron QA approved

## QA Audit & User Feedback

Shipped: v0.6.72 a52245de1 + b3 fix v0.6.74 2a1357a69. Architect PDCA: PDCA: AC-b3 gap -> FIXED v0.6.74 (verified GREEN).

## Subtasks

None (atomic task).
