<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.4: Pane -> interactive fullscreen xterm.js SSH terminal (owner-gated ws PTY bridge, read-only default)

[task:uuid:78dc780b-4301-454c-ac56-bf1fca3ce06d]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement `[requirement:uuid:fb14fdbf-3ba4-48fa-b098-748fc0e278c2]`
  - down
    - [UC](./planning.md) `[uc:uuid:fa1845d3-88e2-4c9b-9618-f427fc262b56]`

## Task Description

Selecting a pane opens a FULLSCREEN interactive terminal bound to that pane with real bidirectional I/O (xterm.js frontend over a websocket PTY bridge). node-pty spawns a tmux CLIENT via a GROUPED session (does NOT resize/steal other viewers). DEFAULT attach is READ-ONLY by construction (tmux attach -r + server drops key frames); 'Take Control' respawns read-write. Owner-gated at the ws UPGRADE via single-use ~30s ticket (R31.2). Highest design risk.

## Context

designRef: scrum.pmo/sprints/sprint-31-server-manager/design-server-manager.md (architect 9920f6832 + d4f7fee8c). Owner token 41ad88c4-4dee-49ac-afcb-8a2026657b2d (Marcel Donges). Sprint 31 Server Manager = owner-gated infra console (otmux tree + xterm.js terminal).

## Intention

R31.4 = the interactive terminal (highest risk: ws PTY + xterm.js). Build LAST, on the R31.2 gate + R31.3 tree.

## Acceptance Criteria

- [ ] Selecting a pane node opens a FULLSCREEN terminal bound to that pane's tmux target.
- [ ] The terminal has real bidirectional I/O: typed input reaches the pane and the pane's live output streams back (xterm.js frontend over a websocket PTY bridge).
- [ ] Keystrokes, resize and scrollback all work: resize is native (xterm onResize -> ws -> pty.resize) and size-independent; live scrollback = xterm's ~5000-line buffer + a one-shot capture-pane -S preamble for pre-attach history.
- [ ] The PTY websocket is owner-gated at the UPGRADE via a single-use ~30s TICKET (R31.2 guard); an invalid/absent/expired/reused ticket returns 403 and the socket NEVER opens. NOT a post-connect token check.
- [ ] Closing the terminal detaches cleanly and returns to the otmux tree (R31.3).
- [ ] Audit QUAD via addLog + data/logs/server-manager-<date>.log: ATTACH(mode=read-only), CONTROL_TAKEN, DETACH(duration,bytes), DENY(kind,path,tok8,ip). Denials are ALWAYS logged.
- [ ] The PTY bridge is node-pty spawning a tmux CLIENT via a GROUPED session (tmux new-session -t <target> + select-pane) so it does NOT resize/steal the primary view; the sm_ grouped session is killed on detach. pipe-pane (output-tee only) is rejected.
- [ ] Attaching a pane MUST NOT disrupt other viewers of that pane: the grouped/size-independent attach leaves other agents' view unchanged; detach cleans up the sm_ session.
- [ ] Terminal DEFAULT attach is READ-ONLY BY CONSTRUCTION: tmux attach -r AND the server drops inbound key frames - key frames MUST NOT reach the pane in read-only mode. Testable: read-only-blocks-input.
- [ ] 'Take Control' is an owner-gated toggle that respawns the attach READ-WRITE on the SAME grouped session (echo-roundtrip, resize, history); the transition is audit-logged CONTROL_TAKEN. Interactive keystrokes reach the pane ONLY after Take Control.

## Subtasks

None (atomic task).
