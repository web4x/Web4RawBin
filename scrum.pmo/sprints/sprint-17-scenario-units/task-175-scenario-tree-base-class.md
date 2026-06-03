[Back to Sprint 17 Planning](./planning.md)

# T175: /scenario tree base class + UX (consolidates R-N1 + R-N2 + R-N3)
[task:uuid:20e89691-a5dc-4576-85dd-e1eec19b0f10]

> **PO direction 2026-06-03:** Stand up T175 (R-N1+R-N2+R-N3) — single
> consolidated task on the /scenario tree surface. R-N3 is the architectural
> core: Tree base class extends Traceability; `parent` + `children[]` getters/
> setters derive from each type's chain position (req→task→uc→class→method→
> impl→test). R-N1/R-N2 are /scenario tree UX (width + expand-collapse state).
> 4-role planner-first; architect designs the Tree class hierarchy.

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req-eng verbatim capture + architect designs Tree class hierarchy)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) *(or successor — req-eng to anchor on the verbatim Tron source when captured)*
  - **R-N1** `[requirement:uuid:2681ad2a-c2ad-4429-9754-4e0db808ba5f]` — /scenario tree UX: width (req-eng: capture verbatim Tron quote)
  - **R-N2** `[requirement:uuid:cf759d95-ae5e-41db-9caa-55f9648d15cf]` — /scenario tree UX: expand-collapse state (req-eng: capture verbatim Tron quote)
  - **R-N3** `[requirement:uuid:b323f3b9-25ca-40eb-8cbb-eedb0f888f3c]` — Tree base class extends Traceability; `parent` + `children[]` getters/setters derive from each type's chain position (LOCKED chain: req→task→uc→class→method→impl→test)
- follows
  - T168 (LOCKED chain spec — Traceability + canonical-walk order)
  - T174 (/scenario route + drawer surface — T175 lives inside this route)
  - T172 (forward-ref population for chain reachability — Tree class consumes the populated `model[]` arrays)
- down
  - None (atomic task — architect designs Tree class hierarchy as one coherent piece)

## Task Description (planner seed — req-eng to fill verbatim per R-I/R-H.2 atomic-split rule)

**PO seed (2026-06-03):**

- **R-N3 (architectural core):** A `Tree` base class extending `Traceability`
  becomes the OO substrate for the traceability browser. Each instance type
  (Requirement, Task, UseCase, Class, Method, Implementation, Test) inherits
  Tree behaviors. `parent` and `children[]` are getters/setters derived from
  the type's position in the LOCKED chain — not stored fields, but **computed**
  from forward refs (T172) and reverse lookup. Example:
  - `Task.parent` → Requirement (the Requirement that owns this task via its
    `tasks[]` forward array)
  - `Task.children[]` → UseCase[] (via Task.useCases[])
  - `UseCase.children[]` → Class[]
  - `Class.children[]` → Method[]
  - `Method.children[]` → Implementation[]
  - `Implementation.children[]` → Test[]
  - `Test.children[]` → [] (leaf)
  - `Requirement.parent` → null (root) or Sprint (if Sprint owns Requirement)

  This unifies the tree-walking logic across /trace and /scenario: client and
  server walk identical `parent`/`children[]` accessors regardless of type.

- **R-N1 + R-N2 (/scenario tree UX):** Two UX atoms on the /scenario tree:
  - **R-N1 width** — (req-eng: verbatim) — likely the tree width handling on
    /scenario (cap, responsive, or layout) — pending Tron verbatim.
  - **R-N2 expand-collapse state** — (req-eng: verbatim) — likely persistence,
    semantics, or visual state of expand/collapse on the /scenario tree —
    pending Tron verbatim.

**Pending:** req-eng captures verbatim Tron quotes for R-N1, R-N2, R-N3 from PO's
relay (compound-requirement-source-2.md or successor). Each becomes a one-sentence
atomic requirement (R-I / R-H.2 standing rule). Architect then designs the Tree
class hierarchy (R-N3) + UX fixes (R-N1/N2) as ONE coherent task per PO direction.

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — capture verbatim Tron quote for each of R-N1, R-N2, R-N3 → one-sentence atomic requirements
- **robbin-architect** — design the Tree class hierarchy (R-N3 core): base class extending Traceability; per-type `parent` / `children[]` getter/setter derivations; integration with T172 forward-ref data; UX design for R-N1 + R-N2
- **robbin-expert** — implement per design; rule-pair (a) `package.json` + (b) `sw.js` CACHE_NAME bumps; (c) likely exempt (no new route — modifies /scenario surface) — architect to declare in refinement
- **robbin-tester** — verify ACs (Tree class behaves per chain position; /scenario UX matches R-N1/N2 spec; /trace regression check); no regression on T174 surfaces

## Acceptance Criteria (skeleton — req+architect to refine per verbatim)

**R-N1 (/scenario tree width):**
- [ ] AC1 — (pending verbatim) — /scenario tree width behavior per R-N1 quote
- [ ] AC2 — No regression on /trace tree width

**R-N2 (/scenario tree expand-collapse state):**
- [ ] AC3 — (pending verbatim) — /scenario tree expand-collapse state per R-N2 quote
- [ ] AC4 — No regression on /trace expand-collapse (T115 behaviors preserved)

**R-N3 (Tree base class):**
- [ ] AC5 — `Tree` base class exists, extends `Traceability`
- [ ] AC6 — Each instance type (Requirement, Task, UseCase, Class, Method, Implementation, Test) inherits Tree
- [ ] AC7 — `parent` getter on each type derives the parent per LOCKED chain position via reverse lookup
- [ ] AC8 — `children[]` getter on each type derives children per LOCKED chain position via forward refs (T172 populated arrays)
- [ ] AC9 — Tree-walking on /trace and /scenario uses identical `parent`/`children[]` accessors (no type-specific switch in tree component)
- [ ] AC10 — `Test.children[]` is empty (leaf); `Requirement.parent` is null (root) — boundary cases handled
- [ ] AC11 — Existing T172 forward-ref data + T168 LOCKED chain spec are the source of truth (no new chain data; this task is a class layer over existing data)

**Backwards-compat + ship rules:**
- [ ] AC12 — `/trace` behavior UNCHANGED — full-tree mount from Requirement roots; collapse/expand parity (T115)
- [ ] AC13 — `/scenario` behavior preserves T174 (IOR-seed + scroll + interactions); R-N1/N2 are layer-on UX, not replacements
- [ ] AC14 — Rule-pair (a)+(b); (c) STATIC_SHELL — architect declares yes/no per learning #16 (likely exempt — modifies existing /scenario)
- [ ] AC15 — `npm run build` clean; full test suite passes

## Subtasks
None (atomic task — single PO-directed consolidated effort; architect designs Tree hierarchy as one coherent piece).

## QA Audit & User Feedback
- 2026-06-03: PO directs T175 stand-up covering R-N1/R-N2/R-N3 ("single consolidated task; R-N3 architectural core; 4-role planner-first; architect designs Tree class hierarchy"). Planner scaffolded T175 planner-first with placeholder ACs; verbatim Tron quotes pending req-eng capture.
- Pending: req-eng verbatim capture → architect refinement (Tree class hierarchy + R-N1/N2 UX) → expert impl → tester verify → Tron QA.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 31 — R-N (Tree base class + /scenario tree UX)
**Follows:** T168 (LOCKED chain) · T172 (forward-ref population) · T174 (/scenario route)
**R-N1 + R-N2 + R-N3:** consolidated — Tree class hierarchy is the foundation that R-N1/N2 UX builds on
