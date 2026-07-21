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

## RESOLUTION — real restart done + all 3 server-side backstops RE-VALIDATED CLEAN (robbin-architect 2026-07-20)
Drove the REAL restart in remoteShells:0.2 (expert-confirmed): Ctrl-C (SIGINT foreground tsx+start.mjs) → `npm start` → start.mjs killed :4444 + build.mjs + spawned FRESH tsx. **Fresh process CONFIRMED: server.ts pid 683493→1217331, etimes 3.5h→21s.** Now re-validated each retracted backstop UNCONFOUNDED:
- **#3 BOOT-SWEEP = PASS (clean):** pre-seeded orphan `sm_archbackstop2` before restart → after the fresh boot `reapOrphans` killed it → **0 `sm_*`**. Unconfounded (the reap only runs at boot).
- **#1 PIN recompute = PASS (clean):** injected a DECOY (`taskUuid=decoy…`, `taskName=DECOY_STALE_PIN_SNAPSHOT`) into the PERSISTED `model.slots.current`, then GET the pin → served Current still = **Task 31.4 / 78dc780b** (live focus), decoy IGNORED → `slotsFrom` recompute-on-read is genuinely live (does NOT read `model.slots`). Singleton restored from backup after.
- **#2 COOKIE-ONLY = PASS (confound DEFEATED):** seeded the owner into `tokenToClient` via a real ws `IDENTIFY{playerToken:<owner>}`; while that session was LIVE — header `x-player-token=<owner>` → **200** (proves the session is present), but `?token=<owner>` → **403** and `?playerToken=<owner>` → **403**. So with a live owner, the query path is rejected = the header-only `playerTokenFrom` fix genuinely closed query-auth (NOT the session-absent confound).
- Sweep: INV-G2 literal ==1, no-token /server-manager 403, /trace+/scenario 200, 0 orphans, served v0.7.102.
**Net:** v0.7.100 pin + v0.7.101 cookie-only + v0.7.102 boot-sweep are NOW live + PROVEN. The earlier retractions are cleared — the fixes were always correct; they simply had never been deployed (the `r`-not-restart confound). Runbook hardening AC (expert, scenario-first) still recommended: split `rebuild`(client) vs `restart`(server); don't trust `/api/config` version (reads package.json per-request) as a deploy signal — check the process PID.

## FOLLOW-ON INCIDENT — working-tree REVERTED to 0.7.99 (Tron phantom-update), RESOLVED 2026-07-21
Tron's PWA (SW `rawbin-v0.7.102`) polled the server, got **0.7.99**, and offered a phantom "update to 7.99". Root of the desync (measured, read-only first):
- Working tree had `package.json`=**0.7.99** (HEAD=0.7.102) AND — critically — `src/ts/server/server.ts` was **REVERTED to the 0.7.99 state**: stripped the `CurrentSprint` import, reverted the pin handler `slotsFrom(idx)`→`model.slots`, reverted cookie-only comments, and **removed `void PtyBridge.reapOrphans(addLog)`**. `build-manifest.json` also reverted. (Implementation files CurrentSprint.ts/ServerManagerGuard.ts/PtyBridge.ts were NOT touched — only server.ts lost the WIRING.)
- `/api/config` reads working-tree `package.json` per-request → served 0.7.99 (the same file-not-process confound as the parent finding).
- The LANDMINE: the running server (pid 1231421) was full 0.7.102 (decoy-proven live), but the next restart would have deployed the STRIPPED server.ts → silently losing pin-recompute + boot-sweep.
- NOT intentional / not mine: I never edited package.json or reverted server.ts; all v0.7.100/101/102 commits move the version FORWARD. Coherent "revert 3 files to the 0.7.99 commit" shape ⇒ most plausibly a stray `git checkout <0.7.99-commit> -- server.ts package.json build-manifest.json` or a `stash pop`, left unstaged (such a per-file checkout leaves NO reflog entry → hard to trace; root-cause continues with expert).

**RESOLVED:** restored the 3 files to HEAD (`git restore --source=HEAD`) — R31 wiring back (grep 3/3), package.json=0.7.102; `/api/config` served 0.7.102 immediately (file-read) = phantom cleared before restart. Then REAL restart (Ctrl-C→npm start, sole driver, expert held the pane): **fresh pid 1231421→2097434 (etimes 34s)**. VERIFIED all agree: **served==committed==working==SW==HEAD==0.7.102**; tree clean for the 3 files; pin recompute LIVE on the fresh boot (decoy ignored); INV-G no-token 403; /trace 200; 0 orphans. No R31 code lost (HEAD always had it; running process now provably from the clean tree). build-manifest diff was timestamp-only (identical bundle hashes) → restored to HEAD.
**HARDENING (adds to the runbook AC):** a server deploy must verify working-tree == HEAD for `server.ts`+`package.json` (not just the version string) BEFORE/after a restart; the file-per-request version + a per-file checkout make a silent code-revert invisible to `/api/config`.
