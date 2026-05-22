# RawBin

AI-driven Server Management Interface. Meet **Robbin**, your AI server management assistant.

## Quick Start

```bash
npm install
npm run dev      # Development (auto-reload)
npm start        # Production (build + start)
```

Server runs on HTTPS (port 3443) with auto-generated self-signed certificate. HTTP (port 3000) redirects to HTTPS.

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

- **Rooms**: User-created with creator lifecycle (create/archive/delete)
- **Identity**: Token-based profiles with device tracking, account linking
- **Privacy**: User profiles and device data strictly separated (ownerToken FK)
- **Bug Reports**: In-app submission with PO pipeline via otmux
- **PWA**: Installable progressive web app
- **TUI**: Terminal UI with server status, client list, live log
- **Docs**: Markdown viewer for project documentation and sprint planning

## Repository

- **Organization**: [web4x](https://github.com/web4x)
- **License**: MIT

## Sprint Planning

See [Sprint 1 Planning](./scrum.pmo/sprints/sprint-1-rawbin-foundation/planning.md)
