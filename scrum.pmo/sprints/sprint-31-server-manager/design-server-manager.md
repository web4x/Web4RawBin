# Sprint 31 — Server Manager: Architect Design (risky parts)

**Author:** robbin-architect · 2026-07-20 · scenario-first (#126). Grounds: measured server.ts (2863 L).
**Scope of THIS doc:** the 3 design-risk parts PO flagged — R31.2 owner-gate (by-construction), R31.3 otmux-tree read path, R31.4 terminal bridge. R31.1 profile section is low-risk (renders the entry) — planner/expert straightforward.

## Measured ground truth (server.ts)
- WS: `new WebSocketServer({ server })` @2159 — auto-upgrades **every** path; single connection handler @2160.
- **Auth is POST-connect, NOT handshake:** client opens ws unauthenticated → sends `IDENTIFY {playerToken}` @2403 → server sets `client.authenticated=true` @2416. `tokenToClient` (token→clientId), `userProfiles` (token→profile @179), `wsClients` set.
- HTTP endpoints in `handleRequest` @796; auth pattern @830/874/1048: `if(!playerToken || !tokenToClient.has(playerToken)){ 401 }` — playerToken validated against the LIVE `tokenToClient` map.
- `http.createServer` @2063 → `handleRequest`; https @2073 → `setupWebSocketServer` @2075.
- Audit sink exists: `addLog()` → serverLogs[] + data/logs file (learnings).
- Deps: `ws` present. **No xterm.js, no node-pty** — R31.4 needs both added.

## R31.2 — OWNER-GATE (correct-by-construction) — FOUNDATION
Single shared guard, one definition, used by EVERY server-manager HTTP endpoint AND the terminal ws upgrade. Not per-call ad-hoc.

```
const OWNER_TOKEN = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';
// constant-time compare; resolve caller token the SAME way existing endpoints do
function resolveOwner(req): {ok:true, token} | {ok:false} {
  const token = playerTokenFrom(req);            // header/query as existing endpoints use
  if (!token || !tokenToClient.has(token)) return {ok:false};   // must be a LIVE authenticated session
  if (!timingSafeEqual(token, OWNER_TOKEN)) return {ok:false};  // and must be THE owner
  return {ok:true, token};
}
function requireOwnerHttp(req,res): boolean { if(resolveOwner(req).ok) return true; addLog(`[server-manager] DENY http path=${req.url} token=${tok8} ip=${ip}`); res.writeHead(403); res.end('{"error":"forbidden"}'); return false; }
```
- **By construction:** all `/api/server-manager/*` handlers first line = `if(!requireOwnerHttp(req,res)) return;`. The terminal upgrade calls the SAME `resolveOwner`. One gate, one owner constant, zero ad-hoc token literals elsewhere (grep-guard: OWNER_TOKEN appears ONCE).
- **UI-hiding is NOT acceptance** (PO): R31.1 hides the section for non-owners, but the gate is what's tested — non-owner 403 on every endpoint + ws even with the UI forced.
- Non-owner authenticated user AND unauthenticated both → 403 (fail closed: unknown token, redirected/tombstoned token, missing token all fail).

### Owner-gate invariants (assertable — the security gate test)
- INV-G1: every `/api/server-manager/*` route + the terminal ws returns 403/refused for any token ≠ OWNER_TOKEN (enumerate all routes in the test; add-a-route without the guard = test fails).
- INV-G2: OWNER_TOKEN literal appears in exactly ONE module location (grep-guard) — no ad-hoc copies.
- INV-G3: a rejected ws upgrade NEVER opens the socket (client sees 403 handshake, `connection` never fires, PTY never spawns).

## R31.3 — otmux/tmux tree (read path, lower risk)
- Endpoint `GET /api/server-manager/tree` (owner-gated). Server runs a READ-ONLY listing, NOT the `otmux` OOSH wrapper (avoid OOSH classifier/tty gates in a server ctx — learnings): use raw `tmux` list format:
  `tmux list-panes -a -F '#{session_name}\t#{window_index}\t#{pane_index}\t#{pane_id}\t#{pane_title}\t#{pane_current_command}\t#{window_name}'`
  Parse → nested `sessions[] → windows[] → panes[]` JSON. `pane_id` (%N) = the STABLE target for R31.4 (survives renumbering); also emit `session:win.pane` human label so Tron IDs the agent pane.
- Refreshable = client re-GETs. No state. Spawn via a small `execFile('tmux',[...])` promise (NOT shell string — avoid injection; args array). Read-only: never mutates tmux.
- Feasibility: LOW risk. Pure read + parse. Gate = functional (tree matches `tmux list-panes`).

## R31.4 — Pane → interactive fullscreen terminal (HIGHEST risk)
Frontend xterm.js ↔ ws ↔ node-pty running a tmux client bound to the selected pane. Owner-gated at handshake.

### Handshake gating (the key blocker — see B1)
Browsers CANNOT set arbitrary headers on `new WebSocket()`. And current auth is post-connect. So:
- **Ticket pattern (RECOMMENDED):** owner-gated `POST /api/server-manager/terminal-ticket` (requireOwnerHttp) issues a single-use, ~30s-TTL `ticket` bound to OWNER_TOKEN + target pane_id. Client opens `wss://…/api/server-manager/terminal?ticket=<t>`. A dedicated `WebSocketServer({noServer:true})` + `httpServer.on('upgrade')`: if `req.url` is the terminal path → validate ticket (owner-bound, unused, unexpired, matches a target) → `handleUpgrade` → open; else `socket.destroy(403)`. Ticket keeps the long-lived OWNER_TOKEN out of URLs/logs and makes the handshake single-use + auditable.
- The EXISTING `WebSocketServer({server})` must switch to `{noServer:true}` too (or path-filter in one `upgrade` handler) so the terminal path is routed to its own server and the app ws is unaffected. One `upgrade` handler, path-dispatch, owner-check for the terminal branch = by-construction (R31.2).

### Mode: READ-ONLY default + Take-Control (PO B4 decision 2026-07-20)
Live agent panes — an accidental keystroke could disrupt an agent mid-generation. So the terminal **defaults to READ-ONLY**; interactive I/O is delivered on an explicit **"Take Control"** toggle (interactive-ON-ENABLE, not removed). Correct-by-construction, two layers:
- **Read-only attach:** node-pty runs `tmux attach-session -t sm_<rand> -r` — the `-r` flag makes tmux itself REJECT input (not just the app declining to forward). Output streams normally. Defense-in-depth: the server ALSO drops any inbound ws key frames while in read-only mode.
- **Take Control** (owner-gated, same socket, audited): client sends `{t:'take-control'}` → server kills the `-r` pty and respawns `tmux attach-session -t sm_<rand>` (read-write) on the SAME grouped session, resumes streaming, and begins forwarding key frames. A `CONTROL_TAKEN` audit line is emitted. (Return-to-read-only = respawn with `-r` again.) The gate (R31.2) covers BOTH modes and the grouped attach.

### PTY bridge (Q1 answer)
- **node-pty spawning a tmux client — NOT pipe-pane+send-keys.** The PTY *is* a tmux client → keystrokes flow natively (no send-keys injection races), resize is native, control chars/TUI apps work. pipe-pane+send-keys = output-tee + injected keys: no native resize, key races, degraded — **does not satisfy "interactive."**
- **Isolation (Q1 blocker B3):** a plain `tmux attach -t <session>` resizes/steals the primary view → disrupts Tron's OTHER agents in that session. Use a **grouped session**: `tmux new-session -d -s sm_<rand> -t <target-session> \; select-pane -t <pane_id>` then attach the PTY to `sm_<rand>`. Grouped sessions share windows but have INDEPENDENT active-window + size → this client resizes only its own view; killed on detach. (Pane-level isolation: grouped session + select-pane; if a truly single-pane surface is needed, `break-pane`/linked window is a follow-up.)
- PTY: `node-pty.spawn('tmux',['attach-session','-t','sm_<rand>'],{name:'xterm-256color',cols,rows})`. On ws close → `ptyProcess.kill()` + `tmux kill-session -t sm_<rand>` (cleanup, no orphan clients).

### Resize + scrollback fidelity (Q2 answer)
- **Resize:** xterm `onResize({cols,rows})` → ws `{t:'resize',cols,rows}` → `pty.resize(cols,rows)`. Native; grouped-session so it doesn't clobber the primary. Set tmux `window-size latest`/`aggressive-resize` on sm_ session.
- **Scrollback (two layers):** (a) LIVE: xterm's own buffer (`scrollback:5000`) fills from streamed output → browser scroll works for everything since attach. (b) HISTORY (pre-attach): on connect, server sends a one-shot `tmux capture-pane -p -e -S -<N> -t <pane_id>` dump to prime xterm. → Fidelity good; **flag:** pre-attach history = a single capture snapshot (N lines), not infinite tmux copy-mode. Acceptable; state it in the AC.
- Binary/utf8: ws sends PTY bytes as binary frames; xterm `write(Uint8Array)`. No line-mangling.

### Audit logging (Q3 answer)
Reuse `addLog()` + a dedicated `data/logs/server-manager-<date>.log`. One structured line per event:
- `ATTACH mode=read-only owner=<tok8> target=<sess:win.pane/%id> sm=sm_<rand> client=<id> ip=<ip> ts=<iso>`
- `CONTROL_TAKEN owner=<tok8> target=<…> ts=<iso>` (read-only → interactive transition — a security-relevant event)
- `DETACH … durationMs=<> bytesIn=<> bytesOut=<>`
- `DENY kind=http|ws path=<> token=<tok8|none> ip=<ip> ts=<iso>` (denials are the security events — always logged).
Attach/control-taken/detach/deny are the audit quad. Greppable key=val.

### Feasibility verdict
- R31.2 gate: **LOW** risk, do first (foundation).
- R31.3 tree: **LOW** (read-only tmux list + parse).
- R31.4 terminal: **MEDIUM-HIGH**. Blockers below are surmountable but MUST shape the ACs.

## R31.4 BLOCKERS → AC wording (hand to req)
- **B1 handshake auth:** browsers can't set ws headers; current auth is post-connect. AC MUST say: *"handshake gated BEFORE the socket opens via an owner-bound single-use ~30s ticket (issued by an owner-gated HTTP endpoint) presented as a ws query param; invalid/expired/non-owner → upgrade refused (403), socket never opens."* NOT "check token after connect."
- **B2 node-pty native dep:** new compiled dependency — build/deploy vetting on WODA.prod. AC: *"interactive = real bidirectional PTY + native resize (node-pty or equiv); pipe-pane output-tee does NOT satisfy."*
- **B3 attach isolation:** naive attach disrupts other viewers. AC: *"attaching MUST NOT resize/steal the target session for other clients (grouped/size-independent attach); detach cleans up its client/session with no orphan."*
- **B4 privilege posture — PO DECIDED (2026-07-20): read-only default + Take-Control.** AC: *"terminal attaches READ-ONLY by default (tmux `-r`, input rejected by tmux + dropped by server); full interactive I/O only after an explicit owner-gated 'Take Control' toggle (respawns read-write on the same grouped session), which is audit-logged (CONTROL_TAKEN). Owner-gate + grouped-session isolation apply to BOTH modes. Owner-gate is server-side at handshake AND every endpoint; attach/control-taken/detach/deny all audit-logged."*

## Suggested build order (confirms PO)
R31.2 gate → R31.1 section → R31.3 tree → R31.4 terminal. Nothing ships before scenario units land (#126).

## Chain / Test posture
- R31.2 → security Test: owner 200 / non-owner 403 on EVERY endpoint + ws upgrade (INV-G1/2/3). Correct-by-construction (single guard) = the champagne.
- R31.3 → functional Test: tree matches `tmux list-panes`.
- R31.4 → functional Test: (a) read-only default — key frames do NOT reach the pane (tmux `-r` + server drop); (b) Take-Control → echo round-trip (type→appears), resize→reflow, history-primed; (c) CONTROL_TAKEN audited. + Tron device visual confirm (like R30.53).
