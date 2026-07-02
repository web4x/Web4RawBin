# Server-Lifecycle — start.mjs Foreground-TTY Handoff (design input)

**Author:** robbin-architect · 2026-07-02. **Design INPUT (scenario-first #126): holds for req's Server-Lifecycle req mint.** ⚠ MEASURED FIRST — the FIX IS ALREADY SHIPPED; this is a RETROACTIVE chain task, not a design/implement task.

## Measured state (don't re-implement)
The foreground-TTY fix the PO diagnosed is **already in the code**: `scripts/start.mjs:72` runs the server via **blocking `spawnSync(node18, [tsx, server.ts], {stdio:'inherit'})` + `process.exit(srv.status)`** (the `spawn` import was removed). Commit **`9b97021dd`** — "R27.6 fix: run server in FOREGROUND (blocking spawnSync)…". Its message diagnoses the exact root: *"Async spawn(server,{stdio:inherit}) detached the server from the pane's controlling TTY → live request-log/TUI went silent after boot. FIX: blocking spawnSync + process.exit(srv.status)."* So the async→sync foreground handoff is DONE and correct (it matches the build-step + the old direct-`tsx` behavior, and holds the pane's controlling TTY for the readline TUI).

## What's actually missing = the #126 chain (like R27.3)
- `scripts/start.mjs` carries **NO `[impl:uuid]` marker**, and there is **no Class/Method/Impl/UC** for it → chain-less shipped code (a #126 backfill).
- **Commit-label drift:** it shipped under the "R27.6" label, but the R27.6 *requirement* is "Repair the true-dangling refs surfaced by the ref-slot registry" — a different thing. So this fix correctly needs its **own Server-Lifecycle req** (as the PO is minting) — don't attach it to R27.6.

## Retroactive chain to wire (when req mints the Server-Lifecycle req + UC)
- UC **`serverLifecycle.foregroundHandoff`** → Class **`StartLauncher`** (via `mintOrReuseClass` on sourceFile `scripts/start.mjs` — reuse-by-file per R27.5 Axis 3; start.mjs is a function-module → ONE synthetic Class) → Method **`StartLauncher.runServerForeground`** (the blocking `spawnSync` + `process.exit(srv.status)` handoff) → Impl (**REAL**, `9b97021dd`, `scripts/start.mjs:72`, marker PENDING — expert places `[impl:uuid]`) → **Test** (tester: a gate asserting the server runs foreground / start.mjs blocks-and-exits-with-status, not detached).
- ACs the req should capture (behavioral, testable): (a) server runs in the FOREGROUND (start.mjs blocks until it exits); (b) `stdio:'inherit'` → server owns the controlling TTY (readline TUI streams live); (c) start.mjs exits with the server's status (`process.exit(srv.status)`); (d) NO async `spawn`/detach of the server; (e) self-heal steps (re-exec/deps/kill/build) unchanged above the handoff.

## Note
Design is trivial because the code is already right — the value here is the MEASUREMENT: fix shipped (9b97021dd), chain-less, mislabeled under R27.6. The task is to make the shipped fix HONEST (chain-to-Test), not to re-implement it. Retroactive #126, flagged like R27.1/R27.3.
