# DEPLOY FINDING — the prod server has NOT been restarting (robbin-architect, 2026-07-20)

**Severity: HIGH — server-side ships are not going live.** Surfaced while backstopping R31.4 boot-sweep (v0.7.102).

## Measured evidence
- Backstop test: seeded orphan tmux session `sm_archbackstop` on the DEFAULT socket (`/tmp/tmux-0/default`, the SAME socket the node server + OtmuxBridge use — verified: my socket lists `remoteShells`, `robbinTeam2`, `sm_archbackstop` together). Pressed `r` on remoteShells:0.2 (the "[r] rebuild" menu I've used all session). After: `sm_archbackstop` **SURVIVED** → the boot-sweep `PtyBridge.reapOrphans` (runs once in `startServers`) never fired → the process did not boot.
- `ps -eo pid,etimes` on `…/tsx…/server.ts` (pid 683493): **etimes ~12768s (~3.5h) and climbing** across my `r` presses = the SAME process persists; no restart.
- `scripts/start.mjs`: tsx is spawned ONCE (line 78, blocking foreground); **no `watch`, no reload** — so there is no hot-reload of server code either.
- The `[r] rebuild [d] stop` menu is NOT start.mjs (start.mjs has no stdin/menu handler) — it is a separate wrapper whose `r` rebuilds **client esbuild bundles** but does NOT restart the tsx server.

## Impact — what IS vs ISN'T live
- **LIVE (client, esbuild bundles served static off disk):** v0.7.99 drawer/badge (`childRefCount` in the served bundle), R31.3 tree bundle, rb-terminal-detail. These backstops (served-bundle grep) remain VALID.
- **NOT live (server .ts run by the 3.5h-old tsx process):** v0.7.99 page-shell (.trace-page wrap) + /tree `hasChildren`; **v0.7.100 pin recompute** (`CurrentSprint.slotsFrom`); **v0.7.101 cookie-only** (`playerTokenFrom` header-only); **v0.7.102 boot-sweep**. None activated.
- **`/api/config` version is READ FROM package.json per-request** → it reported 0.7.10x without the process running that code. My "poll until version" gate was measuring the FILE, not the process. Confound.

## Retractions (server-side backstops need RE-VALIDATION after a REAL restart)
- **v0.7.100 pin PASS = CONFOUNDED:** the served slots matched expected because the PLANNER's stopgap refreshed the persisted `model.slots`, NOT because `slotsFrom` recompute is live (old code still serves `model.slots`). Re-test after restart.
- **v0.7.101 cookie-only PASS = CONFOUNDED:** `?token=<owner>→403` is also explainable by the owner token not being in `tokenToClient` at test time (old code's query-fallback only authenticates a LIVE session). Not a clean proof of the header-only change. Re-test after restart.
- **v0.7.102 boot-sweep = UNPROVEN** (orphan survived).

## Corrective action
1. The correct restart is a REAL process restart (original runbook: Ctrl-C → `npm start`, i.e. re-run start.mjs which SIGTERMs the port + respawns) — NOT the wrapper's `r` rebuild. Expert owns start.mjs / the server; coordinate the restart method before touching prod.
2. After a genuine restart: re-run ALL server-side backstops — boot-sweep (0 `sm_*` after boot), pin recompute (mutate a status, re-read self-heals with NO persist), cookie-only (`?token=<owner>→403` with a KNOWN live owner session so the pre-fix baseline is 200).
3. Process fix (team): the deploy runbook must distinguish `rebuild` (client bundles) from `restart` (server .ts). Client ships auto-serve; SERVER ships require a real restart. Every server-side backstop this session was gated on a restart that did not happen.
