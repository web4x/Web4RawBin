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

## ARCHITECT BACKSTOP — R31.2 v0.7.82 / 99652464b (robbin-architect 2026-07-20): **PASS**
Restarted remoteShells:0.2 (Ctrl-C → npm start); served `/api/config` version = **0.7.82**.
STATIC (read server.ts:796-843, 2200-2222):
- INV-G1 ✓ — HTTP choke-point `if(filepath.startsWith('/api/server-manager/')){ if(!requireOwnerHttp)return; … }` (:834) gates EVERY sub-route before any handler; a new route physically can't bypass. Terminal ws path gated at :2208 via the SAME `resolveOwner`.
- INV-G2 ✓ — `OWNER_TOKEN` literal appears EXACTLY once (grep: server.ts:802).
- INV-G3 ✓ — non-owner ws upgrade `socket.write(403)+socket.destroy(); return;` WITHOUT `handleUpgrade` (:2211); `noServer:true` dispatcher → `connection` never fires → no PTY.
- Fail-closed ✓ — `resolveOwner` rejects missing / not-in-tokenToClient (unknown/redirected/not-live) / length-mismatch / non-timing-safe-equal; constant-time compare (:812-813).
LIVE (curl https://localhost:4444):
- no token → 403 · unknown token → 403 · nonexistent sub-route `/api/server-manager/tree` → 403 (choke-point proven — can't probe past the gate) · body `{"error":"forbidden"}`.
NOT fully testable now: owner-200 positive path needs the owner's LIVE session token in tokenToClient (Tron's device) — security-critical NEGATIVE direction is proven.
FOLLOW-UPS (non-blocking): (1) IMPL MARKER still PENDING (server.ts:800) — now unblocked: add `[impl:uuid]` under my Method assertOwner 8bb1842f + mint the Impl unit (champagne). (2) R31.4 refinement: terminal ws currently reads owner token from `?token=` query; switch to the single-use TICKET (design B1) so the long-lived token isn't in the ws URL/proxy logs. Gate itself is correct for R31.2.

### R31.1 OWNER-ACCEPT BUG diagnosis (2026-07-20, Tron: owner sees NO entry) → v0.7.88 fix
ROOT CAUSE (measured): NOT a wrong-key bug — `rawbin-player-id` IS the correct token key (RawBinClient.ts:29 stores it; the /profile WS reads it at server.ts:2101). The real cause is a **RACE**: the inline feature-grants fetch (server.ts:877, fires immediately on /profile load) hits `/api/server-manager/whoami`, but `resolveOwner` requires the token to be in the LIVE `tokenToClient` map — which is only populated once the /profile page's OWN WS completes IDENTIFY (server.ts:2101-2107). The fetch fires BEFORE IDENTIFY lands → token not yet live → 403 → owner gets no entry. Reject path looked fine only because the tester MOCKED whoami=200 (never exercised the real token/registration flow).
FIX (recommended, correct-by-construction): server-side emit via the SAME guard, no client round-trip, no race.
1. Add `ServerManagerGuard.isOwner(token): boolean` — reads the ONE OWNER_TOKEN constant (preserves INV-G2: still a single literal; do NOT re-literal the token in the PROFILE builder).
2. When the server builds the owner's PROFILE WS message (it already holds the verified live token in-hand at IDENTIFY/PROFILE time), set a `serverManager: true` grant flag via `ServerManagerGuard.isOwner(profileToken)`.
3. The /profile inline JS renders the 'Server Manager' entry IFF the PROFILE message carries the flag — remove the whoami round-trip. Non-owner: flag absent → no entry (reject stays server-side). Bonus: removes the whoami token-in-URL.
FALLBACK (smaller): fire the feature-grants fetch AFTER the PROFILE message arrives (proves the token is registered) — fixes the race but keeps the round-trip. Less clean.
GATE: owner (Tron live session) SEES the entry on /profile; non-owner absent; INV-G2 still ==1 (isOwner reads the single constant). Backstop v0.7.88 + require an owner-ACCEPT test with a REAL live session (not a whoami mock).

### R31.4-PRE / B1 FORCED — Server-Manager SESSION CREDENTIAL (2026-07-20, Tron: /server-manager loads but tree 403s for owner) → v0.7.89
ROOT CAUSE (measured, server.ts:833/856): the page shell DOES send `x-player-token=token` on the `/api/server-manager/tree` fetch — but `resolveOwner` requires the token to be in the LIVE `tokenToClient` map, and `/server-manager` opens NO WS (navigating from /profile CLOSES the /profile WS → the token drops out of tokenToClient). So the owner's credential isn't LIVE → 403. Same untested-accept class (only reject-dir was gated; tester mocked). `?token=` in the URL also leaks via history/referrer/logs (my B1 flag, now forced).

FIX (LOCKED design) — ONE server-authoritative credential (httpOnly COOKIE) for page + ALL /api/server-manager/* + the terminal ws. Cookie over single-use ticket: a multi-call authenticated PAGE needs a credential the browser auto-carries on every same-origin request (tree, refresh, ws) — a single-use ticket breaks on the 2nd call.
1. ISSUE (server-authoritative, only after owner proof): owner-gated `POST /api/server-manager/session` (behind the choke-point → requireOwnerHttp, using the owner's LIVE token which /profile HAS). Mint a random `sm_session` id, store server-side `smSessions: Map<id,{owner:true, expiresAt}>` (TTL ~30min, revocable), and `Set-Cookie: sm_session=<id>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=1800`. The /profile grant becomes: onclick → POST …/session (owner live token) → on 200 navigate to `/server-manager` (NO ?token= in URL).
2. ACCEPT: extend the ONE `resolveOwner` guard to ALSO accept a valid unexpired `sm_session` cookie → {ok:true}. This path does NOT need tokenToClient (the cookie IS the proof, issued only after a prior owner verification). Now the page shell drops the `x-player-token` header + `?token=` — the browser sends the cookie automatically on tree/refresh/whoami.
3. TERMINAL WS (R31.4): the same `sm_session` cookie is sent on the same-origin ws upgrade → validate → owner → handleUpgrade; else socket.destroy (INV-G3 unchanged). ONE mechanism, no ?ticket=/?token=.
4. REMOVE `?token=` from all Server-Manager URLs (grant href, tree fetch, page nav).

INV PRESERVED: INV-G1 — `resolveOwner` is still the ONE guard/choke-point (adds a cookie credential form; the issue-endpoint is itself behind the choke-point). INV-G2 — `sm_session` is a RANDOM id (NOT the OWNER_TOKEN); the store maps it to owner; the single OWNER_TOKEN literal (ServerManagerGuard.ts:12) is untouched, ==1. INV-G3 — ws upgrade still destroys non-owner before handleUpgrade.
SECURITY: HttpOnly (no XSS theft) + Secure (HTTPS) + SameSite=Strict (no CSRF) + short TTL + server-side revocable store + random id — strictly better than `?token=` (URL leak). 

INTERACTIVE SELECTOR (PO ask 2): the current tree (server.ts:835-853) renders sessions→windows→panes but `.pane` nodes are STATIC divs with NO click handler — a DISPLAY, not a selector. R31.4 entry needs each `.pane` clickable → select (highlight) + capture paneId → "Open Terminal". Add pane onclick in the v0.7.89/R31.4 work.

GATE: owner (real live session) loads /server-manager → session cookie set → tree renders (sessions→windows→panes) with NO ?token= in URL; non-owner still 403 on page+api+ws; INV-G2==1; pane nodes selectable. Requires a REAL-session owner-accept test (the recurring gap).

## R31.4 RE-ARCHITECTURE (Tron directive 2026-07-20) — scenario-unit tree via the SHARED traceability itemView
Replaces the bespoke inline SERVER_MANAGER_PAGE tree renderer (server.ts:816-865, display-only) with the SHARED itemView (`rb-trace-tree`/`rb-object-item`) rendering tmux state as SCENARIO-SHAPED units. Each PANE = a single clickable item; select a pane → open its terminal FULLSCREEN.

### Measured reuse surface (rb-trace-tree.ts)
- `RbTraceTree extends HTMLElement` (`<rb-trace-tree>`); renders children as `rb-object-item`.
- CLEAN REUSE ENTRY = the `.items` setter (:55): `items = [{uuid,type,name,description?,children?:[{uuid,type,name,description?,hasChildren}]}]`. Renders clickable nodes; children provided INLINE are drawn directly (lazy `/api/trace/children/` fetch fires ONLY when a node has hasChildren but no inline children).
- COUPLING to decouple: node-select currently routes to the traceability detail-views / TraceRouter / ViewBus. For Server Manager we must intercept select (Terminal → open terminal, not a detail-view).

### Session / Terminal units (TRANSIENT, itemView-shaped — NOT persisted)
tmux panes are LIVE/volatile → do NOT write Session/Terminal to scenario/index (would churn + go stale). "Scenario-first" here = the itemView UNIT SHAPE (`ior` + `model`), built on-the-fly from `OtmuxBridge.readSessionTree`, served by `/api/server-manager/tree` — NOT persisted champagne units. (The champagne chain for R31.4 stays: UC paneTerminal.attach → Class PtyBridge → Method attachPane 6fc43b8e → Impl → Test — those ARE persisted; the live Session/Terminal nodes are runtime data the tree renders.)
- `ior:class:Session` — one per tmux session. node `{uuid: sessionName, type:'Session', name, children:[Terminal…]}`. (Windows fold into the label or an intermediate level; keep shallow.)
- `ior:class:Terminal` — one per pane (the clickable leaf). node `{uuid: paneId(%N stable), type:'Terminal', name: label 'session:win.pane', description: title+currentCommand, hasChildren:false}`.
- `/api/server-manager/tree` (owner-gated, cookie) returns these roots in the `.items` shape (sessions→terminals, shallow → all INLINE, no lazy `/api/trace/children` call).

### itemView reuse — what's needed (design for the fresh team)
1. `/server-manager` STOPS being an inline-JS string; becomes a bundled CLIENT page (esbuild entry `src/public/ts/server-manager.ts`) that imports `rb-trace-tree` + `rb-object-item` (+ minimal deps) and mounts `<rb-trace-tree>`. Page still owner-gated + cookie (R31.2/B1). Load the bundle in the page shell served by the (owner-gated) `/server-manager` route.
2. Entry: fetch `/api/server-manager/tree` (cookie auto-sent) → `treeEl.items = roots`. Add a "Refresh" that re-fetches + re-sets `.items`.
3. SELECT HOOK (small generalization of rb-trace-tree): emit a `node-select` CustomEvent `{uuid,type}` on item click, OR mount the tree WITHOUT the trace router and let the consumer listen on the container. Server-Manager entry: on select, if `type==='Terminal'` → `openTerminal(paneId)`; `Session` → expand (default). Traceability keeps its detail-view consumer unchanged. Keeps the itemView GENERIC (tree of clickable items; consumer owns the action).
4. Type icons: add `Session`/`Terminal` to the itemView icon map (icons.ts). NO new detail-view components needed (Terminal = action-on-click; Session = expand).

### Fullscreen terminal (the R31.4 core — see ## R31.4 above for full PTY design)
On Terminal select → fullscreen xterm.js bound to the pane via the ws PTY bridge (`PtyBridge.attachPane`, Method 6fc43b8e): node-pty attaches a GROUPED tmux session (no-disrupt), READ-ONLY default (tmux `-r` + server drops keys) + owner-gated Take-Control (respawn read-write), audit quad ATTACH/CONTROL_TAKEN/DETACH/DENY. **ws auth = the sm_session COOKIE** (built v0.7.89; browser sends it on the same-origin ws upgrade — NO ?ticket=/?token=). Close → back to the tree. node-pty is a NEW native dep (WODA.prod build vet). Scrollback: xterm buffer + capture-pane preamble.

### Finish ?token= removal (carried from B1)
Remove the residual: page shell drops `qp.get('token')`; the `/server-manager` route accepts ONLY the sm_session cookie (drop the ?token= acceptance @server.ts:917); grant href drops the ?token= fallback (onclick POST /session → cookie → nav is the sole path). Cookie is the sole Server-Manager credential (page + /tree + ws).

### INV / build order / gate
- INV-G1/G2/G3 unchanged (same choke-point + single OWNER_TOKEN + ws-destroy; the tree/terminal are behind the gate). Cookie is the credential.
- Build order (fresh team): (a) server-manager client bundle mounting rb-trace-tree via `.items`; (b) /api/server-manager/tree returns Session/Terminal node shape; (c) select-hook generalization + openTerminal; (d) node-pty PtyBridge.attachPane (read-only default + Take-Control + audit, cookie ws-auth); (e) finish ?token= removal.
- SCENARIO-FIRST: fresh team MINTS any needed units (the persisted chain is UC→Class PtyBridge→Method attachPane 6fc43b8e→Impl→Test; Session/Terminal are transient runtime nodes, not minted). Architect (me) backstops each ship + mints the PtyBridge.attachPane Impl.
- GATE: owner → /server-manager → itemView tree of Sessions→Terminals (clickable panes); click a Terminal → fullscreen terminal (read-only, Take-Control works); non-owner 403 on page+tree+ws; ?token= fully gone; INV-G2==1. Real-session owner test (recurring gap).

### R31.2 RE-CONFIRM — v0.7.83 / 196917b4c (guard extraction): **PASS holds**
Expert extracted the guard to `ServerManagerGuard.assertOwner` (ServerManagerGuard.ts:26); server.ts `resolveOwner` thin-wraps it (`ServerManagerGuard.assertOwner(req, t=>tokenToClient.has(t))` :802) — behavior-preserving DI. Restarted remoteShells:0.2 → served `/api/config` = **0.7.83** (==HEAD, phantom-guard OK). INV-G2 ✓ literal now lives ONLY at ServerManagerGuard.ts:12 (grep count==1). INV-G1 ✓ live (no/unknown/nonexistent-subroute → 403). INV-G3 ✓ ws upgrade :2195-2201 still `socket.destroy()` w/o `handleUpgrade` for non-owner. **Impl unit MINTED: ServerManagerGuard.assertOwner impl = 335dbf3d-2294-47cb-9beb-1d81a4bf9a94** (ownerIor→Method 8bb1842f; Method.implementations[] wired). Expert places `[impl:uuid:335dbf3d…]` on assertOwner. Chain R31.2 now Req→UC→Class→Method→Impl (Test next).
