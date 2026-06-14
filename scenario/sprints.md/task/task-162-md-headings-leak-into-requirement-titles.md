# T162: MD artifacts (`##` headings) leak into requirement titles
[task:uuid:7efe9b40-c7fe-407e-9cba-869261b8dcad]

## Status

- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability

`[task:uuid:7efe9b40-c7fe-407e-9cba-869261b8dcad]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Follow-on to T161** ([task-161-requirement-name-renders-tron-quote-not-speaky.md](./task-161-requirement-name-renders-tron-quote-not-speaky.md)) — tester TS6 finding during T161 verification: even after T161's fix selected speaky names over blockquotes, **Markdown heading artifacts (`##`, `###`, `# `) leak into requirement titles** when the source content's first non-blank line is a heading rather than prose.
  - **Source requirement (tester-anchored, to be promoted to verbatim by req-eng):**
    `[requirement:uuid:b4f9c649-623d-442d-a47b-3855fb331e47]`
    Tester TS6 finding on T161 (2026-06-02): requirement-title rendering pipeline returns `## …` / `### …` strings when the source's first non-blank line happens to be a Markdown heading; these MD artifacts then render as the title in `/trace` + chain-link anchors.
- down
  - None (atomic task; small scope — single helper / strip rule)
- follows
  - [T161: fix requirement name rendering — speaky names not quotes](./task-161-requirement-name-renders-tron-quote-not-speaky.md) — T162 closes a TS6 finding from T161 verification
  - [T159: forward-only chain — strip back-refs + validator](./task-159-forward-only-chain.md) — same data pipeline area
- chain (req → usecase → puml → class/method) — architect fills on refinement
  - **requirement:** tester TS6 finding (anchored above; req-eng to formalize)
  - **use case:** UC-TBD (architect — likely `view.renderTitle` or `parser.firstSpeakyLine`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (architect adds UC if introduced)
  - **class/method:** `src/ts/server/TraceConsistency.ts` (`firstLine()` helper area touched by T161); architect confirms

## Context

T161 fixed the primary bug (raw blockquote rendered as title — now speaky names render correctly via `firstLine()` in `TraceConsistency.ts`, shipped in `737c841` v0.5.57). Tester verification turned up TS6: when the source content's first non-blank line is a **Markdown heading** (`##`, `###`, `# `), the helper returns it verbatim and the heading text — including the leading hash marks — surfaces as the requirement title.

Tron-visible symptom: titles like `## Some Requirement` appear in `/trace` tree-items and chain-link anchors, instead of `Some Requirement`. Cosmetic but inconsistent — the speaky-name rule (R17.27 / T141) implies the **content** of the heading is the speaky name, not the Markdown prefix.

## Intention

### Why this task exists
T161 closed the blockquote-leak class of bug but not the heading-leak class. Tester caught the heading case in TS6; left unfixed, the chain-link UX still shows MD syntax in titles.

### Problems this task solves
- `firstLine()` (or upstream parser) does not strip Markdown heading prefixes
- Titles render with `##`/`###`/`# ` prefixes visible
- Possibly affects other typed scenarios whose source content begins with a heading (UseCase / Task / Class / Method / Test / TraceLink / View — architect confirms scope)

### How it solves them
- Extend the strip rule to skip leading-blank AND leading-Markdown-heading-prefix lines (likely also leading-`>` blockquote markers if T161 didn't fully cover that)
- Choose the **content** of the first speaky line as the title — strip the prefix tokens
- One-helper change keeps the fix DRY across all typed-scenario title rendering

## Acceptance Criteria

- [ ] AC1 — A requirement whose first non-blank source line is `## Title Here` renders title `Title Here` (no `##` / leading whitespace)
- [ ] AC2 — Same for `###`, `# ` (any heading level)
- [ ] AC3 — Existing T161 behaviour preserved: blockquote prefixes still skipped; speaky names still chosen over raw Tron quotes
- [ ] AC4 — Architect-scoped: if any other typed scenario (UseCase / Task / Class / Method / Test / TraceLink / View) shares the same pipeline, fix applies there too — chain audit across `/trace` shows zero MD-prefix titles
- [ ] AC5 — `npm run build` succeeds; all existing tests pass (no regression on T161 / T159 / T160)
- [ ] AC6 — **Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set; (c) STATIC_SHELL exempt (no new route)
- [ ] AC7 — Tester re-runs T161 TS6 + a new TS targeting `###` / `# ` cases; all PASS

## QA Audit & User Feedback

- 2026-06-02: PO directed planner to stand up T162 immediately — minor follow-up to T161, surfaced by tester TS6. CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC6 + DoD (learnings #15+#16). Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.

## Subtasks

None (atomic task; small scope).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 22 follow-on (T161 cleanup)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 3 (cosmetic but persistent — visible in every Tron view that uses MD-heading-prefixed source content)*
