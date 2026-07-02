# Sprint 29 — Server & Dev Lifecycle — Planning

**Requirements:** [requirements.md](./requirements.md). **Source:** Tron 2026-07-02 (retroactive #126 for shipped start.mjs self-heal).

## Sprint Goal

Infra: a self-healing `npm start` that boots the server AND preserves its interactive foreground TUI (readline + live request-log), consistent across WODA.prod + WODA.test, driven in the remoteShells otmux session.

## Use Cases

| Anchor | UseCase | UC UUID | Covers | Class |
|--------|---------|---------|--------|-------|
| <a id="uc29-1"></a>UC29.1 | serverLifecycle.selfHealingStart | db5835f5-4080-43af-bf7d-e43e2f89d15c | R29.1 | start.mjs / ServerLauncher |

## Definition of Done

- `npm start` self-heals (node18+, deps, kill-old, build) from npm-only prereq; server runs foreground with TUI + live log stream identical to `tsx server.ts`; prod+test identical; verified live in remoteShells:0.2 (prod) + 0.3 (test); idempotent restart.

---

*Planned by robbin-req 2026-07-02. Sprint 29 — Server & Dev Lifecycle (infra).*
