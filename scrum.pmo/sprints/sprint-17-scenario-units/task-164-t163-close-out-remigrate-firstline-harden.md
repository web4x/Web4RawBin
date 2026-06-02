[Back to Sprint 17 Planning](./planning.md)

# T164: T163 close-out — re-migrate 3 dirty model.name units + harden firstLine() fallback

[task:uuid:e8c788c8-e085-4960-bad6-9a991af37d14]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — planner-first per PO direction 2026-06-02:**
1. **robbin-req** — anchor the verbatim tester finding (T163 partial 26/41; identified dirty source units = ## Extension 2, 3, 4)
2. **robbin-architect** — design the two folded paths:
   - **Path (a)** re-migrate the 3 dirty `model.name` units sourced from `## Extension 2`, `## Extension 3`, `## Extension 4` in `requirements.md` (or wherever the extension blocks live); their current scenario-index `model.name` still carries the `##`/`---` prefix because the prior migration didn't strip those when populating `model.name`
   - **Path (c)** harden `firstLine()` fallback to skip `##` / `###` / `# ` and `---` lines (defense in depth — for any consumer that still calls `firstLine()`, including the one before T163's data-source switch, and for any sample whose `model.name` is missing/empty)
3. **robbin-expert** — implement both paths in one commit-set; rule-pair (a)+(b)
4. **robbin-tester** — re-verify the 41-clean target (close from 26/41 to 41/41 for the 3 dirty units; T128.2 owns the broader S10-S16 migration separately)

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:e8c788c8-e085-4960-bad6-9a991af37d14]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tester finding on T163 verification (planner-anchored, req-eng to formalize verbatim):**
    `[requirement:uuid:a7313be3-dc15-4620-b8bd-d4c2b04b0349]`
    Tester (2026-06-02 via PO): T163's data-source switch (`f138aa0` v0.5.61) is PARTIAL — 26/41 units clean. The remaining 15 are split: **3 dirty `model.name` units** sourced from `## Extension 2/3/4` blocks in `requirements.md` (their stored `model.name` itself carries the `##` prefix — needs re-migration); **12 reqs in S10-S16** not yet migrated to the scenario index (= T128.2, handled separately by the broader migration task). T164 folds the 3-unit re-migration (a) + the firstLine() defense-in-depth harden (c). T128.2 takes the 12-req migration (b).
- down
  - None (atomic; two folded paths in one commit-set)
- follows
  - [T163: /api/trace title source switch](./task-163-api-trace-title-source-switch.md) — `f138aa0` v0.5.61 PARTIAL (26/41); T164 closes the 3-unit gap left after the data-source switch
  - [T161: speaky names via firstLine()](./task-161-requirement-name-renders-tron-quote-not-speaky.md) — `737c841` shipped firstLine() that T164 now hardens
- relates-to
  - **T128.2** — broader S10-S16 migration batch (the 12 unmigrated reqs path (b)). Not folded into T164 per PO direction. Tracked separately.
  - [T165: tree renders ALL 7 typed classes](./task-165-tree-renders-all-7-typed-classes.md) — was originally numbered T164 before this T164 reassignment (renumbered 2026-06-02 per PO direction; different scope, independent task)
- chain (req → usecase → puml → class/method) — architect fills on refinement
  - **requirement:** T163 close-out 3-path / two-fold (anchored above)
  - **use case:** UC-TBD (architect — likely `migration.remodel.name` for path (a) + `parser.firstLine.fallback` for path (c))
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (architect adds UC if introduced)
  - **class/method:** Migration script touching scenario-index entries for the 3 dirty units (path a); `TraceConsistency.ts` `firstLine()` fallback strip rule (path c) — TBD by architect

## Context

T163 (`f138aa0` v0.5.61) switched `/api/trace` requirement-title source from
`scanRepo firstLine()` → scenario-index `model.name`. Tester verification:
**26/41 clean**, 15 still dirty. PO partition of the residue:

- **(a) 3 dirty `model.name` units** — sourced from `## Extension 2`, `##
  Extension 3`, `## Extension 4` blocks in `requirements.md`. The migration
  that populated their `model.name` carried the `##` prefix into the stored
  value. The data-source switch alone can't help — the source IS dirty. Fix:
  re-migrate (or in-place patch) the 3 entries.
- **(b) 12 reqs in S10-S16** — not yet migrated to the scenario index at all.
  Path forward = **T128.2** (broader migration batch). NOT folded into T164.
- **(c) `firstLine()` fallback harden** — defense in depth: any consumer that
  still falls back to `firstLine()` (e.g., sample with empty `model.name`,
  legacy caller) should skip `##` / `###` / `# ` / `---` prefix lines and pick
  the next speaky line. This is the strip-rule T162 originally proposed —
  reintroduced here as a fallback (NOT as the primary fix; the primary fix
  remains the data-source switch from T163).

PO folds (a) + (c) into T164 for a quick close to 41/41. T128.2 handles (b)
separately. T165 (the renumbered tree-coverage task) is unaffected.

## Intention

### Why this task exists
T163's data-source switch is correct but its scope didn't cover dirty source
data or fallback hardening. Without T164, the 3 Extension-2/3/4 units remain
visibly broken on `/trace`, and the firstLine() fallback can still leak MD for
any consumer that still hits it.

### Problems this task solves
- 3 `model.name` units in the scenario index carry `##` prefixes (sources of /trace UI breakage)
- `firstLine()` has no MD-prefix skip rule — any fallback path still leaks

### How it solves them
- (a) One-shot migration / patch script normalizes `model.name` for the 3 units (strip leading `##`/`###`/`# `/`---` + whitespace; choose the speaky content)
- (c) `firstLine()` skips MD heading + horizontal-rule prefix lines, picks the next speaky line; existing T161 behavior (skip blockquotes) preserved

## Acceptance Criteria
- [ ] AC1 (path a) — The 3 dirty `model.name` units (sourced from `## Extension 2/3/4`) have clean speaky names; the `##` / `---` prefix is gone from stored `model.name`
- [ ] AC2 (path a) — Re-migration is idempotent: re-running doesn't double-strip or otherwise corrupt; same input → same output
- [ ] AC3 (path c) — `firstLine()` returns clean speaky content for inputs starting with `## Heading`, `### Heading`, `# Heading`, `---` separators (in any combo with blank lines + blockquotes T161 already handles)
- [ ] AC4 (path c) — T161 behavior preserved: blockquote-skip still works; speaky-name selection unchanged
- [ ] AC5 — Tester re-runs the T163 verify suite: **41/41 clean** for the units T164 covers (the 3 Extension units now clean; the 12 S10-S16 reqs remain pending T128.2 and are reported separately)
- [ ] AC6 — No regression on T158 / T160 / T161 / T163; `/trace` chain audit clean for in-scope units
- [ ] AC7 — `npm run build` succeeds; all existing tests pass
- [ ] AC8 — **Rule-pair (a)+(b) [learnings #15+#16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set; (c) STATIC_SHELL exempt (no new route)

## Test Scenarios
File: extend `test/vitest/trace-consistency.test.ts` (T161 surface) + a migration smoke test.

| Test | Action | Expected |
|------|--------|----------|
| TS1 (a) | Read scenario index for the 3 Extension-2/3/4 requirements pre-migration | `model.name` contains `##` / `---` prefix (baseline) |
| TS2 (a) | Run migration; re-read same 3 units | `model.name` clean — no leading `##` / `###` / `# ` / `---`; speaky content preserved |
| TS3 (a) | Run migration twice (idempotency) | Second run is a no-op; data unchanged |
| TS4 (c) | `firstLine("## Some title\n…")` | Returns `Some title` (or per architect: the next speaky line) |
| TS5 (c) | `firstLine("---\n## Title\n…")` | Returns `Title` |
| TS6 (c) | `firstLine("> Tron quote\n## Heading\nProse")` | Per T161 + new strip rule: picks first speaky non-blockquote-non-MD-prefix line |
| TS7 | Tester re-runs T163's 41-unit audit | 26+3 = 29/41 in-scope clean (3 Extension units now clean); 12 S10-S16 still pending T128.2 |
| TS8 | Visual on `/trace` for the 3 Extension units | Clean titles; no `##` / `---` |
| TS9 | Rule-pair post-bump | New CACHE_NAME activates; fixes reach device |

## Dependencies
- **Requires:** T163 (shipped — data-source switch; T164 closes the residual on top of it), T161 (shipped — firstLine() helper this task hardens)
- **Coordinate-with:** **T128.2** (path b — broader S10-S16 migration batch; NOT folded here)
- **Enables:** clean /trace titles for all in-scope units; firstLine() fallback safety net

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** anchors the verbatim tester finding (T163 partial 26/41; 3 dirty source units listed by name); confirms scope split with PO (a)+(c) in T164, (b) in T128.2.
2. **robbin-architect** designs path (a) re-migration approach + path (c) firstLine() fallback strip rule; writes the Design section.
3. **robbin-expert** implements both paths in one commit-set; carries the rule-pair (a)+(b).
4. **robbin-tester** runs TS1-TS9 + visual sweep + chain audit (in-scope units); commits the verification report into this file's QA Audit section.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓
- [ ] No regression on T158 / T160 / T161 / T163
- [ ] All 4 roles committed work
- [ ] Tron QA approved
- [ ] T163 status updated from PARTIAL to ✅ once T164 lands (and T128.2 closes (b) separately)

## QA Audit & User Feedback
- 2026-06-02: PO directed planner to stand up T164 immediately. T163 verify showed 26/41 clean; PO 3-path close partition: (a) 3 dirty `model.name` units re-migrate → T164; (b) S10-S16 migration → T128.2 (separate); (c) firstLine() fallback harden → T164. Folds (a)+(c) per PO direction. CMM4 4-role, planner-first. Real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC8 + DoD (learnings #15+#16). Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.

## Subtasks
None (atomic task; two folded paths in one commit-set).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 26 close-out (T163 partial residue)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 2 (quick close to 41/41 for in-scope units; complements T163 + T128.2)*
