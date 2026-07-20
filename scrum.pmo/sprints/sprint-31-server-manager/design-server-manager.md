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

### Mode — ⛔ SUPERSEDED / REVERSED by Tron override 2026-07-20: terminal is FULL READ-WRITE by DEFAULT
**DISREGARD this block. Tron reversed the B4 read-only call: the Server Manager terminal is the OWNER's admin console = FULL INTERACTIVE read-write node-pty grouped attach by default, owner-gated by the sm_session cookie, xterm.js fullscreen, ATTACH/DETACH audit only. NO read-only default, NO tmux `-r`, NO key-frame-drop, NO Take-Control toggle, NO CONTROL_TAKEN. Kept below for record only.**

### (HISTORICAL, reversed) Mode: READ-ONLY default + Take-Control (PO B4 decision 2026-07-20)
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

### Node types (TRANSIENT, itemView-shaped — NOT persisted) — 3 TYPES per Tron refinement (2026-07-20)
tmux panes are LIVE/volatile → do NOT write these to scenario/index (would churn + go stale). "Scenario-first" here = the itemView UNIT SHAPE (`ior` + `model`), built on-the-fly from `OtmuxBridge.readSessionTree`, served by `/api/server-manager/tree` — NOT persisted champagne units. (The champagne chain for R31.4 stays PERSISTED: UC paneTerminal.attach → Class PtyBridge → Method attachPane 6fc43b8e → Impl → Test — the live nodes are runtime data the tree renders.)
**NODE-TYPE ENUM (faithful to the otmux hierarchy `session → window(0: bash) → pane`, otmux-prefixed — SUPERSEDES the earlier 2-type Session/Terminal):**
- `ior:class:otmuxSession` — one per tmux session. node `{uuid: sessionName, type:'otmuxSession', name, children:[otmuxWindow…]}`. **EXPANDS** (not clickable-to-terminal).
- `ior:class:otmuxWindow` — one per window. node `{uuid: 'session:winIndex', type:'otmuxWindow', name: 'winIndex: winName', children:[otmuxPane…]}`. **EXPANDS**.
- `ior:class:otmuxPane` — one per pane = **THE CLICKABLE LEAF**. node `{uuid: paneId(%N stable), type:'otmuxPane', name: label 'session:win.pane', description: title+currentCommand, hasChildren:false}`. **node-select → openTerminal(paneId) fullscreen** (NOT expand, NOT a detail-view).
- CLICKABILITY: only `otmuxPane` triggers the terminal; `otmuxSession`/`otmuxWindow` expand/collapse their children. The select-hook consumer branches on `type==='otmuxPane'`.
- `/api/server-manager/tree` (owner-gated, cookie) returns the 3-level roots in the `.items` shape (session→window→pane, shallow → all INLINE, no lazy `/api/trace/children` call). Add the 3 types to the itemView icon map (icons.ts).

### itemView reuse — what's needed (design for the fresh team)
1. `/server-manager` STOPS being an inline-JS string; becomes a bundled CLIENT page (esbuild entry `src/public/ts/server-manager.ts`) that imports `rb-trace-tree` + `rb-object-item` (+ minimal deps) and mounts `<rb-trace-tree>`. Page still owner-gated + cookie (R31.2/B1). Load the bundle in the page shell served by the (owner-gated) `/server-manager` route.
2. Entry: fetch `/api/server-manager/tree` (cookie auto-sent) → `treeEl.items = roots`. Add a "Refresh" that re-fetches + re-sets `.items`.
3. SELECT HOOK (small generalization of rb-trace-tree): emit a `node-select` CustomEvent `{uuid,type}` on item click, OR mount the tree WITHOUT the trace router and let the consumer listen on the container. Server-Manager entry: on select, if `type==='otmuxPane'` → `openTerminal(paneId)`; `otmuxSession`/`otmuxWindow` → expand (default). Traceability keeps its detail-view consumer unchanged. Keeps the itemView GENERIC (tree of clickable items; consumer owns the action).
4. Type icons: add `otmuxSession`/`otmuxWindow`/`otmuxPane` to the itemView icon map (icons.ts). NO new detail-view components needed (otmuxPane = action-on-click; otmuxSession/otmuxWindow = expand).

