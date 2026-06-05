# RawBin

AI-driven Server Management Interface. Meet **Robbin**, your AI server management assistant.

## Quick Start

```bash
npm install
npm run dev      # Development (auto-reload)
npm start        # Production (build + start)
```

Server runs on HTTPS port 4444 with auto-generated self-signed certificate. HTTP port 4000 redirects to HTTPS.

**Live:** [https://home.donges.it:4444/app](https://home.donges.it:4444/app)

## Architecture

```
rawbin/
├── src/
│   ├── ts/server/
│   │   ├── server.ts        # HTTPS + WebSocket + HTTP routes + TUI
│   │   └── Room.ts          # Room + RoomMember + RoomManager
│   ├── ts/shared/
│   │   └── MessageTypes.ts  # WebSocket message type enum
│   └── public/
│       ├── ts/
│       │   ├── RawBinClient.ts   # WebSocket client
│       │   ├── RoomBrowser.ts    # Room list + create UI
│       │   └── RoomView.ts       # Room view (chat + members)
│       ├── app.html              # Main app entry
│       ├── app.css               # App styles
│       └── manifest.json         # PWA manifest
├── data/
│   ├── profiles.json        # User identity (no device data)
│   ├── devices.json         # Device records (ownerToken FK)
│   └── rooms/               # Persisted room state
├── test/vitest/             # Vitest test suite
└── scrum.pmo/               # Sprint planning
```

## Key Features

- **Rooms**: User-created shared workspaces with creator lifecycle (create/archive/delete)
- **Identity**: SSH key-based authentication with per-user keypairs (OOSH pattern)
- **Device Enrollment**: Per-device keys signed by user key, secret code verification
- **Challenge-Response Auth**: Cryptographic login via Web Crypto API (RSASSA-PKCS1-v1_5)
- **Profile Gate**: New users must complete profile before room access
- **vCard**: Download other users' contact cards (V3.0 format)
- **Privacy**: Profiles and device data strictly separated (ownerToken FK)
- **Bug Reports**: In-app submission with PO pipeline via otmux
- **PWA**: Installable progressive web app
- **TUI**: Terminal UI with server status, client list, live log
- **Docs**: Markdown viewer with PlantUML SVG support for sprint planning

## Repository

- **Organization**: [web4x](https://github.com/web4x)
- **License**: MIT

## App

**[Open RawBin App](https://home.donges.it:4444/app)**

## Sprint Planning

Browse all sprint documentation, task files, and architecture diagrams:

**[Sprints Overview](./scrum.pmo/sprints/sprints.overview.md)** — durable index of ALL sprints (S1-S14)
**[Sprint Browser](/md/scrum.pmo/sprints/)** — dynamic in-app index

Individual sprints:
- [Sprint 1 — Foundation](./scrum.pmo/sprints/sprint-1-rawbin-foundation/planning.md)
- [Sprint 2 — Identity & SSH](./scrum.pmo/sprints/sprint-2-identity-ssh/planning.md)
- [Sprint 3 — E2E & Hardening](./scrum.pmo/sprints/sprint-3-e2e-hardening/planning.md)
- [Sprint 4 — Traceability](./scrum.pmo/sprints/sprint-4-traceability/planning.md)
- [Sprint 5 — PWA & Offline](./scrum.pmo/sprints/sprint-5-pwa-offline/planning.md)
- [Sprint 6 — Web Components](./scrum.pmo/sprints/sprint-6-web-components/planning.md)
- [Sprint 7 — Encrypted Storage](./scrum.pmo/sprints/sprint-7-encrypted-storage/planning.md)
- [Sprint 8 — Monaco Editor](./scrum.pmo/sprints/sprint-8-monaco-editor/planning.md)
- [Sprint 9 — Room Identity](./scrum.pmo/sprints/sprint-9-room-identity/planning.md)
- [Sprint 10 — Contacts UI](./scrum.pmo/sprints/sprint-10-contacts-ui/planning.md)
- [Sprint 11 — Traceability Standardization](./scrum.pmo/sprints/sprint-11-traceability/planning.md)
- [Sprint 12 — Editor Fixes](./scrum.pmo/sprints/sprint-12-editor-fixes/planning.md)
- [Sprint 13 — Stability](./scrum.pmo/sprints/sprint-13-stability/planning.md)
- [Sprint 14 — Legacy Data Migration](./scrum.pmo/sprints/sprint-14-legacy-migration/planning.md)
- [Sprint 15 — Traceability Browser & Object Model](./scrum.pmo/sprints/sprint-15-traceability-browser/planning.md)
- [Sprint 16 — Traceability UX & DetailViews](./scrum.pmo/sprints/sprint-16-traceability-ux/planning.md)
- [Sprint 17 — Scenario Units / IOR Data Model & Class Views](./scrum.pmo/sprints/sprint-17-scenario-units/planning.md)
- [Sprint 18 — Chain method-scope & role skills](./scrum.pmo/sprints/sprint-18-chain-method-scope/planning.md)

## Traceability

Browse the requirement → use case → PUML → class/method → test chain:

- **[Traceability Matrix](./scrum.pmo/traceability-matrix.md)** — browsable per-task chain-coverage index (all tasks, S1-9 + active)
- [Traceability Standard](./scrum.pmo/standards/traceability-standard.md) — the UUID chain convention (req/uc/class/impl/test tags)
- [Sprint 1 Traceability Audit](./scrum.pmo/standards/sprint-1-traceability-audit.md)
- [Sprints 2-9 Traceability Audit](./scrum.pmo/standards/sprints-2-9-traceability-audit.md)
- [Sprints Overview](./scrum.pmo/sprints/sprints.overview.md) — all sprints: status + task counts
- [Task Backlog](./scrum.pmo/backlog.md) — untriaged items
