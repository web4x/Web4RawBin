# Planner Skill — Drive the WIP=1 chain via the CurrentSprint class (R20.13)

**Owner:** robbin-planner · **Instrument:** `CurrentSprint` class (architect 43d570be, Object.verb) · **Covers:** R20.13 (c559452e)

The planner's PLANNING + DRIVING is no longer ad-hoc planning-doc editing. It is **maintaining the `CurrentSprint` class and driving the team off it.** `CurrentSprint` IS the single source of truth for the ONE active WIP=1 chain. WIP=1 becomes class-enforced, not convention.

## The 3-slot pin model (R20.22)

CurrentSprint maintains 3 task slots, always synced to disk:

| Slot | What | Source | CLI |
|---|---|---|---|
| **current** | The ONE focused WIP=1 task | `task.focus: true` (exactly one) | `focus <task-uuid>` |
| **lastCompleted** | Most recent gate-proven task | Auto-derived (last non-focused task with reqUuid) | (automatic) |
| **nextBacklog** | Next task to work after current | Override or auto (first task without UC chain) | `setNextBacklog <uuid>` / `clearNextBacklog` |

`pinCurrent()` returns all 3 slots + chain state. `/trace` renders the 3-slot pin.

## Full drive API — `node scripts/drive.mjs <verb> [args]`

> Launcher `scripts/drive.mjs` (#102) self-heals to node18+, so it runs from ANY default node (the old `npx tsx scripts/planner-drive.ts` broke on default node16).

**CRITICAL: all uuid arguments require the FULL 36-character uuid.**
A short 8-char prefix returns a MISLEADING "BLOCKED: gate not proven" even when the
gate IS proven (the prefix doesn't resolve to the task, so there's no current chain
to gate-check). Always copy the full uuid verbatim — never reconstruct or truncate.

| Verb | Args | Who calls | What it does |
|---|---|---|---|
| `focus` | `<task-uuid> [--force]` | planner (or any agent on WIP switch) | Set WIP=1 current task, auto-derive chain. BLOCKED unless gate-proven or `--force`. |
| `hop` | `<hop> <status> [agent]` | **every agent on their own hop** | Mark hop status live. Hops: req\|uc\|class\|method\|impl\|test. Statuses: pending\|in-progress\|done\|gate-proven. |
| `gate` | — | anyone | Check if current task's test is gate-proven. Shows per-hop states. |
| `setNextBacklog` | `<task-uuid>` | planner | Pin a specific task as next (Tron's priority). |
| `clearNextBacklog` | — | planner | Revert next slot to auto-derived. |
| `setChain` | `<req> <uc> <class> <method> <impl> <test> "<sprint>" "<task>"` | escape hatch only | Low-level: set chain with 6 explicit IOR refs. |
| `advance` | — | planner | Move activeHop forward (after gate-proven). |
| `pin` | — | anyone | Print pinCurrent() — 3 slots + chain state. |

`pinCurrent()` returns `{sprintName, taskName, chainDepth, wipStatus, slots: {current, lastCompleted, nextBacklog}}`.
Event: `current-sprint-changed` on `document` (client re-render hook).

## Per-agent realtime-set protocol (Tron directive — ALL agents)

**Every agent marks its own hop as it works — the pin reflects real-time who is working what.**

| When | Agent | Command |
|---|---|---|
| Architect starts UC design | architect | `hop uc in-progress architect` |
| Architect finishes Class wiring | architect | `hop class done architect` |
| Expert starts implementing | expert | `hop impl in-progress expert` |
| Expert commits impl + marker | expert | `hop impl done expert` |
| Tester starts writing test | tester | `hop test in-progress tester` |
| Tester passes det-3x + deploy | tester | `hop test gate-proven tester` |
| WIP switches (Tron priority) | planner (or agent directed) | `focus <full-36-char-task-uuid>` |

**Rules:**
1. YOUR hop, YOUR call — don't leave it for planner to backfill (#102).
2. SM flags any hop-completion without the agent's own hop-call.
3. Full 36-char uuid only — never prefix, never reconstruct.

## Planner skill layer (driveNext / status / det-3x gate — ON TOP of the API)

### 1. MAINTAIN — keep all 3 slots synced
- **current**: `focus <task-uuid>` when WIP switches (Tron's priority, L8). Auto-derives chain.
  BLOCKED by proven-or-stay gate (L9) unless `--force`.
- **next**: `setNextBacklog <task-uuid>` when Tron signals the next priority.
  Falls back to auto (first task without UC chain) if not overridden.
- **last**: auto-derived — no manual action needed.
- CurrentSprint is the SINGLE source — do not maintain a parallel planning-doc work-list.

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