### Fullscreen terminal (the R31.4 core) — FULL READ-WRITE by default (Tron override 2026-07-20)
On `otmuxPane` select → fullscreen xterm.js bound to the pane via the ws PTY bridge (`PtyBridge.attachPane`, Method 6fc43b8e): node-pty attaches a GROUPED tmux session (no-disrupt to other viewers) **read-write (FULL INTERACTIVE ssh session — this is the OWNER's admin console, NOT read-only)**. Bidirectional I/O + resize + scrollback. **ws auth = the sm_session COOKIE** (built v0.7.89; browser sends it on the same-origin ws upgrade — NO ?ticket=/?token=). Audit = ATTACH / DETACH pair (no read-only/Take-Control). Close → back to the tree. node-pty is a NEW native dep (WODA.prod build vet). Scrollback: xterm buffer + capture-pane preamble.
**SUPERSEDED (Tron override): the earlier read-only-default + tmux `-r` + key-frame-drop + Take-Control toggle + CONTROL_TAKEN audit (PO B4 call) are REVERSED — DISREGARD them in the ## R31.4 'Mode' block below. Full read-write is the default; the sole gate is owner-cookie auth.**

### Finish ?token= removal (carried from B1)
Remove the residual: page shell drops `qp.get('token')`; the `/server-manager` route accepts ONLY the sm_session cookie (drop the ?token= acceptance @server.ts:917); grant href drops the ?token= fallback (onclick POST /session → cookie → nav is the sole path). Cookie is the sole Server-Manager credential (page + /tree + ws).

### INV / build order / gate
- INV-G1/G2/G3 unchanged (same choke-point + single OWNER_TOKEN + ws-destroy; the tree/terminal are behind the gate). Cookie is the credential.
- Build order (fresh team): (a) server-manager client bundle mounting rb-trace-tree via `.items`; (b) /api/server-manager/tree returns Session/Terminal node shape; (c) select-hook generalization + openTerminal; (d) node-pty PtyBridge.attachPane (read-only default + Take-Control + audit, cookie ws-auth); (e) finish ?token= removal.
- SCENARIO-FIRST: fresh team MINTS any needed units (the persisted chain is UC→Class PtyBridge→Method attachPane 6fc43b8e→Impl→Test; Session/Terminal are transient runtime nodes, not minted). Architect (me) backstops each ship + mints the PtyBridge.attachPane Impl.
- GATE: owner → /server-manager → itemView tree of Sessions→Terminals (clickable panes); click a Terminal → fullscreen terminal (read-only, Take-Control works); non-owner 403 on page+tree+ws; ?token= fully gone; INV-G2==1. Real-session owner test (recurring gap).

## R31.4 TERMINAL UX FIX — mount xterm in the DEFAULT DRAWER (Tron device feedback 2026-07-20, IMG_4597)
WIN: Tron device-confirmed the tree renders + the terminal WORKS end-to-end (ran `ll`, sm_p175 status line) — mechanism/gate/tree DONE. This is UX only: (1) content CENTERED (must be left-aligned), (2) bespoke fullscreen overlay instead of the default drawer, (3) no close. Tron: render the terminal INSIDE rb-detail-drawer (the shared drawer all detail views use) → close/minimize/grab-bar + left-align + consistency for free; "fullscreen" = drawer EXPANDED, not a chromeless overlay.

### Measured (current)
- Bespoke overlay is `openTerminal()` in src/public/ts/server-manager/server-manager.ts:19-77 — builds a `.sm-term-overlay` (position:fixed;inset:0) with a `.body{align-items:center;justify-content:center}` (server.ts:847) = the CENTERING culprit; its own ✕ Close (but Tron didn't see it / wants drawer chrome).
- rb-detail-drawer (src/public/ts/trace/rb-detail-drawer.ts): `<rb-detail-drawer>` custom element; content mounts into the `.drawer-body` panel via `panel.innerHTML=''; panel.appendChild(el)` (:171-176) — currently DRIVEN BY a type→tag map (rb-<type>-detail), i.e. only traceability detail types. Chrome: `.drawer-handle` grab-bar, X→minimize-peek, grab-bar→toggle, ESC→`close()` (:225 full close), minimize()/closeAndMinimize(). Panel is left-aligned (like every detail view).

### DESIGN
1. **Generalize the drawer to host arbitrary content** — add a public `showElement(el: HTMLElement, opts?: {title?: string; onClose?: () => void})` to RbDetailDrawer: `panel.innerHTML=''; panel.appendChild(el); this.setAttribute('open',''); this.removeAttribute('minimized'); panel.dataset.currentRef = ''` (so a later detail re-renders, not stale-ref no-op). Keeps the existing type-map path for traceability; the terminal uses this generic mount. Small, reusable — matches Tron's "consistency for free".
2. **/server-manager page** — import `'../trace/rb-detail-drawer.js'` in server-manager.ts and include one `<rb-detail-drawer id="sm-drawer">` (add to the shell in serverManagerPage() OR create+append in JS). One singleton drawer per page (like /trace).
3. **openTerminal(paneId) rewrite** — DELETE the `.sm-term-overlay`. Create a plain LEFT-ALIGNED container div (`text-align:left; height:100%`; NO align/justify-center, NO margin:auto), `drawer.showElement(container, {title:'Terminal — '+paneId, onClose: teardown})`, `term.open(container)`, then the SAME ws PTY wiring (binary I/O, keystrokes, {t:resize}). Fixes #1 (left-align — drawer panel doesn't center) + #2 (no bespoke overlay).
4. **Fit / resize** — use a `ResizeObserver` on the container (fires on drawer expand/minimize/window-resize — robust, no need to hook specific drawer events): recompute cols/rows from the container box → `term.resize(cols,rows)` + ws `{t:'resize'}`. Also fit once on ws.onopen.
5. **PTY lifecycle vs drawer state**:
   - ATTACH: on showElement/open (ws connect + pty attach as today).
   - MINIMIZE (X→peek): KEEP the ws alive (re-expand resumes the live session) — do NOT teardown on `minimized`.
   - CLOSE (ESC / full close = `open` attribute removed): TEARDOWN — `ws.close()` (server kills pty + grouped session on ws close) + `term.dispose()` + remove the container. Wire via the `onClose` callback the drawer invokes in `close()`, OR a MutationObserver on the drawer's `open` attr (teardown when `open` removed while not `minimized`). Recommend the `onClose` callback (explicit, no observer race).
6. **"Fullscreen" = expanded drawer** — reuse the drawer's expand; large terminal, standard chrome. No separate overlay.

### INV / chain / gate
- No server/gate change — R31.2 owner-gate + cookie ws-auth + INV-G1/2/3 untouched (client-only UX). Terminal mechanism (PtyBridge.attachPane 6fc43b8e / Impl 394eac63) unchanged.
- Chain: this refines the client openTerminal (still part of R31.4 step-3/4 client). If it warrants a Method/Impl, it's the client `openTerminal` (server-manager.ts) — flag to req; likely rides the R31.4 client work.
- GATE (tester, real WebKit/Tron device): terminal opens IN the drawer (grab-bar + close/minimize visible), content LEFT-ALIGNED, closeable via the drawer (ESC/X), keystrokes still RW (ran a command), fit correct on expand/minimize, minimize-peek keeps the session, full-close kills it (no orphan grouped session).

## R31.3 TREE-BEHAVIOR FIX — in the SHARED rb-trace-tree (Tron directive 2026-07-20, IMG_4598)
Tron: STOP reinventing tree behavior — fix ONCE in the shared rb-trace-tree (used by /trace AND Server Manager). Data (OtmuxBridge.readSessionTree 5c1701bc) is CORRECT (3 levels, right names); bugs are RENDER/INTERACTION.

### DIAGNOSIS (measured, rb-trace-tree.ts) — built for ~2 levels; 3-level server-manager exposes the gap
- **`.items` type is 2-level (:55):** roots have `children?: {…, hasChildren: boolean}[]` — the child type has NO nested `children` field. So the inline data model stops at roots+direct-children; grandchildren (panes under windows) aren't first-class. Windows therefore render as leaf-ish.
- **Eager subtree explosion (`buildSeedNode` :339):** buildSeedNode RECURSIVELY appends `buildSeedNode(child…, (child as any).children||[], child.hasChildren…)` for every inline descendant AT ONCE → the whole provided subtree renders eagerly (not layer-by-layer). True lazy/per-layer expand exists only for the GRAPH path (onToggleChildren :112 nodeEl) and the trace-API LAZY path (:118 fetchAndRenderChildren → /api/trace/children, trace-specific). The `.items` inline path has no per-layer gate → "explodes, then settles after manual toggle" (the expanded-set + display only sync after a manual toggle cycle).
- **Window chevron missing:** a node's expander = `children.length>0 || hasChildren===true` (:324). Windows get no chevron because the 2-level `.items` path doesn't carry their pane-children and the server didn't set window `hasChildren:true` → showExpander false.
- **Initial state:** roots render with inline children already appended (eager) but expanded-set empty → inconsistent "closed yet open".

### FIX — generic N-level, layer-by-layer, in the SHARED component (correct-by-construction; /trace benefits)
1. **Recursive node type:** make the `.items` node type RECURSIVE — `type Node = {uuid; type; name; description?; hasChildren?; children?: Node[]}` at EVERY depth. Chevron per node = `hasChildren === true || (children?.length ?? 0) > 0`. (Windows now first-class expandable.)
2. **Layer-by-layer reveal (kill the eager recursion):** on initial render / `.items` set, build ONLY the roots, COLLAPSED, each with a chevron per rule (1). STORE each node's inline `children` on the element (WeakMap keyed by the node el, or a private field). In `onToggleChildren` OPEN: if the node's direct children aren't in the DOM yet, build them from the STORED inline children — ONE layer, each child collapsed with its own chevron. Do NOT recurse beyond the direct layer. (This generalizes the existing seed/lazy behaviour to the inline-children case; buildSeedNode stops recursing — it renders a node + its chevron, defers children to expand.)
3. **Configurable child source (generic):** expand reveals direct children from (a) the node's stored inline `children` if present, else (b) a lazy fetcher. Keep the trace default (`/api/trace/children` when `this.graph`/seed), but the inline path (server-manager) needs NO fetch — it reveals from stored data. (Optional generic hook `data-children-endpoint` for future non-trace lazy sources; not required now since server-manager sends the full tree inline.)
4. **Correct initial collapsed state:** roots collapsed by default (unless in the persisted expanded-set); display derives from the expanded-set on FIRST render (no eager-append) → fixes "explodes then settles". Each node toggles independently at every level.

### server-manager DATA tweak (small — feeds the shared component)
- `/api/server-manager/tree` window node: `name` = a clear WINDOW label ("window N" / real window name — NOT the active-command placebo "0: bash"); `hasChildren: true`; `children: [otmuxPane…]` inline. (In OtmuxBridge.readSessionTree / the roots shaping — window.name from `#{window_index}: #{window_name}` not `#{pane_current_command}`.) This is the ONLY server-manager change; the behavior is all in rb-trace-tree.

### INV / chain / gate
- Client-only; no server owner-gate/cookie/INV change. rb-trace-tree is shared → /trace must be regression-checked (its 2-level trees still render + expand; the recursive type is backward-compatible since children were already optional). readSessionTree Impl (5c1701bc) stays valid (data correct); R31.3 req stays In-Progress for this render fix.
- GATE (tester, chromium logic + iOS visual): 3-level independent expand/collapse (session/window/pane each toggles), WINDOW node has a chevron + proper label, layer-by-layer (expand reveals only direct children, collapsed), correct initial collapsed state, no explode-then-settle; /trace unregressed.

## R31.4 DRAWER DRY + R31.3 BADGE (Tron 2026-07-20, v0.7.95 device) — retire the showElement fork
Two device bugs, one root for the drawer ones: `showElement` is a PARALLEL reimplementation that DIVERGES from the /trace detail flow → recurring drawer bugs (silent-no-op earlier; now weird scroll + grab-bar/handle default behavior lost). Tron DRY directive: mount the terminal via the SAME drawer detail path /trace uses; drawer must behave IDENTICALLY (scroll, handle, expand/minimize). PRESERVE in-room differences (R30.20 X→chat) — only the trace/Server-Manager context behaves as trace.

### (A) DRY drawer — measured /trace path (rb-detail-drawer.ts)
- Detail opens via a `selection-changed` document event (:61) → `onSelectionChanged` (:79) → `renderDetailForRef(ref)` (:130) → type→tag map (:162-166) → creates `rb-<type>-detail`, mounts in `.drawer-panel-detail` with the FULL standard drawer chrome/scroll/handle/expand. `showElement` (:243) is a SECOND path that sets up the panel itself = the fork/divergence.
### FIX (A) — terminal becomes a normal detail-view rendered by the SHARED flow; retire the fork
1. NEW `rb-terminal-detail` custom element (src/public/ts/trace/rb-terminal-detail.ts, self-registers) = a detail-view like rb-task-detail: reads its `uuid`/`ref` (the pane_id), opens the binary ws to /api/server-manager/terminal?pane=<uuid> + xterm (the existing openTerminal body moves here), `disconnectedCallback`/drawer-close → teardown (ws.close→pty+grouped kill, term.dispose), `ResizeObserver` fit. Does NOT need a unit fetch (like file/webitem, resolveDetailUnit failure is caught harmlessly).
2. Add `otmuxpane: 'rb-terminal-detail'` to the type→tag map (:163-166) — so `renderDetailForRef('otmuxpane:<uuid>')` renders the terminal via the EXACT SAME path as every trace detail (identical scroll/handle/expand/minimize).
3. server-manager.ts: import rb-detail-drawer + rb-terminal-detail; RETIRE the bespoke capture-click hook + `openTerminal` + `showElement` usage. Route pane selection through the STANDARD selection flow the drawer already listens for: clicking an otmuxPane node → selectionModel.select('otmuxpane:<paneId>') → `selection-changed` → drawer renders rb-terminal-detail. (VERIFY: the tree/rb-object-item already fires selection-changed on node click in the trace context; server-manager just stops intercepting and lets the standard flow run. If leaf selection needs an explicit nudge, call selectionModel.select on pane click — but via the shared model, not a fork.)
4. RETIRE `RbDetailDrawer.showElement` entirely (no other caller). In-room R30.20 (X→chat) branch UNTOUCHED — the drawer's mode-aware close already context-branches; trace/SM context = detail behavior.
- Result: the terminal drawer scrolls + grab-bar + expand/minimize behave IDENTICALLY to /trace by construction; the silent-no-op + scroll/handle divergence are structurally impossible (one code path).

### (B) BADGE = 0 regression (from the layer-by-layer refactor) — separate, in rb-trace-tree
- ROOT: buildSeedNode's `item.data` (:334) sets `has-children` but NEVER a `child-count`; pre-refactor the badge counted eager DOM children (nonzero), but layer-by-layer builds the child layer only on expand → 0 rendered children → badge 0. `nodeChildCount` map (:49) stores counts but isn't applied to the node's OWN badge.
- FIX: in buildSeedNode, set the item's `child-count` from the node's OWN direct-children count at build time: `child-count = (children?.length) || nodeChildCount.get(uuid) || (hasChildren ? '' : 0)`. Add it to the item.data at :334 (and the PATH-A/nodeEl item.data) so the badge shows the real number BEFORE the layer is built — independent of expand state. (nodeChildCount already records children-with-grandchildren; also record every node's direct count.)

### INV / scope / gate
- Client-only; no server owner-gate/cookie/INV change. rb-trace-tree + rb-detail-drawer are SHARED → /trace MUST be regression-checked (detail open/scroll/handle + badges). retiring showElement removes a fork (DRY) — /trace already uses renderDetailForRef, unaffected.
- GATE (tester chromium + Tron device): terminal opens via the standard drawer (scroll/grab-bar/expand IDENTICAL to a /trace detail), pane-tap→terminal works on device, close via drawer, keystrokes RW; child-count badge shows real N at every level pre-expand; /trace details + badges unregressed; in-room X→chat preserved.

### R31.2 RE-CONFIRM — v0.7.83 / 196917b4c (guard extraction): **PASS holds**
Expert extracted the guard to `ServerManagerGuard.assertOwner` (ServerManagerGuard.ts:26); server.ts `resolveOwner` thin-wraps it (`ServerManagerGuard.assertOwner(req, t=>tokenToClient.has(t))` :802) — behavior-preserving DI. Restarted remoteShells:0.2 → served `/api/config` = **0.7.83** (==HEAD, phantom-guard OK). INV-G2 ✓ literal now lives ONLY at ServerManagerGuard.ts:12 (grep count==1). INV-G1 ✓ live (no/unknown/nonexistent-subroute → 403). INV-G3 ✓ ws upgrade :2195-2201 still `socket.destroy()` w/o `handleUpgrade` for non-owner. **Impl unit MINTED: ServerManagerGuard.assertOwner impl = 335dbf3d-2294-47cb-9beb-1d81a4bf9a94** (ownerIor→Method 8bb1842f; Method.implementations[] wired). Expert places `[impl:uuid:335dbf3d…]` on assertOwner. Chain R31.2 now Req→UC→Class→Method→Impl (Test next).

## R31.4 DRAWER FINAL SPEC + R31.3 BADGE-via-REFERENCES (Tron/PO 2026-07-20, v0.7.97 device IMG_4605) — retire two forks, reuse /trace
Two DRY items. Both = STOP forking the shared /trace mechanism; reuse it by construction. MEASURED at v0.7.97 (HEAD f5c35f94c). `presentation != function` ([[correct-by-construction]] / R27.2 / R31.5 CONCEPT).

### ITEM 1 — DRAWER: embedded-below-tree → /trace-identical bottom-drawer(portrait)/side-panel(landscape)
**ROOT (measured, NOT layout-guess):** the drawer element carries NO positioning of its own — `app.css:282 rb-detail-drawer{position:static}` is a *flex child*, not an overlay. On /trace it looks like a bottom-drawer ONLY because it is a flex child of `.trace-page` (`app.css:271 display:flex;flex-direction:column;height:calc(100vh-44px)`) sitting under `.trace-tree-panel{flex:1;overflow-y:auto}` (tree scrolls, drawer pinned bottom, `max-height:40vh`); at ≥1025px `app.css:277` flips it to a side Details panel. **The SM page reproduces NEITHER:** (a) shell `server.ts:850` renders `<rb-trace-tree id=sm-tree>` as a BARE `<body>` child — no `.trace-page`/`.trace-tree-panel` wrapper; (b) client `server-manager.ts:21` appends the drawer to `document.body` (NOT `.trace-page`). So the static drawer falls into normal block flow → stacks inline *below* the tree = IMG_4605. `/trace` does it right at `trace-page.ts:35-37` (`createElement → (querySelector('.trace-page')||body).appendChild`).
**FIX = copy the /trace container + mount verbatim (positioning-only, ZERO shared-CSS/JS change, DRY):**

| File | Line | Current (BUG) | Fix |
|------|------|---------------|-----|
| `src/ts/server/server.ts` | 850 (`serverManagerPage`) | `<rb-trace-tree id="sm-tree" data-always-expanded></rb-trace-tree><div id="err"></div>` (bare body child) | wrap in the /trace container: `<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="sm-tree"></rb-trace-tree><div id="err"></div></div></div>` (drop `data-always-expanded` here too — client already removes it :26; keep layer-by-layer) |
| `src/ts/server/server.ts` | 843 | `#sm-tree{display:block;padding:8px 12px}` | delete (the shared `.trace-tree-panel`/tree CSS owns layout now; leaving it fights the flex child) |
| `src/ts/server/server.ts` | 845-847 | `.sm-term-overlay{position:fixed;inset:0…}` + `.bar`/`.body` | DELETE — dead CSS from the retired showElement/openTerminal overlay fork (terminal is a drawer detail-view since v0.7.96); misleading, keep the page fork-free |
| `src/ts/server/server.ts` | 840-848 `<style>` | body has no viewport flex column; SM `<header>` ≠ /trace's 44px pageNav so `.trace-page`'s `calc(100vh-44px)` is wrong here | add SM-page-local (positioning-only, does NOT touch shared rules): `body{display:flex;flex-direction:column;height:100dvh;overflow:hidden}` + `.trace-page{height:auto;flex:1;min-height:0}` so the SM header takes natural height and `.trace-page` fills the rest (header + tree-scroll + bottom drawer) |
| `src/public/ts/server-manager/server-manager.ts` | 20-22 | `…document.body.appendChild(d)` | mirror trace-page.ts:36-37 EXACTLY: `const host = document.querySelector('.trace-page') || document.body; host.appendChild(d);` (drawer becomes a `.trace-page` flex sibling → shared CSS pins it bottom portrait / side landscape) |

Copy-paste (server-manager.ts:20-22):
```ts
if (!document.getElementById('sm-drawer')) {
  const d = document.createElement('rb-detail-drawer'); d.id = 'sm-drawer';
  const host = document.querySelector('.trace-page') || document.body; // R31.4: flex child of .trace-page = /trace-identical bottom/side drawer (positioning != function)
  host.appendChild(d);
}
```
**By construction:** identical DOM ancestry ⇒ identical `app.css` rules ⇒ identical behavior (portrait bottom-drawer w/ grab-bar peek/expand + swipe; landscape side Details panel) with NO new CSS and NO change to the shared drawer/tree — pure position, function untouched. Realizes R31.5 `data-position` idea minimally today (same element, container decides position).

### ITEM 2 — BADGE: bespoke `nodeChildCount`/`split(':')` map → std parent→children REFERENCE count (like the scenario tree)
**ROOT (measured):** the otmux node uuids CONTAIN colons — `sess:<name>` (server.ts:909), `win:<sess>:<idx>` (:913), pane `%N`. The badge does NOT count the node's own children references; it round-trips through a side map `nodeChildCount: Map<uuid,number>` (rb-trace-tree.ts:49) whose key is derived by colon-splitting (`refUuid`=slice-after-FIRST-colon :516; `rb-object-item.parts()` type=`ref.split(':')[0]` :115). Every colon-bearing id is one more chance for the set-key (raw `uuid` param) and the get-key (`refUuid(ref)`) to diverge — the RECURRING colon bug, re-patched at R30.2 (:522), R31.3 (:335), v0.7.97 session own-count (:338-341). IMG_4605 = sessions badge `[0]` while their built child `window 0` shows `[1]`: the eager-map lookup missed the session key again (and/or a stale cached bundle served the pre-patch path — the fork also defeats SW cache-busting because it keeps changing). **The scenario/traceability tree doesn't have this class of bug** because a node's child count is the LENGTH OF ITS CHILD-REFERENCE ARRAY (`TraceObject.children` :151 / the inline `children[]` the server emits), counted directly — no uuid re-derivation.
**FIX = badge from the node's OWN child-reference count, stored ON the node; retire the map + colon key (correct-by-construction):**

| File | Line | Current (BUG) | Fix |
|------|------|---------------|-----|
| `src/public/ts/trace/rb-trace-tree.ts` | 325-342 `buildSeedNode` | count threaded via `childCount`+`nodeChildCount.set/get(uuid)` (colon-fragile) | at build, stamp the authoritative reference count on the node element: `node.dataset.childRefCount = String((children?.length) || (hasChildren ? (serverChildCount ?? '') : 0))`. Keep `child-count` on the item for first paint, but the SOURCE OF TRUTH is `dataset.childRefCount` (an array length, no key lookup) |
| `src/public/ts/trace/rb-trace-tree.ts` | 510-520 `computeBadges` | `uuid=refUuid(ref)`; `nodeChildCount.get(uuid)`; `prefetchCache.get(uuid)` — all colon-keyed | badge = `Math.max(domCount, Number(node.dataset.childRefCount)||0)` — real built rows once a layer exists, else the stamped reference count. NO `refUuid`, NO map, NO split. Colon-immune by construction |
| `src/public/ts/trace/rb-trace-tree.ts` | 522-527 `eagerChildCountBadges` + 49 `nodeChildCount` | eager-map indirection | RETIRE for the inline path. For the /trace API-lazy path, write the server's per-node `childCount` into the SAME `node.dataset.childRefCount` at build (fetchAndRenderChildren :564-565 / prefetch :536) — one badge source for BOTH trees |
| `src/ts/server/server.ts` | 908-918 `/tree` roots | session node has neither `hasChildren` nor a count field | belt-and-suspenders parity with scenario nodes: add `hasChildren: s.windows.length>0` on the session (windows/panes already have it). Reference array already present; this just makes the chevron/count deterministic without relying on `children.length>0` re-derivation |

**Model:** session→window→pane are OO-referenced nodes exactly like scenario req→uc→class…; badge = `children.length` (the reference count) at each level, materialized to real DOM count on expand. One mechanism for scenario tree AND otmux tree ⇒ the colon fork cannot recur (nothing splits a colon). If the map is fully retired, `import {…refUuid}` stays used elsewhere (nav) — only the badge path drops it.

### INV / scope / gate / chain
- **Both client-side except the two small server.ts shell/JSON tweaks** (page container + `.sm-term-overlay` delete + session `hasChildren`). `rb-trace-tree`/`rb-detail-drawer`/`rb-object-item` are SHARED → **/trace + /scenario MUST be regression-checked** (detail open/scroll/grab-bar + badges at every level). No owner-gate/cookie/INV-G change (R31.2 choke-point + ws upgrade untouched) — restart needed (server.ts edited) but INV-G1/G2/G3 must stay green.
- **GATE (tester chromium + Tron device):** (1) /server-manager terminal drawer = bottom overlay in portrait (grab-bar peek/expand, swipe-down, NOT stacked-inline) + side Details panel ≥1025px, pane-tap opens it, RW keystrokes, closeable; identical scroll/handle to a /trace detail. (2) badges show real N at EVERY level (session/window) pre- and post-expand, colon ids and all; /trace + /scenario badges + detail flow unregressed; INV-G1/G2/G3 live-403 unregressed.
- **Chain:** both fixes ride existing units — ITEM 1 client render on Method `RbTerminalDetail.mount 386cc4e4`/Impl `79a1ce7c` (drawer container is its host) + server shell has no new type; ITEM 2 on `RbTraceTree.buildSeedNode`/`computeBadges` (Impl `5b3d9f1a`, off UC `6b1132ce`, Method `08ad3bdd`). Whichever champagne-Test req mints → I mint/repoint Impl markers if the expert env can't. Design-only here; expert builds; I backstop + restart remoteShells:0.2.

### ARCHITECT BACKSTOP — v0.7.99 / 86c4033fb (robbin-architect 2026-07-20): **PASS**
Expert shipped both FINAL-SPEC items; I restarted remoteShells:0.2 → served **0.7.99**.
- **STATIC (vs spec, both items match):** ITEM1 — SM shell wraps `<div class=trace-page><div class=trace-tree-panel><rb-trace-tree id=sm-tree>` (server.ts:848) + SM-local `.trace-page{height:auto;flex:1;min-height:0}` (:844) + drawer appended into `.trace-page||body` (server-manager.ts:22, mirrors trace-page.ts) + dead `.sm-term-overlay` DELETED (grep 0). Zero shared-CSS/JS change. ITEM2 — badge source-of-truth = `node.dataset.childRefCount` stamped at build (buildSeedNode:340 inline/server count; nodeEl:252 `childRefs.length`=obj.children ref count — the scenario-tree native pattern) + `computeBadges = Math.max(domCount, refCount)` (:519, colon-immune); `nodeChildCount` map + `eagerChildCountBadges` RETIRED (grep: 4 comment-only refs, 0 live; method gone). `/tree` session gains `hasChildren`.
- **LIVE:** restart fresh, served 0.7.99. INV-G reject-direction UNREGRESSED — `/server-manager`, `/api/server-manager/tree`, `/api/server-manager/whoami` all **403** non-owner; page **no-leak** (21B, no `<rb-trace-tree>`). INV-G2 literal ==**1** (ServerManagerGuard.ts:12). `/trace`+`/scenario` **200** (shared-component regression smoke). Served shared bundle `/dist/trace-page-UDTNCDZU.js` carries `childRefCount` ×4, `nodeChildCount` ×**0** — deployment complete.
- **403-LIMITED (Tron device, un-mockable solo):** authed visuals — drawer = /trace-identical bottom-drawer(portrait)/side-panel(landscape), pane-tap opens terminal in it, badges show real N at every level (session/window) incl collapsed. Tester chromium-owner + Tron device confirm.
- **ORPHAN FLAG:** retiring `eagerChildCountBadges` orphans its Impl `d28ee95a` — expert pinged req to retire; confirmed clean orphan (method genuinely removed, no dangling caller). Req retires the unit (or I mint the retirement if its env can't).
