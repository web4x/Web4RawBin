<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 29.1: Self-healing npm start that preserves the interactive server TUI

[task:uuid:2d1a0704-f3db-426c-85b3-963c860a29a2]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 29 Planning](./planning.md)
    - Requirement R29.1 `[requirement:uuid:e25f1437-4273-4fe0-8b26-76249fa15604]`
  - down
    - [UC: serverLifecycle.selfHealingStart](./planning.md) `[uc:uuid:db5835f5-4080-43af-bf7d-e43e2f89d15c]`

## Task Description

npm start is a self-healing one-shot: re-execs on node18+/node22, npm i if deps missing, kills the old server + clean-boots, and PRESERVES the interactive foreground server TUI. Consistent across WODA.prod + WODA.test; restart + TUI-verify runs in the remoteShells otmux session; idempotent fresh restart.

## Context

RETROACTIVE #126 — start.mjs already shipped; Impl is REAL, needs [impl] marker + a Test (TUI-stream-verify in remoteShells:0.2 prod + 0.3 test). Architect designs the chain (Class/Method/Impl for start.mjs). web4x/Web4RawBin repo.

## Intention

Infra/dev-lifecycle (Tron): a robust one-command start that self-heals the node/deps environment WITHOUT losing the server's interactive TUI, identically on prod + test.

## Acceptance Criteria

- [x] (lifecycle) npm start is a self-healing one-shot: re-execs on node18+/node22, npm i if deps missing, kills the old server, builds - the ONLY prerequisite is npm (no node-version/deps assumptions).
- [x] (tui) It PRESERVES the interactive server TUI: the server runs in the FOREGROUND owning the controlling terminal, so the readline TUI + live request-log stream appear in the pane IDENTICAL to a direct tsx server.ts; start.mjs must NOT background/detach the server or swallow stdio.
- [x] (consistency) Behavior is CONSISTENT across WODA.prod + WODA.test - both stream the TUI identically (fixes the regression: test streamed the TUI, prod via start.mjs went silent after boot).
- [x] (consistency) The restart + TUI-verify is performed IN the remoteShells otmux session - remoteShells:0.2 = WODA.prod (npm), remoteShells:0.3 = WODA.test - where the interactive server lives; NOT in agent panes or ad-hoc shells.
- [x] (lifecycle) Each start is an idempotent fresh restart (kill-old -> clean boot); repeated starts leave one fresh server.

## Implementation

STOOD UP (planning) — status Planned; chain-build awaits architect design (Class/Method/Impl for start.mjs) + expert [impl] marker + Test (TUI-stream-verify remoteShells 0.2 prod/0.3 test). Impl code already shipped (start.mjs, retroactive #126). ✓ DONE 2026-07-02: R29.1 COMPLETE 57/318 (PO+skill-expert), TUI regression CLOSED, chain UC db5835f5->StartLauncher(selfHealingStart+runServerForeground)+ServerTUI(setupTUI 02ef2352+addLog c8888f6d, both REAL isTTY-gated) + Impl 329b5473, AC4 TUI-verify gated. #126-retroactive cured by chain.

## Subtasks

None (atomic task).
