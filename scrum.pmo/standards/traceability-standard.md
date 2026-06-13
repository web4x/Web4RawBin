# RawBin Traceability Standard

**Source:** Tron directive 2026-05-25. Derived from [Web4Articles planning standard](https://github.com/web4x/Web4Articles/tree/main/scrum.pmo/sprints/).
**Author:** robbin-req (requirements engineer)

## Purpose

Every artifact must be traceable through the **LOCKED 6-step canonical chain** (corrected 2026-06-08; was 7-step with Task in chain — Task is NAVIGATION, not chain). UUID tags and IOR references are the mechanism. This document defines the chain, where each UUID lives, and how they cross-reference.

## The Traceability Chain — LOCKED 6-Step

**Canonical chain order** (corrected 2026-06-08 per Tron audit):

```
Requirement → UseCase(s) → Class → Method → Implementation → Test(s)
```

**Task is NOT in the chain.** Task is in the NAVIGATION layer: Sprint → Task → coveredRequirements → [chain starts at Requirement].

- **Atomic requirements are CHAIN ROOTS** — the forward-only traceability chain starts at requirements (Requirement.useCases[]) and walks to tests. In the browser tree, Sprint is the NAVIGATION ROOT; requirements appear as children of their covering Task (Sprint→Task→coveredReqs→chain). See R18.8.
- **Forward-only**: links point DOWN the chain (no back-refs in the graph).
- **Plural hops**: UseCase(s) and Test(s) are 1:N branching points. Implementation:Test is 1:N.
- **Tree walk**: `/api/trace/children/<uuid>` follows FORWARD_KEYS per class type.
- **Navigation walk**: Sprint→Task→coveredRequirements uses NAVIGATION_KEYS (separate from chain).
- **Chain audit**: every Test node must be reachable from a Requirement root via the 6-step chain.

### UUID marker chain

```
[requirement:uuid:<v4>] in requirements.md        ← ROOT
  ↓
[task:uuid:<v4>] in task-N.md                     ← Step 2
  ↓
[uc:uuid:<v4>] in <<UseCase>> PUML class          ← Step 3 (1:N)
  ↓
[class:uuid:<v4>] in scenario unit                ← Step 4
  ↓
Method scenario unit (verb)                       ← Step 5
  ↓
// [impl:uuid:<v4>] in source .ts file            ← Step 6
  ↓
// [test:uuid:<v4>] in test .ts file              ← Step 7 (1:N)
```

## UUID Tag Formats

| Tag | Where it lives | What it identifies |
|-----|---------------|-------------------|
| `[requirement:uuid:<v4>]` | `requirements.md` — inline after requirement text | A single requirement derived from Tron |
| `[task:uuid:<v4>]` | Task file — dedicated line near top, below title | A main task |
| `[subtask:uuid:<v4>]` | Subtask file — dedicated line near top, below title | A subtask of a main task |
| `[uc:uuid:<v4>]` | PlantUML `.puml` file — in use case label or note | A use case in a diagram |
| `[class:uuid:<v4>]` | PlantUML `.puml` file — in class label or note | A class/interface in a diagram |
| `[impl:uuid:<v4>]` | Source `.ts`/`.sh` file — comment on function/method | Implementation of a requirement |
| `[test:uuid:<v4>]` | Test file — comment on test case | Verification of a requirement |

## File Structure Requirements

### requirements.md (per sprint)

Every sprint MUST have a `requirements.md` file listing requirements with UUID tags:

```markdown
[Back to Planning](./planning.md)

# Sprint N — Requirements

- [ ] Requirement description
  [requirement:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx]
  > Tron literal quote (if available)
  → [Task N](./task-N-slug.md)
```

Each requirement entry has:
1. Checkbox for completion tracking
2. One-line description
3. `[requirement:uuid:<v4>]` on its own line
4. Optional Tron quote in blockquote
5. Forward link to the implementing task

### Task files

Every task file MUST have:

```markdown
[Back to Sprint N Planning](./planning.md)

# T<N>: Task Name

[task:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [requirement:uuid:xxx](./requirements.md) — requirement text
  - [Sprint N Planning](./planning.md)
- down
  - [T<N>.1: Subtask](./task-N.1-slug.md) (or "None (atomic task)")
- changes
  - [T<M>](./task-M-slug.md) AC<X> — what it changes (if applicable)
```

### Subtask files

Same as task files but use `[subtask:uuid:<v4>]` and traceability `up` links to BOTH the requirement AND the parent task.

### PlantUML diagrams

Use case and class elements should carry UUID annotations:

```plantuml
usecase "room.create\n[uc:uuid:xxx]" as UC1
class "Room\n[class:uuid:xxx]" as Room
```

### Source code

Implementation functions carry a comment with the requirement/task UUID they satisfy:

```typescript
// [impl:uuid:xxx] UC-RM.1 room.create
function createRoom(name: string, creator: RoomMember): Room {
```

### Test files

Test cases carry a comment linking to what they verify:

```typescript
// [test:uuid:xxx] AC1: room creation creates folder
it('creates room directory', () => {
```

## Cross-Reference Rules

1. **Every requirement MUST link forward** to at least one UseCase via `useCases[]` (chain). Requirements also have `tasks[]` for navigation (which tasks cover this requirement) but `tasks[]` is NOT a chain link.
2. ~~**Every task MUST link up** to a requirement~~ **REMOVED (T159/B18)** — tasks do NOT store back-refs to requirements. Forward chain FROM requirements is the sole truth.
3. ~~**Every subtask MUST link up** to both a requirement AND its parent task~~ **REMOVED (T159/B18)** — same principle. Subtasks are reached via `task.subtasks[]` forward array.
4. **PlantUML elements SHOULD carry UUIDs** for elements that map 1:1 to requirements or tasks
5. **Source code implementations SHOULD carry UUIDs** for key functions that implement specific requirements
6. **Test cases SHOULD carry UUIDs** linking to the acceptance criteria they verify

MUST = mandatory for new work. SHOULD = recommended, add during refactoring.

## Prohibited Fields on Non-Requirement Units (T159/B18 + T169 Architect Decision)

Non-requirement units (Task, UseCase, Class, Method, Implementation, Test) MUST NOT have:
- `requirements[]` — back-reference to parent requirement
- `requirement` — singular back-reference
- `links.up` — generic upward pointer

These are back-references. The forward chain is the sole truth. To answer "which requirement traces to this task," walk ALL requirements' `tasks[]` arrays — do not store the reverse pointer.

**Empty `requirements[]` is CORRECT.** Strip the field entirely if present.

## Forward-Only Verification (replaces Bidirectional Verification)

To verify the chain is complete, check:

```bash
# All requirements have forward links to tasks
grep "requirement:uuid:" requirements.md | wc -l  # count requirements
grep "→ \[Task" requirements.md | wc -l            # count forward links (should match)

# All tasks have upward links to requirements
grep "requirement:uuid:" task-*.md | wc -l          # should match requirement count

# All PlantUML elements with UUIDs have corresponding tasks
grep "uc:uuid:" diagrams/*.puml | wc -l             # count annotated elements
```

## Naming Conventions (Web4Articles standard)

| Artifact | Convention |
|----------|-----------|
| Sprint directory | `sprint-<N>-<slug>/` |
| Planning file | `planning.md` |
| Requirements file | `requirements.md` |
| Main task file | `task-<N>-<slug>.md` |
| Subtask file | `task-<N>.<M>-<role>-<slug>.md` |
| Diagrams directory | `diagrams/` |
| PlantUML source | `diagrams/<name>.puml` |
| Rendered diagram | `diagrams/<name>.svg` |

## Source-Location IOR (Sprint 17 — R17.24)

Every UseCase, Class, and Method scenario unit tracks its exact source location with a git-commit anchor. This makes traceability point-in-time-precise and survives refactors.

### IOR Format

```
ior:file:<repo-relative-path>?commit=<short-sha>&lines=<start>-<end>
```

- `path`: relative to repo root (e.g. `scrum.pmo/sprints/sprint-9/diagrams/use-cases.puml`)
- `commit`: short SHA (7+ chars) of the git commit when the location was recorded
- `lines`: 1-indexed, inclusive range (e.g. `42-55`)

### Examples

```
ior:file:scrum.pmo/sprints/sprint-9/diagrams/use-cases.puml?commit=9bf3363&lines=42-55
ior:file:src/ts/server/Room.ts?commit=a7cb624&lines=71-300
ior:file:src/ts/server/server.ts?commit=0663495&lines=838-857
```

### Where Source IORs Live

In the scenario unit's `model.source` field:

```json
{
  "ior": "ior:scenario:uuid:<uuid>",
  "model": {
    "name": "room.create",
    "type": "UseCase",
    "source": {
      "file": "scrum.pmo/sprints/sprint-9/diagrams/use-cases.puml",
      "lines": [42, 55],
      "commit": "9bf3363",
      "repo": "Web4RawBin",
      "ior": "ior:file:scrum.pmo/sprints/sprint-9/diagrams/use-cases.puml?commit=9bf3363&lines=42-55"
    }
  }
}
```

### Source Type by Class

| Scenario Class | Source file type | Location method |
|---------------|-----------------|-----------------|
| UseCase | `.puml` (use case diagram) | Line range of `usecase "..." as UC_X` block |
| Class | `.puml` (class diagram) or `.ts` | Line range of class declaration |
| Method | `.ts` (source code) | Line range of function/method declaration |
| Requirement | `.md` (requirements.md) | Line of `[requirement:uuid:]` tag |
| Task | `.md` (task file) | Whole file (line 1 to EOF) |

### Git Anchor Resolution

To view the exact content at the recorded commit:
```bash
git show <commit>:<path>
```
To extract the specific lines:
```bash
git show <commit>:<path> | sed -n '<start>,<end>p'
```

### Capture at Migration Time

```bash
# Latest commit that touched the file
git log --format=%h -1 -- <path>

# Current HEAD (fallback)
git rev-parse --short HEAD
```

## Chain-Link Icon Convention (Sprint 17 — R17.25 / T141)

Generated MD and HTML views render navigation icons for traceability:

### Icon Placement

```
🔗 ✏️ <Title>
 │   │
 │   └── Edit link → /edit/<path> (Monaco editor)
 └────── Chain link → scenario/sprints.json/<sprint>/<speaking-name>.json
```

The 🔗 chain-link icon appears BEFORE the ✏️ edit icon on every generated view. It links to the symlink in the speaking-name JSON tree (`scenario/sprints.json/`), not the raw UUID index.

### Applies to All 7 Classes

Every generated MD/HTML view template renders the chain-link:
UseCase, Class, Method, Task, Requirement, Sprint, TraceLink.

### Link Target

The chain-link href resolves to:
```
/md/scenario/sprints.json/<sprint-name>/<speaking-name>.json
```
This serves the raw scenario JSON via the existing `/md/` file browser, letting the user inspect the underlying data that generated the view.

## Adoption Plan

- **New sprints (Sprint 10+):** Full compliance — requirements.md, task UUIDs, traceability sections, PlantUML annotations
- **Existing sprints (1-9):** Retrofit during remediation sprint — add requirements.md where missing, verify UUID presence, add missing traceability links
- **Source code:** Add `[impl:uuid:]` comments incrementally as code is touched
- **Tests:** Add `[test:uuid:]` comments incrementally as tests are written/modified
- **Source-location IOR:** Add `model.source` to scenario units during migration (T128) and incrementally as units are created
- **Chain-link icons:** Added to view templates by T141; applies automatically to all generated views thereafter

## Strict Verify Bar (PO directive 2026-06-03 — root fix for "audit clean but Tron sees broken")

A task or sprint is **not "verified"** until BOTH of the following are asserted:

### (1) FULL semantic chain — per-Test 6-hop reachability

The chain must be asserted **end-to-end at the individual Test level**, not as
a node-count proxy. Every Test instance MUST be reachable from a Requirement
root via the **full 6-step canonical chain** (corrected 2026-06-08; Task is navigation, not chain):

```
requirement → usecase(s) → class → method → implementation → test
```

A "metrics-pass" of total reachable nodes (e.g. 238/238 units) is NOT sufficient
when the unit-set includes ancestors but the leaf Tests are unreached. The audit
MUST iterate every Test instance and assert `walkUp(test)` terminates at a
Requirement (`chainPosition.above === null`), with intermediate hops resolving
through each canonical type. Any Test that fails this walk = the chain is broken
for that Test = verification FAILS.

### (2) LIVE user experience reproduction (headless)

Tester reproduces the actual user-visible behaviour against the running app
(headless Playwright on the isolated test server, T100), not just unit-test
counts. For every browser-behaviour AC: the route renders, the DOM mutates as
specified, the chain-depth visible in `/trace` and `/scenario` matches the data
side. "All unit tests green" is necessary but not sufficient.

### (2b) SW-ACTIVE verification (PO directive 2026-06-03 — added after T179 root cause)

For any task that touches `sw.js`, `STATIC_SHELL`, the build manifest, or any
PWA-served route: tester MUST verify WITH SW ACTIVE — not bypassing the SW by
hitting the server directly. The flow:

1. Headless Playwright registers the SW (`navigator.serviceWorker.register(...)`)
2. Awaits SW `activated` state
3. Reloads the route so the now-active SW serves the response
4. Asserts the user-visible behaviour AND that no 404s landed in the SW cache

**Gap that hid the T179 bug:** tester previously checked routes against the
running server (bypassing the SW). That returned the server's fresh
`/dist/app-<hash>.js`. But the SW had cached the 404 from `/dist/app.js`, so
end-users got the cached 404 even though the server was fine. SW-active
verification closes this gap. Apply to every PWA / SW-touching task.

### CI Gate (extension to T170 `trace:audit:strict`)

T170's `trace:audit:strict` MUST be extended (T178 lands the data; T170-follow-on
extends the assertion) to fail if any Test is `< 7-hop reachable` from a
Requirement root via the LOCKED chain order. The script reports per-Test
reachable-depth + the offending Test UUIDs; CI fails on any depth `< 7`.

