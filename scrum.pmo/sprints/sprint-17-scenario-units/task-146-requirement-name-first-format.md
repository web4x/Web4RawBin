[Back to Sprint 17 Planning](./planning.md)

# T146: Requirement-entry format reform — 3–5 word NAME first line + speaky-NAME on 🔗

[task:uuid:1747c27f-e295-4933-b885-3a567072663e]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `ccca722` req confirm + `83099ea` architect design)
  - [ ] creating test cases
  - [x] implementing (`7fbfd8e` template + validator + views — **rule-pair FLAG ⚠️**: 7fbfd8e itself has no package.json/sw.js bump; batched via `f549114` v0.5.41 (T145's bump). Same pattern as T136/T138 batched bumps — gets to device but not in same commit-set per #15 strict reading)
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — B7 captured already (Tron's literal directive in `scrum.pmo/backlog.md`); additional req work: audit all S10–S17 `requirements.md` for entries needing retro-clean; produce the per-sprint dup-list; confirm the 4-line format spec matches Tron's literal directive end-to-end
2. **robbin-architect** — design the NAME-first format (markdown shape + validator rule for `trace-cli`); design the template change (T126 helper resolves requirement → NAME on chain-link 🔗 anchors; description renders as tooltip / hover-preview / `<details>` reveal); decide whether Task/UC/Class/Method/Test names normalize symmetrically at this layer; update `scrum.pmo/standards/traceability-standard.md`
3. **robbin-expert** — implement: format migrator (one-shot script across S10–S17 `requirements.md`); T126 template helper + T141 chain-link anchor uses NAME; `trace-cli` validator (line-1 NAME present + no dup); carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — verify 0 dups across S10–S17 `requirements.md`; visual on `/md/scenarios/sprints.md/...` shows NAME on 🔗 with hover/tooltip preview of description; regression on T141 chain-link rendering + T144 click-through; chain audit clean

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:1747c27f-e295-4933-b885-3a567072663e]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng):** B7 in [scrum.pmo/backlog.md](../../backlog.md)
  - **B7 requirement** `[requirement:uuid:a8b9c0d1-e2f3-4a4b-b5c6-d7e8f9a0b1c7]`
    Verbatim Tron quote (from backlog B7):
    > "requirement has duplicate content. keep the description and make a 3 to 5
    > word name as first line name of the requirement as a summary"
- down
  - None (atomic at parent level; the retro-clean across S10–S17 may be split into per-sprint sub-tasks T146.x if architect prefers — coordinate with planner first)
- follows
  - [T126: Generated views + 7 templates](./task-126-views.md) — template helper that T146 modifies to render NAME on 🔗
  - [T141: Chain-link icon → sprints.json symlink](./task-141-chain-link-icon-symlinks.md) — chain-link anchor T146 changes the display text of (from UUID-ish to NAME)
  - [T143: Chain → tree rework](./task-143-traceability-tree-rework.md) — "every typed reference a clickable link" — T146 is the speaky-text layer on top of T143's tree
  - [T144: File-browser display fixes](./task-144-file-browser-display-fixes.md) — 🔗 click-through that T146 changes the display text of
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B7 (above)
  - **use case:** UC-TBD (architect — likely `requirement.summarize`, `view.renderLink` (extended), `traceCli.validateFormat`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** `scrum.pmo/sprints/sprint-*/requirements.md` (retro-clean target — many files) / `src/public/ts/trace/templates.ts` (template helper) / `scripts/trace-cli.*` (validator) / `scrum.pmo/standards/traceability-standard.md` (spec) — TBD by architect

## Context

Tron 2026-06-01 (captured by req-eng in B7 of `scrum.pmo/backlog.md`): two-part
directive in one quote.

1. **Format change.** Each `requirements.md` entry has duplicate content today
   (the Tron blockquote AND a paraphrased description below it). Tron's
   directive: **keep the description** (= the Tron quote IS the description),
   and add a **3–5 word NAME as the first line** — a summary/title for the
   requirement. Final shape:
   1. **Line 1 — short NAME** (3–5 words, speaky summary)
   2. **Tron literal blockquote** (the description, no duplicate paraphrase)
   3. `[requirement:uuid:<v4>]`
   4. Forward link(s) — the task(s) / use case(s) / class(es) / method(s) this
      requirement flows into (the tree-fan-out introduced by R17.26)

2. **Template change implied.** Once requirements have a NAME, every place that
   today renders the UUID or a paraphrase on a chain-link 🔗 anchor should
   render the **NAME** instead. The description (Tron literal quote) moves to
   a tooltip / hover-preview / `<details>` reveal — visible on demand, not
   inline. Same pattern applies symmetrically for Task / UseCase / Class /
   Method / Test names rendered on 🔗 anchors (architect decides full scope).

## Intention

### Why this task exists
- `requirements.md` entries today repeat content; Tron called this out
- Without a NAME, chain-link 🔗 anchors render UUIDs or paraphrased text — not
  human-friendly
- Adding NAME first then propagating it through templates is structural:
  fix the source, every view downstream benefits

### Problems this task solves
- Duplicate content in requirements.md entries
- 🔗 anchors render UUIDs or non-speaky text
- No canonical short label for a requirement

### How it solves them
- Standardize requirement entry shape: NAME line + Tron quote + uuid + forward link
- Retro-clean S10–S17 `requirements.md` files (one-shot migrator)
- Template helper resolves `requirement.NAME` for chain-link 🔗 anchor text
- Description becomes a tooltip / `<details>` reveal
- `trace-cli` validator enforces the format going forward

## Acceptance Criteria
- [ ] AC1 — Format spec documented in `scrum.pmo/standards/traceability-standard.md`:
  each requirement entry = line-1 NAME (3–5 words), Tron literal blockquote
  (no dup), `[requirement:uuid:v4]`, forward link(s)
- [ ] AC2 — S10–S17 `requirements.md` retro-cleaned: 0 NAME/description
  duplicates; every entry has a NAME line; every uuid is real v4 (learning #17)
- [ ] AC3 — T126 ViewGenerator templates render NAME on chain-link 🔗 anchors
  (not UUID, not full description)
- [ ] AC4 — Description renders as tooltip / hover-preview / `<details>`
  reveal — visible on demand
- [ ] AC5 — T141 chain-link helper updated to use NAME; existing 🔗 rendering
  on migrated views shows speaky text
- [ ] AC6 — `trace-cli` audit validates format (line-1 NAME present + no dup)
  and reports compliance per requirement entry
- [ ] AC7 — No regression on T141 click-through (still resolves to symlink
  target post-T144)
- [ ] AC8 — **Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version"
  bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as
  the user-facing template change. (c) STATIC_SHELL: likely exempt — architect
  to confirm
- [ ] AC9 — All 4 roles committed work in this file (req audit + architect
  design + expert impl + tester verify)

## Test Scenarios
File: `test/vitest/requirement-format.test.ts` (new) + visual on `/md/scenarios/sprints.md/...`.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Run `trace-cli validate-format` against S10–S17 requirements.md | 0 violations; every entry has line-1 NAME |
| TS2 | Visual: open a sprint's generated view at `/md/scenarios/sprints.md/requirement/<sample>.md` | NAME shown prominently; description below as tooltip/`<details>` |
| TS3 | Click a chain-link 🔗 in any migrated view | Anchor text is the requirement's NAME (not UUID); navigates correctly (T141/T144 click-through still works) |
| TS4 | Hover/tap the 🔗 (architect decides interaction) | Description (Tron quote) revealed as tooltip / expanded `<details>` |
| TS5 | Regression: open any S10–S17 requirements.md raw | Entries are well-formed (no duplicates); existing references still resolve |
| TS6 | Regression on T141 + T144 | Chain-link rendering + click-through unchanged behaviorally; only display text differs |
| TS7 | Rule-pair post-bump | New CACHE_NAME activates; new template visible on Tron's device |

## Dependencies
- **Requires:** T141 (chain-link helper to modify), T126 (template helpers), T143 (tree + every-element-a-link surface T146 sits on top of), T144 (🔗 click-through behavior T146 must not break), B7 captured ✓
- **Coordinate-with:** T145 (User scenario may also need a NAME field — architect decides if symmetric)
- **Enables:** legible chain navigation across all migrated views

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** confirms B7 anchored above is the verbatim Tron quote; audits S10–S17 `requirements.md` and produces a per-sprint dup-list (input for architect's migrator scope)
2. **robbin-architect** designs: format spec + standard update + template helper change (T126/T141 use NAME) + tooltip/`<details>` rendering for description + `trace-cli` validator rule + symmetric question for Task/UC/Class/Method/Test (decide scope); writes Design section
3. **robbin-expert** implements: one-shot migrator across S10–S17 `requirements.md`; template helper + chain-link anchor uses NAME; `trace-cli` validator; carries rule-pair (a)+(b)
4. **robbin-tester** runs TS1–TS7 + 0-dup verification across S10–S17 + visual sweep; commits verification report into QA Audit

## Definition of Done
- [ ] All AC met (AC1–AC9)
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on T141 / T144 / chain-link click-through
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-01: PO directed planner to lift T146 from backlog packet (B7) per Web4Articles + 4-role + real v4 uuids. B7 already captured by req-eng (Tron literal anchored). CMM4 4-role engagement enforced (learnings #18); rule-pair (a)+(b) in AC8 + DoD (learnings #15+#16). Coordinate with req + architect for design refinement. Awaiting req-eng retro-clean audit → architect design + standard update → expert migrator + template + validator → tester verify → Tron QA.
- 2026-06-01 **robbin-req (refinement):** B7 verbatim confirmed at lines 37-38 — matches backlog.md verbatim exactly. `requirement:uuid:a8b9c0d1` at line 35 confirmed. Pre-audit already completed (session/agents/robbin-req/t146-name-drafts.md): 16 entries across S11(1), S13(7), S17(8) need title shortening. S16 already clean (5-7 words). Draft 3-5 word names ready for each — e.g. "Avatar must persist across sessions — must not revert to default" → "Avatar session persistence". Additionally, S10/S12/S14/S15 have a format issue: requirement titles not in bold `**...**` markers — needs fixing in retro-clean pass. Req refinement complete — ready for architect.

## Design (robbin-architect, 2026-06-01)

### 1. Requirement entry format spec (4 lines)

```markdown
**Short Name Here**             ← line 1: 3-5 word NAME (bold)
> Tron's verbatim directive...  ← line 2+: blockquote (IS the description, no dup)
[requirement:uuid:<v4>]         ← uuid line
([task-N](./task-N-....md))     ← forward link(s)
```

Update `scrum.pmo/standards/traceability-standard.md` with this shape.

### 2. Model change — add `name` field to Requirement scenario

Currently RequirementLoader defaults:
```typescript
export const RequirementLoader = loader('Requirement', { description: '', priority: '', source: '', tasks: [], tests: [] });
```

Add `name` field (already named `name` in the base — inherited from Model). The `name` field = the 3-5 word short name. `description` = the Tron literal quote. No schema break — `name` already exists on Model.

### 3. Template change — NAME on 🔗 anchors

In `templates.ts` RequirementTemplate:
```typescript
// BEFORE (renders description or uuid):
toHtml(m) { return `...${esc(String(m.description || ''))}...` }

// AFTER (renders NAME prominently, description as <details>):
toHtml(m) {
  const name = esc(String(m.name || 'Untitled'));
  const desc = esc(String(m.description || ''));
  return `<div class="sv-requirement"><h3>${name}</h3>
    <details><summary>Description</summary><blockquote>${desc}</blockquote></details>
    ${status}${renderTraceTreeHtml(...)}</div>`;
}
```

Chain-link 🔗 anchors: `renderTreeNodeHtml` already uses `n.name` (the speaking name). Once requirements have a proper `name` field, this works automatically — the tree renderer picks up `model.name` via `TraceNode.name`. No change needed in trace-tree.ts.

### 4. trace-cli validator rule

New rule in trace-cli audit:
```
requirement.namePresent: model.name exists && model.name.split(' ').length >= 3 && <= 7
requirement.noDuplicate: model.name !== model.description.slice(0, model.name.length)
```
Reports per-entry compliance. Fails on missing name or name === description prefix.

### 5. Retro-clean scope (from req-eng audit)

| Sprint | Entries | Issue |
|--------|---------|-------|
| S10, S12, S14, S15 | varied | Titles not in bold markers — format fix |
| S11 | 1 | Title >5 words — shorten |
| S13 | 7 | Titles >5 words — shorten |
| S16 | 0 | Already clean (5-7 words) |
| S17 | 8 | Titles >5 words — shorten |

Draft names already prepared by req-eng in `session/agents/robbin-req/t146-name-drafts.md`.

One-shot migrator script: reads each `requirements.md`, parses entries, applies draft names from the name-drafts file, reformats to 4-line shape, writes back. Expert implements.

### 6. Symmetric question — do Task/UC/Class/Method/Test also get NAME-first?

**Decision: NO, not in T146 scope.** Tasks already have names (task file title = name). UCs have `object.verb`. Classes have class name. Methods have method name. Only Requirements lacked a short name. T146 is requirement-specific. If Tron directs symmetry for others later, it's a new task.

### 7. Tooltip/hover for description

Desktop: CSS `<details><summary>` — click to expand.
Mobile: same — native `<details>` works on iOS/Android.
No JS needed. No `title` attribute tooltip (unreliable on mobile).

### No new routes, no STATIC_SHELL change.

## Subtasks
None (single commit-set; retro-clean across sprints is part of the migrator script run, not separate sub-tasks).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 10 (Requirement entry format + speaky-NAME on 🔗)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 4 (legibility uplift across all migrated views; rides on T143/T144 tree+link foundation)*
