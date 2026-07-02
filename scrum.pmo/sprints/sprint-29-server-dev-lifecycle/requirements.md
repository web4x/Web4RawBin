[Back to Planning](./planning.md)

# Sprint 29 — Server & Dev Lifecycle — Requirements

**Source:** Tron directive 2026-07-02 (server lifecycle / npm start). RETROACTIVE — covers the already-shipped self-heal (start.mjs) = a #126 slip; captured scenario-first so the chain is traceable.
**Theme:** infrastructure — dev/server lifecycle, TUI preservation, prod/test consistency.

> **GENERATED-FROM-SCENARIO-UNITS view** — source of truth is the scenario units. Do not hand-edit.

---

## Requirements

- [ ] **R29.1 — Self-healing `npm start` that preserves the interactive server TUI**
  [requirement:uuid:e25f1437-4273-4fe0-8b26-76249fa15604]
  > TRON 2026-07-02: npm start = self-healing one-shot (re-exec node18+, deps, kill-old, build; prereq=npm only) that PRESERVES the interactive server TUI (foreground, readline + live request-log stream, like `tsx server.ts`), CONSISTENT prod+test, restart IN remoteShells (0.2=prod, 0.3=test), idempotent fresh restart. (Regression: prod via start.mjs went silent after boot; test streams the TUI.)
  npm start is a self-healing one-shot that boots the RawBin server AND preserves its interactive foreground TUI. It re-execs on node18+/node22, npm-installs if deps are missing, kills the old server, and builds - prerequisite is npm ONLY. Critically it runs the server in the FOREGROUND owning the controlling terminal, so the readline TUI + live request-log stream appear in the pane IDENTICAL to a direct 'tsx server.ts' (start.mjs must NOT background/detach or swallow stdio). Behavior is CONSISTENT across WODA.prod and WODA.test, and the restart + TUI-verify happens IN the remoteShells otmux session (0.2=WODA.prod npm, 0.3=WODA.test), where the interactive server actually lives - never in agent panes or ad-hoc shells. Each start is an idempotent fresh restart.
  *(retroactive: self-heal shipped in start.mjs before the req = #126 slip; chain completed scenario-first. Impl base: start.mjs / package.json start script.)*
  **Acceptance criteria:**
  - [ ] **(self-heal)** `npm start` is a self-healing one-shot: re-execs on node18+/node22, `npm i` if deps missing, kills the old server, builds — the ONLY prerequisite is npm (no node-version / deps assumptions).
  - [ ] **★ (tui-preserve)** It PRESERVES the interactive server TUI: the server runs in the FOREGROUND owning the controlling terminal, so the readline TUI + live request-log stream appear in the pane IDENTICAL to a direct `tsx server.ts`; start.mjs must NOT background/detach the server or swallow stdio.
  - [ ] **(consistent)** Behavior is CONSISTENT across WODA.prod + WODA.test — both stream the TUI identically (fixes the regression: test streamed the TUI, prod via start.mjs went silent after boot).
  - [ ] **(remoteShells)** The restart + TUI-verify is performed IN the remoteShells otmux session — remoteShells:0.2 = WODA.prod (npm), remoteShells:0.3 = WODA.test — where the interactive server lives; NOT in agent panes or ad-hoc shells.
  - [ ] **(idempotent)** Each start is an idempotent fresh restart (kill-old → clean boot); repeated starts leave one fresh server.
  → [UC29.1: serverLifecycle.selfHealingStart](./planning.md#uc29-1) `[uc:uuid:db5835f5-4080-43af-bf7d-e43e2f89d15c]` *(placeholder — architect to refine; Class start.mjs/ServerLauncher)*

- [~] **R29.2 — Chain-before-ship gate** — ★ SUPERSEDED/FOLDED into R27.5 (AC-marker-chain-detect + AC-chain-gate-enforce) per PO one-home ruling 2026-07-02. Kept as tombstone.
  [requirement:uuid:ad69dfa4-00a0-4874-b7e3-0075f6c6d927]
  > PO 2026-07-02: FAIL the build if a NEW [impl:uuid] on src has no linked Requirement chain (UC->Class->Method->Impl->Req resolves). DELTA-scoped (new only; legacy deferred, no false-red). The by-construction END of the retroactive-#126 tax (4x this session, twice PO's slip).
  A pre-commit + CI gate that HARD-FAILS when a NEW [impl:uuid] marker on src lacks a resolving Requirement chain; DELTA-scoped (legacy chain-less = deferred/reported). Makes code-before-chain impossible, not corrected-after.
  *(reuses R27.5 marker-has-chain audit (Axis 4) for detection; enforces it as a blocking gate. Fits R24.5 trace:audit:strict / ci:gates.)*
  **Acceptance criteria:**
  - [ ] **(delta-gate)** trace:audit:strict + a pre-commit hook HARD-FAIL the build when a NEW [impl:uuid] marker on src has no linked Requirement chain (marker's Impl unit resolves AND is reachable Requirement->UseCase->Class->Method->Impl).
  - [ ] **(delta-scoped)** DELTA not absolute: ONLY new chain-less impls fail; pre-existing legacy chain-less markers are deferred/reported (no false-red) - same delta-vs-absolute discipline as R27.2 INV2.
  - [ ] **(pre-commit + CI)** The gate runs at PRE-COMMIT (block before the commit lands) AND in CI (ci:gates), so code-before-chain is caught at the earliest point.
  - [ ] **(single-source detection)** Detection REUSES R27.5's marker-has-chain audit (Axis 4) - no duplicate audit logic; R29.2 is the enforcement layer.
  - [ ] **(verify)** A NEW impl marker with no Requirement chain -> RED build; a fully-chained impl -> GREEN; a legacy chain-less marker -> reported, not failed. Verified against the 4 retroactive-#126 cases as regression fixtures.
  → [UC29.2: buildGate.chainBeforeShip](./planning.md#uc29-2) `[uc:uuid:0ec831d0-3c6b-4fea-aa22-78be9e8f7151]` *(placeholder - architect to refine; Class trace-audit / pre-commit hook)*


---

## Traceability Matrix

| Req | Name | Requirement UUID | UC UUID |
|-----|------|------------------|---------|
| R29.1 | Self-healing npm start preserving server TUI | e25f1437-4273-4fe0-8b26-76249fa15604 | db5835f5-4080-43af-bf7d-e43e2f89d15c |
| R29.2 | Chain-before-ship gate (marker needs chain) | ad69dfa4-00a0-4874-b7e3-0075f6c6d927 | 0ec831d0-3c6b-4fea-aa22-78be9e8f7151 |

*Captured by robbin-req 2026-07-02. Infra sprint. Retroactive #126 chain for the shipped self-heal.*