```bash
# trace:audit:strict — required new assertion (T178/T170 follow-on):
#   For each Test in the scenario index:
#     depth = walkUp(test).length
#     require depth === 7   # test→impl→method→class→uc→task→requirement
#     require walkUp(test).pop().chainPosition.above === null  # ends at a Requirement
#   Fail with count + uuid list if any test is < 7-hop reachable.
```

### Why this rule exists

Incident (2026-06-03): T172 achieved 238/238 unit reachability — looked clean —
but the underlying data had UC/Class/Method/Impl/Test forward arrays empty,
leaving 44 Tests as "chain gap" when walked end-to-end. The 238/238 metric was
counting units, not chain depth. T172 was a real win (Sprint→Task→Subtask layer
populated); but R-J ("every Test reachable") and R-E ("chain starts with atomic
requirements") demand the full 7-hop assertion. T178 lands the data fill; the
strict-verify-bar prevents the next class of "metrics-pass-but-gapped" closures.

Apply this bar to every task closure that involves traceability-chain claims.
Audit-only / unit-test-count / node-count "verifications" do not satisfy it.

## Implementation Marker Validity (SM ruling 2026-06-14)

An `[impl:uuid:]` marker MUST mark a **named method body** — a function or method declaration with an identifier that the Method scenario unit names.

**VALID markers (named method body):**
```typescript
// [impl:uuid:xxx] RbDetailDrawer.filePreview
private async filePreview(uuid: string): Promise<void> { ... }
```

**INVALID markers (not a named method):**
- CSS attributes: `touch-action: pan-y` — declarative, no method body
- Template literals: `` `<rb-trace-tree data-seed-ior="${id}">` `` — declarative wiring
- Inline expressions: `await customElements.whenDefined('rb-object-item')` — single API call
- Anonymous closures: `(e) => { ... }` — no named method to chain to

**When a behavior is NATURALLY DECLARATIVE** (CSS, template attribute, one-liner, config), it is:
- **Functional-done** — the behavior works, shipped, tested
- **Not champagne-chainable** — no honest Method→Impl hop exists
- Classified as `functionalDone: true, champagneChainable: false` on the Requirement unit
- NOT counted in the champagne score, NOT a failure — an honest category

This prevents artificial method extraction solely to game the champagne count.
The Method node in the 6-step chain is MANDATORY — markers on non-method code are incomplete.

## Refinement-Cluster Rule (SM ruling 2026-06-14)

Multiple requirements MAY share one Method/Impl ONLY when they describe ONE refined behavior-family — i.e., the requirement texts confirm they are the SAME behavior at different specificity levels (e.g., R19.8 "keep offline" + R19.8.A "persist offline state" = same retain behavior).

A requirement with a DISTINCT behavior MUST have its OWN Method/Impl chain, even if the code lives in the same Class. Sharing a method across distinct behaviors is a mis-wire — it inflates one chain and orphans another.

**The R19.8.B lesson:** R19.8 = "retain on disconnect" (markDisconnected). R19.8.B = "rejoin flips online, never adds duplicate" (addMember dedup). These are DISTINCT behaviors on the same Class (Room). R19.8.B was mis-wired to R19.8's UC (retainOnDisconnect) — its genuine method is addMember, not retainOrPrune. Re-modeling R19.8.B to its own UC (room.rejoinDedup → Room.memberAdd) correctly chains its genuine impl 4c8a91a5.

**Rule:** when a requirement's behavior text does NOT match its UC's method name, the UC is mis-modeled. Re-model to the method that DOES the behavior the requirement describes.

## Duplicate-Requirement Markers (SM ruling 2026-06-14)

When two requirements are ruled SAME behavior (refinement-cluster), the duplicate req's impl marker MUST be REMOVED from source — not left as a mislabeled stray. One behavior = one marker. Stale markers with wrong labels pollute the AST strict-test and risk accidental double-credit.

**The R19.82 lesson:** R19.82 (bug: stale-status blocks rejoin) and R19.8.B (spec: rejoin flips online) were the SAME operation — both markers sat on the same code block in rejoinDedup(). Marker 84910216 ("addMemberTakeover") was mislabeled (method is rejoinDedup, not addMemberTakeover) and duplicated 4c8a91a5. Removed.

## Heads-Must-Name-Match Rule (SM ruling 2026-06-14)

The AST strict-test's "heads" classifier (a marker on the FIRST line of a method body) MUST also verify that the marker's LABEL matches the method's NAME. A marker that heads a method but carries a DIFFERENT label (e.g., `[impl:uuid:xxx] Room.addMemberTakeover` heading `rejoinDedup()`) is INVALID — it passes the position check but fails the identity check.

**Rule:** `classify(markerLine, methodName)` must assert BOTH:
1. **Position:** marker line === method declaration line OR method declaration line + 1 (heads the body)
2. **Name-match:** marker label contains the method name (case-insensitive substring)

Failing either = strict-FAIL. This closes the loophole where a mislabeled marker could pass by position alone.

## Scorer-Explains-Per-Req Rule (SM ruling 2026-06-14)

When the champagne scorer marks a requirement incomplete, it MUST emit the per-req rejection reason (which hop failed, which node, why). "21/N incomplete" without per-req detail is not actionable — the team cannot fix what it cannot see. The scorer's trace output (scripts/trace-req.ts) provides per-hop walk + strict-test result per impl. Use it before asserting a gap.
