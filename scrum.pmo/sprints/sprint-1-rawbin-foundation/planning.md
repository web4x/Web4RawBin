# Sprint 1 Planning - RawBin Foundation

## Sprint Goal
Establish the foundation for RawBin — an AI-driven server management interface powered by the AI assistant "Robbin".

## Sprint Overview
**Duration:** TBD
**Focus:** Architecture, core infrastructure, QnD→RawBin fork
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directives via iphone:0.0

## Architecture

```
Robbin (AI Assistant)
  │
  ├── Server Monitoring — health, resources, alerts
  ├── Server Management — deploy, configure, scale
  ├── Infrastructure Ops — DNS, TLS, networking
  └── Self-Healing — detect anomalies, auto-remediate
```

## Task List (Sprint 1 - RawBin Foundation)

> **Note:** Subtasks must be named to indicate the affected role (e.g., `task-1.1-developer-setup.md`). Subtasks must be ordered to avoid blocking dependencies. If a blocking dependency is unavoidable, the Scrum Master is responsible for removing the impediment by reordering or splitting tasks.

- [x] [Task 1: Bootstrap robbinTeam from ud-team Clone](./task-1-team-bootstrap.md)
  **Priority:** 1 (CRITICAL - No team, no work) **Status:** DONE
  - [x] [Task 1.1: Agent-Trainer - Clone ud-team as robbinTeam](./task-1.1-agent-trainer-clone-ud-team.md)
  - [x] [Task 1.2: Agent-Trainer - Rename and Rebrand Agents](./task-1.2-agent-trainer-rename-rebrand-agents.md)
  - [x] [Task 1.3: PO - Verify Team Operational](./task-1.3-po-verify-team-operational.md)

- [x] [Task 2: Define RawBin Architecture (Fork from QnD)](./task-2-rawbin-architecture.md)
  **Priority:** 2 (HIGH - Architecture before implementation) **Status:** DONE
  - [PO Plan](./task-2-rawbin-architecture.md) — keep/remove/rename lists, key decisions
  - [Architect Analysis](./task-2-rawbin-architecture-definition.md) — 458-line codebase audit
  - Approved by Tron 2026-05-22

- [x] [Task 3: Create Room.ts from GameRoom.ts](./task-3-room-ts.md)
  **Priority:** 3 (CRITICAL) **Status:** DONE
  - Room.ts 297 lines, 33/33 vitest pass

- [x] [Task 4: Strip server.ts of Game Logic](./task-4-strip-server.md)
  **Priority:** 4 (HIGH) **Status:** DONE
  - server.ts 910 lines, MessageTypes 31 messages, profiles+devices separated

- [x] [Task 5: Create RoomUI Client Components](./task-5-room-ui.md)
  **Priority:** 5 (HIGH) **Status:** DONE
  - 6 client files (637 lines), esbuild 14.5kb

- [x] [Task 6: Rebrand Assets (UpDown → RawBin)](./task-6-rebrand.md)
  **Priority:** 6 (MEDIUM) **Status:** DONE
  - Zero UpDown references, full RawBin branding

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 6/6 DONE |
| Expert effort | ~8h |
| Tester effort | ~3.5h |
| Files: QnD → RawBin | 23 → 12 |
| Lines: QnD → RawBin | 7,549 → ~2,161 (71% removed) |
| Tests | 33 room tests pass |

## Definition of Done
- [x] All task acceptance criteria met
- [x] `npm run dev` starts server
- [x] `npm run build` bundles client
- [x] All vitest tests pass
- [x] No "UpDown" or game references in codebase
- [x] File-backed room + profile persistence works

## Sprint Metrics
- Tasks completed: 6/6
- Sprint completed: 2026-05-22

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-22
**Sprint:** Sprint 1 - RawBin Foundation
