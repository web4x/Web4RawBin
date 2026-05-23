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

**[Sprint Overview](/md/scrum.pmo/sprints/)** — dynamic index of all sprints

Individual sprints:
- [Sprint 1 — Foundation](./scrum.pmo/sprints/sprint-1-rawbin-foundation/planning.md)
- [Sprint 2 — Identity & SSH](./scrum.pmo/sprints/sprint-2-identity-ssh/planning.md)
- [Sprint 3 — E2E & Hardening](./scrum.pmo/sprints/sprint-3-e2e-hardening/planning.md)
