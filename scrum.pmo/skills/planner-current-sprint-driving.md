# Planner Skill — Drive the WIP=1 chain via the CurrentSprint class (R20.13)

**Owner:** robbin-planner · **Instrument:** `CurrentSprint` class (architect 43d570be, Object.verb) · **Covers:** R20.13 (c559452e)

The planner's PLANNING + DRIVING is no longer ad-hoc planning-doc editing. It is **maintaining the `CurrentSprint` class and driving the team off it.** `CurrentSprint` IS the single source of truth for the ONE active WIP=1 chain. WIP=1 becomes class-enforced, not convention.

## Consumer API (architect-provided — I call, never re-implement)
- `setChain({req, uc, class, method, impl, test})` — set the WIP=1 chain with IOR refs (the full Req→Test skeleton)
- `getActiveChain() → [{type, uuid, name, status}]` — ordered Req→Test array (read the live chain state)
- `advance()` — move focus to the next hop after the current completes
- `pinCurrent() → {sprintName, taskName, chainDepth, wipStatus}` — feeds the R20.12 /trace pin-row
- Event: `current-sprint-changed` on `document` (re-render hook)

## Planner skill layer (driveNext / status / det-3x gate — ON TOP of the API)

### 1. MAINTAIN — keep CurrentSprint pointed at the real active chain
- On taking a new WIP=1 task: `setChain({...})` with the task's full traceability skeleton (req→UC→Class→Method→Impl→Test IOR refs). This is the planner declaring the canonical chain the team works.
- CurrentSprint is the SINGLE source — I do not maintain a parallel planning-doc work-list. The 6-item queue is the **advance-order**, not a driving surface.

### 2. driveNext — derive each role's next action from the OPEN node
- `getActiveChain()` → find the first node with `status != complete`. That OPEN node's `type` dispatches the role:
  - UC / Class open → **architect** (design/wire)
  - Method / Impl open → **expert** (real named-method impl + marker-in-body + name-match)
  - Test open → **tester** (genuine test, name-match, unique)
- driveNext emits ONE next-action (WIP=1) — never fans work across roles ahead of the chain.

### 3. status — board state from CurrentSprint
- `pinCurrent()` + `getActiveChain()` → report: sprint, task, which node is open, who owns it, chain depth, wipStatus. This replaces hand-written status; the /trace pin-row reads the same source.

### 4. det-3x champagne GATE before advance (the integrity guard, hard-won)
- Before `advance()`, the planner VERIFIES the completing node is GENUINE champagne (not the inflation pattern):
  - real NAMED method + marker IN its body (or heads it) + label name-match + unique-wire + no fake-suffix
  - per-req trace (scripts/trace-req.ts) confirms the node complete (not summary-only)
  - det-3x stable (small batches per burn-mitigation)
  - functionalDone (CSS/template/inline/handler) is NOT champagne → does not advance the chain
- ONLY on genuine-champagne + Tron-QA → `advance()`. The number follows the rule both ways.

## Discipline carried in (learnings #65)
verify-premise-before-edit · diff-full-set-after-restructure · shared-X-needs-req-text · no-mid-flux-measure · number-follows-rule-both-ways · `CurrentSprint` is the instrument, det-3x is the gate.

## Dependency
Architect wires the 4 CurrentSprint UCs (setChain/pinCurrent/advance/getActiveChain) to planner task 15aeb43d. Expert implements the class `.ts`. Then this skill drives the WIP=1 chain live off it.

## Laws enforced (team-laws.md)
- **L4** COMMUNICATE VIA UNITS: setChain/focus writes to singleton on disk
- **L8** WIP=TRON PRIORITY: focus verb = Tron's chosen task, not lowest-open
- **L9** PROVEN-OR-STAY: focus blocked unless gate-proven; hop verb for self-mark
