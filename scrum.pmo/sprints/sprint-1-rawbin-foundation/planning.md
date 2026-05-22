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

- [ ] [Task 3: Create Room.ts from GameRoom.ts](./task-3-room-ts.md)
  **Priority:** 3 (CRITICAL — blocks room work) **Status:** PLANNED
  **Effort:** 2h expert + 1h tester
  - Fork GameRoom.ts → Room.ts (~864 → ~300 lines)
  - Strip game state, rename to RoomMember/RoomInfo
  - Add file-backed persistence
  - Unit tests in vitest

- [ ] [Task 4: Strip server.ts of Game Logic](./task-4-strip-server.md)
  **Priority:** 4 (HIGH — largest task) **Status:** PLANNED
  **Effort:** 3h expert + 1h tester
  **Depends on:** Task 3
  - Strip game routes, WS handlers, data model
  - Import Room.ts, separate profiles.json / devices.json
  - Rebrand route titles, update MessageTypes.ts (46 → 31 messages)

- [ ] [Task 5: Create RoomUI Client Components](./task-5-room-ui.md)
  **Priority:** 5 (HIGH — user-facing) **Status:** PLANNED
  **Effort:** 2h expert + 1h tester
  **Depends on:** Tasks 3, 4
  - RoomBrowser.ts (room list + create)
  - RoomView.ts (inside-room: members, chat, settings)
  - RawBinClient.ts (WS client, stripped of game events)
  - app.ts entry point + esbuild config

- [ ] [Task 6: Rebrand Assets (UpDown → RawBin)](./task-6-rebrand.md)
  **Priority:** 6 (MEDIUM — cosmetic) **Status:** PLANNED
  **Effort:** 1h expert + 30min tester
  **Depends on:** Tasks 3-5
  - package.json, manifest.json, shell scripts, TUI, HTML pages, CSS vars, README

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 6 (2 done, 4 planned) |
| Expert effort | ~8h |
| Tester effort | ~3.5h |
| Files: QnD → RawBin | 23 → 12 |
| Lines: QnD → RawBin | 7,549 → ~2,161 (71% removed) |

## Definition of Done
- All task acceptance criteria met
- `npm run dev` starts server
- `npm run build` bundles client
- All vitest tests pass
- No "UpDown" or game references in codebase
- File-backed room + profile persistence works

## Sprint Metrics
- Tasks completed: 2/6
- Expert velocity: TBD (starts at Task 3)

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-22
**Sprint:** Sprint 1 - RawBin Foundation
