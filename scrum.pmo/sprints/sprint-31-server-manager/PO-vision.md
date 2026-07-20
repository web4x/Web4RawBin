# Sprint 31 — Server Manager (owner-gated infra console)

**Tron directive (2026-07-20):** user-specific features at the BOTTOM of the profile for user `41ad88c4-4dee-49ac-afcb-8a2026657b2d` (Marcel Donges). ONLY this user gets a new **"Server Manager"** that shows otmux sessions+panes as a tree (like `otmux tree`), lets you select a pane, and opens it in an **interactive fullscreen SSH terminal** (leverage the VS Code / xterm.js terminal engine). **SCENARIO-FIRST forward planning.**

This is a PO VISION SEED. req formalizes the requirement units (UUIDs + UCs); architect designs the hard parts; planner builds the board; expert implements against the units. NO implementation before scenario units land on disk (#126).

## Context (from profile screenshot)
Profile order today: Name → Token → Secret Code → Devices(5) → My Bug Reports(0). Server Manager = a NEW section rendered AFTER "My Bug Reports", visible/accessible ONLY to the owner token above.

## Requirement decomposition (PO ACs — req to formalize as R31.x + UUIDs + UCs)

### R31.1 — User-specific profile features section
- New section at the BOTTOM of the profile view, driven by **per-user feature grants** keyed to the user token/UUID (generic + extensible so future owner-features slot in).
- Renders ONLY the features granted to the *viewing* user. For non-owners it is absent entirely.
- First feature entry = "Server Manager" (granted only to `41ad88c4-…`).

### R31.2 — Owner-only access gate (BY CONSTRUCTION, server-side)
- Server Manager UI **and every backing API/websocket** are restricted to token `41ad88c4-4dee-49ac-afcb-8a2026657b2d`.
- Enforced SERVER-SIDE on every endpoint + on the websocket handshake — the authenticated user's token is checked; anyone else gets 403, never reaches otmux/terminal APIs. UI-hiding alone is NOT acceptance.
- Correct-by-construction: a single owner-guard the endpoints share, not per-call ad-hoc checks.

### R31.3 — otmux session/pane tree
- Server Manager main view = a live tree: sessions → windows → panes (mirrors `otmux tree`). Read server-side via otmux.
- Refreshable; each pane node selectable; show pane title/target so Tron knows which agent pane it is.

### R31.4 — Pane → interactive fullscreen SSH terminal
- Selecting a pane opens a FULLSCREEN interactive terminal bound to that pane: real bidirectional I/O (type + live output), keys/resize/scrollback.
- Frontend = **xterm.js** (the engine VS Code's terminal uses). Backend = a PTY bridge over a websocket that attaches to the tmux pane (e.g. `tmux attach -t <target>` / `pipe-pane`), owner-gated at the handshake (R31.2).
- Close returns to the tree.

## Security constraints (cross-cutting — architect owns the model)
An interactive terminal into server panes is a HIGH-privilege capability. It is intended (Tron's own infra console) but MUST be: owner-token-gated at the websocket handshake, not just the page; no path to the APIs for any other user; consider audit-logging attach/detach. Architect designs the auth + PTY bridge; this is the sprint's main design risk.

## Suggested build order (architect/planner to confirm)
1. R31.2 owner-gate (foundation — nothing ships without it) →
2. R31.1 profile section (renders the entry) →
3. R31.3 otmux tree (read-only, lower risk) →
4. R31.4 interactive terminal (highest risk — websocket PTY + xterm.js).

## Gate posture
Owner-gate = security test (owner 200 / non-owner 403 on every endpoint + ws). Tree = functional. Terminal = functional + Tron device visual (like R30.53, a real-device interaction confirm). All chain-to-Test, scenario-first.
