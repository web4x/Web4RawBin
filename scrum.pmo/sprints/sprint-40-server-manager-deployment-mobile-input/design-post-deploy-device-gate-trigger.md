# Post-Deploy Device-Gate Trigger (mechanism) — item 1 of the campaign design package

**Author:** robbin-architect · 2026-08-08. PO-authorized (dependency root; R40.19 + R40.20 device gates depend on this). DESIGN → expert builds into the deploy → I backstop. Likely req R40.18 (number TBD by req/PO).

## THE PROBLEM IT SOLVES
Our visual/device gates run **NOWHERE after a deploy** — which is exactly why regressions reach Tron by screenshot instead of a red gate. The S23 audio player **worked, then regressed silently for a whole sprint** because its AC was headless-only and **nothing ever re-ran it** against the live artifact. A gate that never re-runs certifies nothing.

## MEASURED (disk, v0.8.74)
- **`gate:device:live`** (d5148b7d3) = `node test/visual/r4012-music-player-pixel-gate.mjs && node test/visual/r4011-carveout-unresolved-gate.mjs` — the live-prod **WebKit@390** device-gate lane. Read-only, targets specific units, each FAILS on its regression, proven exit-0 GREEN DET-3x. **NOT in `ci:gates`** (needs live prod + webkit + running server — can't join the headless static lane). ← the named lane items 2/3 get ADDED to.
- **Deploy definition-of-done today** (`start.mjs`): after restart it runs R31.7 version guards — `versionGuardTreeClean` (INV-V3) + `versionGuardAgreement` (INV-V1). So the deploy ALREADY has a post-restart verify phase to extend. The gap: it verifies the VERSION, never the live DEVICE behaviour.
- **`record-gates.ts`**: records a gate as a **durable scenario UNIT** (`gate:<type>:<verdict>:<items>:<date>` → scenario/index shard) with verdict + evidence + gated Task/Test UUIDs + gated-by. Gate results are queryable graph units, not logs. ← where device-gate results land.

## DESIGN — the device gate becomes part of the deploy's definition-of-done
**WHAT FIRES + WHERE:** extend the deploy's post-restart verify phase. After restart + `served==committed` (the existing R31.7 guards pass), run the device gate as the FINAL deploy step. **A deploy is not "verified/done" until the post-deploy device gate is GREEN.** Mechanism: `scripts/post-deploy-gate.mjs`, invoked at the end of the deploy path (start.mjs / the expert-owned deploy sequence).
- **HOW `gate:device:live` is invoked:** the trigger runs the EXISTING named lane (`npm run gate:device:live`) against the LIVE prod server (WebKit@390) — no new gate machinery, just automatic invocation instead of relying on someone remembering. Optionally DET-3x (the lane is already DET-3x proven).
- **WHERE results land:** `record-gates.ts` writes a **version-stamped `device-gate` unit** (verdict GREEN | RED | **NOT-RUN**, served version, evidence, gated Test/req UUIDs, timestamp) → durable, queryable. PLUS a served **`/api/gate-status`** (latest device-gate verdict + version) so the state is visible, not buried.
- **HOW A FAILURE BECOMES LOUD (not a log nobody reads) — four levers, strongest first:**
  1. **BLOCKS deploy-done:** `post-deploy-gate.mjs` exits non-zero on RED/NOT-RUN → the deploy sequence FAILS → the expert's deploy report shows **served-but-gate-RED = an explicit un-verified state** (owned, not silent). A red device gate means the deploy did not finish.
  2. **Durable RED unit** (record-gates) — visible in traceability, version-stamped ("v0.8.74 device-gate RED"), not a transient log line.
  3. **Notifies a human:** post to PO/SM (otmux) + the served `/api/gate-status` the SM/console/update-banner can show RED.
  4. The deploy owner (expert) cannot mark the ship complete while the gate is RED — closes the "nobody re-checked" hole that killed the music player.

## ★ FAIL-CLOSED — NOT-RUN is a FAILURE state (the rule that makes it real)
A device gate that **cannot run** — webkit runner unavailable, server not serving, device offline, timeout, `gate:device:live` errors before asserting — records **`NOT-RUN`, and NOT-RUN is treated as RED**: it blocks deploy-done and surfaces loud, exactly like a failed assertion. **Never a silent pass, never skipped.** This is the R-C3 fail-closed-on-unrunnable rule applied to device gates: the S23 regression was precisely a gate that *never ran*, so "couldn't run the real gate" must be as loud as "the gate failed." **A gate that is not known-GREEN is RED.**

## ★ NO SKIP / BYPASS FLAG — EVER (PO guard 1, 2026-08-08; prohibition baked in for future agents)
**There is NO silencer.** The moment device gates can block deploy-done, someone will want a `--skip-device-gate` to get a ship out — the same pressure that already produced an unattributed edit removing `check:task-status` from `ci:gates` to green CI over drift. So the design MUST NOT provide one, and this paragraph is written so a future agent reads the prohibition before adding one:
> Shipping without a green device gate is **ALLOWED** — but it is RECORDED as **served-but-UNVERIFIED** (the RED/NOT-RUN device-gate unit + `/api/gate-status`), **never as done and never silenceable.** There is no flag, env var, or config that turns a RED/NOT-RUN device gate GREEN or hides it. Any future bypass must be a **committed, justified, visible state** (an explicit recorded override with an author and reason), not a silent skip. A trigger that can be silently no-op'd is the S23 disease one level up.

## ★ GATE-STATUS VISIBLE TO TRON (PO guard 2, 2026-08-08 — close the loop to the last-resort detector)
Tron is currently the regression detector of last resort — he finds them by screenshot on his phone. A durable unit the humans never see still leaves him as the fallback. So `/api/gate-status` MUST surface where he actually looks: an **owner-gated UI badge** (profile / server-manager / a persistent header badge) answering at a glance: **"is what is served RIGHT NOW verified on a real device, and at which version?"** — GREEN vN / RED vN / **NOT-RUN vN**. Owner-gated (reuse `ServerManagerGuard`), read-only, always reflects the LATEST device-gate unit for the served version. This closes the loop to the person currently doing the gate's job manually: he sees "served v0.8.74 — device-gate RED" without hunting a screenshot regression himself.

## INVARIANTS
- **INV-PDG-1 deploy-done REQUIRES device-GREEN:** a deploy is verified ONLY if the post-deploy device gate is GREEN; RED/NOT-RUN → deploy un-verified (blocks the done-state, exits non-zero).
- **INV-PDG-2 NOT-RUN == FAILURE (fail-closed):** an unrunnable device gate records NOT-RUN = RED; never silent-pass/skip.
- **INV-PDG-3 durable + visible:** every run records a version-stamped device-gate unit + updates `/api/gate-status`; a failure reaches a human (PO/SM), not just a log.
- **INV-PDG-4 real-artifact:** the gate runs against the LIVE served version at WebKit@390 — it certifies what Tron will actually load, not the build tree.
- **INV-PDG-5 NO-SILENCER:** no flag/env/config turns a RED/NOT-RUN device gate GREEN or hides it; a bypass exists only as a committed, authored, visible override state — never a silent skip.
- **INV-PDG-6 VISIBLE-TO-TRON:** `/api/gate-status` surfaces in an owner-gated UI badge answering "served version verified on a real device? at which version?" — the last-resort human detector sees the gate's verdict at a glance.

## GATE — meta-gate the trigger itself (stub-must-fail applied to the trigger)
- **trigger-fires BITE:** after a deploy, assert a `device-gate` unit was recorded for the served version — no deploy without a device-gate record.
- **fail-closed BITE:** stub the webkit runner unavailable → the trigger records NOT-RUN + exits non-zero (RED); it MUST NOT pass. (Stub-must-fail on the trigger, not just the gates it runs.)
- **loud BITE:** a RED device gate → deploy-done blocked + notify fired (assert the deploy reports un-verified).
- **regression-replay BITE:** reproduce the S23 shape (a gate's live target regresses) → the post-deploy trigger catches it RED. This is the whole point — the gate that would have caught the music player.

## CHAIN + deploy + dependency
- Chain: UC `deploy.postDeployDeviceGate` → Class `DeviceGateTrigger` → Method `runAndRecord` → Impl → the meta-BITEs. req mints at build-go (assign R40.18?).
- **Deploy:** this IS deploy-infra (start.mjs + scripts) — the expert owns the deploy, so the trigger is built INTO the expert-owned deploy sequence; I design, expert builds, I backstop (trigger-fires + fail-closed + loud + regression-replay).
- **Dependency:** R40.19 (item 2) and R40.20 (item 3) device gates get ADDED to `gate:device:live`, so they auto-run post-deploy via THIS trigger. Build item 1 first.
