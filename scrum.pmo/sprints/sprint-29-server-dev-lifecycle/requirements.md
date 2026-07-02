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

---

## Traceability Matrix

| Req | Name | Requirement UUID | UC UUID |
|-----|------|------------------|---------|
| R29.1 | Self-healing npm start preserving server TUI | e25f1437-4273-4fe0-8b26-76249fa15604 | db5835f5-4080-43af-bf7d-e43e2f89d15c |

*Captured by robbin-req 2026-07-02. Infra sprint. Retroactive #126 chain for the shipped self-heal.*
