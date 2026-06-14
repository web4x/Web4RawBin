# T163: /api/trace requirement title source — switch from scanRepo firstLine() to scenario index `model.name`
[task:uuid:57c1f23f-dbac-4b49-a7a2-e0651a986c3f]

## Status

- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability

`[task:uuid:57c1f23f-dbac-4b49-a7a2-e0651a986c3f]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tester finding (planner-anchored, req-eng to formalize verbatim):**
    `[requirement:uuid:8ab16ae7-147e-472e-945f-5dbd8f488fc9]`
    Tester report (2026-06-02, via PO): "/api/trace requirement titles use `scanRepo firstLine()` not scenario index `model.name` → MD artifacts leak". Fix: switch `/api/trace` requirement-title source to scenario index `model.name` (which T161 already made clean). Sister to T160 (same `/api/trace`-data-source switch pattern).
- down
  - None (atomic task; single endpoint change)
- follows
  - [T161: fix requirement name rendering — speaky names not quotes](./task-161-requirement-name-renders-tron-quote-not-speaky.md) (shipped `737c841` v0.5.57) — established `model.name` as the clean source T163 switches to
  - [T160: Forward-ref REPOPULATION + browser data-freshness](./task-160-trace-browser-stale-requirement-items.md) (shipped `5b354fd` v0.5.58) — sister: same `/api/trace`-to-scenario-index switch pattern (T160 did forward-refs; T163 does titles)
- supersedes
  - [T162: MD artifacts (`##` headings) leak into requirement titles](./task-162-md-headings-leak-into-requirement-titles.md) — T162 assumed the fix was hardening `firstLine()` to strip MD; tester report clarifies the root cause is the wrong data source (T163's switch). **T162 marked SUPERSEDED by T163** at the same time this task is stood up.
- chain (req → usecase → puml → class/method) — architect fills on refinement
  - **requirement:** /api/trace title-source switch (anchored above)
  - **use case:** UC-TBD (architect — likely `api.trace.serialize` or `traceEndpoint.titleField`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (architect adds UC if introduced)
  - **class/method:** `src/ts/server/` `/api/trace` route handler — switch the requirement-title field source (TBD by architect)

## Context

T161 (shipped `737c841` v0.5.57) made the **scenario index** `model.name` clean: speaky names instead of raw Tron-quote blockquotes. T161 fixed `model.name`, not the `/api/trace` endpoint.

Tester verification on T161 (TS6) surfaced that `/trace` still shows MD-prefixed titles. The root cause is NOT the firstLine() helper itself but rather: **/api/trace computes titles via `scanRepo firstLine()` at request time, reading raw source, instead of reading the already-clean `model.name` from the scenario index.** That parallel path bypasses T161's fix.

This is the **same architectural pattern T160 fixed for forward-refs**: T160 switched `/api/trace` from a derived/stale source to the scenario index. T163 does the same for the title field.

**Why this supersedes T162.** T162 (just stood up 2026-06-02) assumed the fix was to make `firstLine()` strip MD headings. PO's clarification: the fix is to **stop calling firstLine() from /api/trace for titles** — use `model.name` directly. `firstLine()` may still be valid for other callers; T163 fixes the consumer, not the helper.

## Intention

### Why this task exists
T161 fixed the data; `/api/trace` doesn't read it. The browser sees MD-prefixed titles because the endpoint computes its own (incorrectly).

### Problems this task solves
- `/api/trace` titles bypass T161's clean `model.name`
- MD heading prefixes (`##`, `###`, `# `) surface in `/trace` titles
- Two parallel title-derivation paths exist (scenario index vs. scanRepo) — DRY violation

### How it solves them
- One-endpoint change: `/api/trace` requirement-title field reads scenario index `model.name`
- Apply same pattern across other typed classes if the endpoint computes their titles the same wrong way (architect scopes)
- Removes the parallel derivation path

## Acceptance Criteria

- [ ] AC1 — `/api/trace` requirement-title responses read from scenario index `model.name`, NOT `scanRepo firstLine()`
- [ ] AC2 — `/trace` Requirement tree-items + chain-link anchors show speaky names with **NO MD heading prefixes** (`##` / `###` / `# `) and **NO blockquote prefixes**
- [ ] AC3 — Sibling typed classes (UseCase/Task/Class/Method/Test/TraceLink/View) audited: if `/api/trace` computes their titles via the same derived path, the switch applies there too (architect scopes)
- [ ] AC4 — `model.name` remains the canonical title source — single derivation path (DRY restored)
- [ ] AC5 — T160's forward-ref data path NOT regressed; T161's `firstLine()` fix in `TraceConsistency.ts` remains valid for any OTHER caller that uses it
- [ ] AC6 — `npm run build` succeeds; all existing tests pass (no regression on T159 / T160 / T161)
- [ ] AC7 — **Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set; (c) STATIC_SHELL exempt (no new route)

## QA Audit & User Feedback

- 2026-06-02: PO directed planner to stand up T163 immediately. Sister to T160 (same /api/trace data-source switch pattern). SUPERSEDES T162 — same MD-artifact symptom but the correct root cause is the wrong data source (not a strip-rule gap in `firstLine()`). CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC7 + DoD (learnings #15+#16). Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.

## Subtasks

None (atomic task; single endpoint change).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 26 (replaces T162's premise)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 3 (closes the MD-leak symptom at the correct architectural layer; sibling to T160's clean pattern)*
