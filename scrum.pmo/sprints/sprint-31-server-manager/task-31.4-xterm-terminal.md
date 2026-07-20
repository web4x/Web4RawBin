<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.4: Pane -> interactive default-drawer xterm.js SSH terminal (owner-gated websocket PTY bridge)

[task:uuid:78dc780b-4301-454c-ac56-bf1fca3ce06d]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

In Progress (PO 2026-07-20): DESIGN COMPLETE + STEP-1 BUILT - /tree emits 3-level itemView roots otmuxSession->otmuxWindow->otmuxPane (expert cc76c1104 v0.7.90). SCOPE CHANGE (Tron): terminal is now FULL-INTERACTIVE ssh - the READ-ONLY-by-construction default is REMOVED (read-only ACs + 'Take Control' toggle no longer apply; ACs need req re-refine). Remaining: full xterm.js interactive PTY bridge over owner-gated ws (R31.2 ticket).

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement `[requirement:uuid:fb14fdbf-3ba4-48fa-b098-748fc0e278c2]`
  - down
    - [UC](./planning.md) `[uc:uuid:fa1845d3-88e2-4c9b-9618-f427fc262b56]`

## Task Description

Selecting a pane opens a full read-write interactive terminal IN THE DEFAULT DRAWER (rb-detail-drawer) bound to that pane with real bidirectional I/O (type + live output), keys, resize and scrollback. Frontend = xterm.js (the engine VS Code's terminal uses); backend = a PTY bridge over a websocket that attaches to the tmux pane (e.g. tmux attach -t <target> / pipe-pane), owner-gated at the handshake (R31.2). Close returns to the tree. HIGH-privilege capability - architect owns the auth + PTY bridge model; consider audit-logging attach/detach. ACs marked (arch) pending architect terminal-bridge feasibility confirmation. ARCHITECT FEASIBILITY (design-server-manager.md, 9920f6832): PTY = node-pty spawning a tmux client via a GROUPED session (not pipe-pane); ws gated at UPGRADE by a single-use ~30s owner-bound ticket (browsers cannot set ws headers + auth is post-connect IDENTIFY, so connect-time ticket gating is mandatory - B1); node-pty is a NEW native dep to vet on the WODA.prod build (B2); grouped attach is size-independent so it never disrupts other viewers (B3); architect recommends READ-ONLY default + take-control toggle (B4, PO to confirm). ACs updated accordingly. B4 CONSTRUCTION (d4f7fee8c): read-only default = tmux attach -r + server drops inbound key frames (key frames never reach the pane); 'Take Control' = owner-gated toggle respawning read-write on the SAME grouped session (CONTROL_TAKEN audited); owner-gate + grouped isolation apply to BOTH modes. Acceptance = read-only-blocks-input Test + Take-Control echo-roundtrip/resize/history Test + CONTROL_TAKEN audited. TRON CORRECTION 2026-07-20 (reverses B4): the terminal is FULL read-write INTERACTIVE by DEFAULT - read-only-default + Take-Control REMOVED (was a wrong PO B4 call). AC-readonly-default + AC-take-control dropped; AC-full-interactive added; AC-audit simplified (no mode=read-only / CONTROL_TAKEN). Owner-gate (cookie + ws ticket), node-pty, xterm.js in the default drawer unchanged. PO anchor #48.5. WS AUTH = sm_session COOKIE ALONE (architect clarify 2026-07-20): the same-origin cookie auto-sent on the ws upgrade is the single credential for page+/tree+ws; the earlier ?ticket= is SUPERSEDED - builders must NOT add a redundant ticket on top of the cookie. TRON DEVICE-FEEDBACK SHARPEN 2026-07-20 (IMG_4597, v0.7.93 SW-active): the terminal WORKS end-to-end on Tron's iPhone (owner-cookie->ws->node-pty attach PROVEN, sm_p175 status line, live output) - MECHANISM ACs (owner-gate, node-pty, full-interactive) PASSED and are UNCHANGED. PRESENTATION was wrong: rendered as a bespoke CENTERED fullscreen OVERLAY with NO close. SHARPEN (UX, not mechanism): mount xterm.js inside the DEFAULT rb-detail-drawer (reuse its open/close/minimize/grab-bar + expand), LEFT-ALIGN the terminal content, drop the bespoke overlay. 'Fullscreen' = drawer expanded, not a chromeless overlay. AC-fullscreen-open reframed to drawer-mount, AC-close-returns sharpened to the drawer's standard close, AC-drawer-left-aligned added; AC-full-interactive tail de-'fullscreen'ed. Route: architect designs xterm-in-drawer (fit/resize + ws PTY lifecycle on drawer open/close) -> expert implements + version-bump -> tester catches on real WebKit. TRON DRY-SHARPEN 2026-07-20: the drawer hosting the terminal must behave IDENTICALLY to the /trace drawer (scroll + handle/grab-bar default + expand/minimize) by REUSING the SAME detail flow (DRY), NOT a forked showElement path - RETIRE showElement as the mount mechanism; preserve the in-room / terminal-specific differences (xterm content + ws PTY attach/detach lifecycle). Grounded: showElement (rb-detail-drawer.ts:243 / server-manager.ts:70) is the forked bespoke mount that already regressed (a fresh /server-manager drawer lacked chrome, detailPanel did not lazy-render); the /trace flow (renderDetailForRef) carries the full grab-bar/scroll/expand/minimize chrome. +AC-dry-detail-flow. Route: architect designs the shared-flow reuse (mount terminal via the /trace detail path, retire showElement) -> expert implements + version-bump -> tester catches (terminal drawer == /trace drawer behavior: scroll/grab-bar/expand/minimize; /trace unregressed). TRON CLARIFICATION 2026-07-20 (scenario-first gap - reached architect as a design dispatch but was never in the ACs; captured now): DRAWER FINAL SPEC = floating OVERLAY bottom-drawer like /trace in PORTRAIT (NOT the embedded-below-the-tree v0.7.97 rendering), Details-compartment INLINE in LANDSCAPE; positioning != function, crossRef R31.5. +AC-drawer-overlay-spec. RESOLVED (PO ruling 2026-07-20): drawer = FLOATING OVERLAY like /trace, CONFIRMED. Tron IMG_4605 ('embedded below tree... DIFFERENT than in traceability') was the COMPLAINT, not a spec option: the drawer must be CONSISTENT with /trace, and /trace's drawer is a floating bottom OVERLAY. The v0.7.97 embedded-below-inline was a BUG (the SM page appended to body instead of reproducing /trace's .trace-page container); architect final spec 4d158dd87 fixes it (same container + mount as trace-page.ts -> overlays like /trace). AC-drawer-overlay-spec is FINAL (floating overlay portrait / Details-compartment inline landscape; positioning != function, crossRef R31.5).

## Context

designRef: scrum.pmo/sprints/sprint-31-server-manager/design-server-manager.md (architect 9920f6832 + d4f7fee8c). Owner token 41ad88c4-4dee-49ac-afcb-8a2026657b2d (Marcel Donges). Sprint 31 Server Manager = owner-gated infra console (otmux tree + xterm.js terminal).

## Intention

R31.4 = the interactive terminal (highest risk: ws PTY + xterm.js). Build LAST, on the R31.2 gate + R31.3 tree.

## Acceptance Criteria

- [ ] Selecting a pane node opens the terminal mounted INSIDE the app's DEFAULT detail drawer (rb-detail-drawer) - the SAME drawer every other detail view uses - NOT a bespoke centered fullscreen overlay floating over the app. 'Fullscreen' from the original vision = the drawer EXPANDED to its large state, still chromed by the drawer (grab-bar + close/minimize), never a separate chromeless overlay. Tron device 2026-07-20 (IMG_4597): "why is the shell an overlay? when its an overlay why is it not in the default drawer?"
- [ ] The terminal mounts by REUSING the SAME detail-drawer flow that /trace uses (one shared open/chrome path - the rb-detail-drawer detail flow, e.g. renderDetailForRef's chrome), so the terminal drawer behaves IDENTICALLY to the /trace drawer: same scroll, same handle/grab-bar default (open-minimized peek -> grab-bar -> expand), same expand/minimize/close affordances. It MUST NOT be a forked path that re-implements or bypasses the drawer chrome. showElement is RETIRED as the mount mechanism (DRY - one detail flow, not two; showElement already regressed by shipping a chrome-less fresh drawer). The in-room / terminal-specific differences are PRESERVED: the xterm.js content and the ws PTY attach-on-open / detach-on-close lifecycle - DRY applies to the drawer MECHANISM, not to erasing the terminal's own behavior. Tron DRY directive 2026-07-20.
- [ ] DRAWER FINAL SPEC (positioning != function): in PORTRAIT the drawer is a FLOATING OVERLAY bottom-drawer exactly like /trace's (CONSISTENT with /trace), NOT embedded/stacked-inline below the tree (the embedded-below rendering in v0.7.97 was a BUG - the SM page appended to body instead of reproducing /trace's .trace-page container; architect final spec 4d158dd87). In LANDSCAPE the drawer is the Details compartment INLINE in the layout. IDENTICAL function, two positions - one component, not a fork (crossRef R31.5 positioning != function). The terminal - and any drawer viewer - rides this one drawer.
- [ ] The terminal content and prompt are LEFT-ALIGNED within the drawer (a terminal is left-aligned by nature) - no inherited text-align:center / margin:auto / flex-centering on the terminal container. Tron device 2026-07-20 (IMG_4597): the output + prompt rendered horizontally CENTERED, which is wrong for a terminal.
- [ ] The terminal has real bidirectional I/O: typed input reaches the pane and the pane's live output streams back (xterm.js frontend over a websocket PTY bridge).
- [ ] Keystrokes, resize and scrollback all work: resize is native (xterm onResize -> ws -> pty.resize) and size-independent (grouped attach does not clobber other viewers); live scrollback = xterm's own buffer (~5000 lines) plus a one-shot capture-pane -S preamble for pre-attach history (NOT infinite copy-mode).
- [ ] The PTY websocket is owner-gated at the UPGRADE by the sm_session COOKIE: the browser auto-sends the same-origin sm_session cookie on the ws upgrade and the server validates it against the owner token; a request with no / invalid / non-owner cookie returns 403 and the socket NEVER opens. ONE credential - the sm_session cookie - gates the page + /tree + ws; the earlier single-use ?ticket= is SUPERSEDED by the cookie (B1). NOT a post-connect check.
- [ ] The terminal is closed/minimized via the drawer's STANDARD affordance (rb-detail-drawer close / minimize / grab-bar - the same control all detail views use), NOT a bespoke overlay with no close. Closing detaches the PTY cleanly (kills the sm_ grouped session) and returns to the otmux tree (R31.3). Tron device 2026-07-20 (IMG_4597): "how do i close the overlay (no issue if its in the default drawer)."
- [ ] Audit via addLog + data/logs/server-manager-<date>.log, one structured line each: ATTACH, DETACH(duration,bytes), DENY(kind,path,tok8,ip). Denials are ALWAYS logged.
- [ ] The PTY bridge is node-pty spawning a tmux CLIENT (the PTY is the tmux client, so keys/resize/TUI are native) attaching via a GROUPED session (tmux new-session -t <target> + select-pane) so it does NOT resize or steal the primary view from other agents; the sm_ grouped session is killed on detach. pipe-pane (output-tee only) does NOT satisfy interactive and is rejected. Per architect design-server-manager.md (9920f6832).
- [ ] Attaching a pane MUST NOT disrupt other viewers of that pane: the grouped/size-independent attach leaves Tron's other agents' view of the pane unchanged (no resize, no steal); detach cleans up the sm_ session.
- [ ] The terminal is a FULL read-write INTERACTIVE ssh session BY DEFAULT - no read-only mode, no Take-Control gate (Tron correction 2026-07-20 of the earlier B4 read-only-default). Owner-gated by the sm_session COOKIE at the ws upgrade (browser auto-sends it same-origin; NO separate ticket), node-pty attach to the tmux pane, xterm.js mounted in the expanded default drawer; keystrokes reach the pane immediately from open.

## Implementation

DESIGN COMPLETE (design-server-manager.md ## R31.4: 3-type otmuxSession/otmuxWindow/otmuxPane model + fullscreen terminal). BUILD IN PROGRESS (expert building now, implementing[~]): node-pty grouped-session PTY bridge + xterm.js frontend + ticket-gated ws UPGRADE + read-only-default. Highest design risk (owner-gated interactive terminal).

## Subtasks

None (atomic task).
