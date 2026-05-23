# Sprint 3 Planning — E2E Testing & Hardening

## Sprint Goal
Verify the full RawBin stack end-to-end in a real browser, fix any issues found, and harden the deployment for external access.

## Sprint Overview
**Duration:** TBD
**Focus:** Playwright E2E tests, integration test alignment, MD browser enhancement, deployment hardening
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directives via iphone:0.0
**Prerequisite:** Port 4444 forwarded on router — DONE (2026-05-23)

## Task List

- [ ] [T13: Playwright E2E Test Suite](./task-13-playwright-e2e.md)
  **Priority:** 13 (CRITICAL — validates full stack) **Status:** PLANNED
  **Effort:** 4h expert + 2h tester
  - Playwright config + test infrastructure
  - Full user journey: new user → profile gate → name entry → room create → chat → leave
  - Device enrollment flow: secret code entry → localStorage key storage → reconnect auto-auth
  - vCard download: click other user → profile sheet → download .vcf → validate content
  - Profile editor: self-click → edit name/phone/url → save → verify persistence
  - Negative tests: empty name rejected, wrong secret code rejected, uncommitted profile can't join room
  - Mobile viewport tests (PWA responsive)

- [ ] [T14: Integration Test Alignment](./task-14-integration-tests.md)
  **Priority:** 14 (HIGH — server.test.ts + client.test.ts against running server) **Status:** PLANNED
  **Effort:** 2h tester
  - Fix the 48 failing integration tests (server.test.ts + client.test.ts)
  - Tests need running server — add beforeAll server start / afterAll server stop
  - Or refactor to unit tests like profile.test.ts
  - Verify all routes: kept routes 200, removed routes 404
  - Verify WS protocol: all 47 message types

- [x] [T15: MD Browser PUML/SVG Support](./task-15-md-puml-viewer.md)
  **Priority:** 15 (MEDIUM) **Status:** DONE
  - `/md/*.svg` + `/md/*.puml` routes, markdown relinking, PROJECT_ROOT fix

- [ ] [T16: Deployment Hardening](./task-16-deployment.md)
  **Priority:** 16 (HIGH — production readiness) **Status:** PLANNED
  **Effort:** 2h expert + 1h tester
  - Start script (src/sh/rawbin.sh) with proper daemonization
  - Process management: auto-restart on crash
  - SSL certificate: use real cert from OOSH certificates script (not self-signed)
  - Log file persistence (not just in-memory)
  - Environment config: production vs development mode
  - Health check endpoint: GET /api/health

- [ ] [T17: Bug Fix Sprint](./task-17-bugfixes.md)
  **Priority:** 17 (as needed) **Status:** PLANNED
  **Effort:** variable
  - Placeholder for bugs found during E2E testing
  - Each bug becomes a subtask (T17.1, T17.2, etc.)
  - Bug lifecycle: found → filed → fixed → verified

- [ ] [T18: Header Parity with UpDown](./task-18-header-parity.md)
  **Priority:** 18 (HIGH — core UX) **Status:** PLANNED
  **Effort:** 1h expert
  - Home button, fullscreen toggle, reload button
  - Header layout: [← Leave] [🏠]  Room Name  [↻] [⛶] [🔗]

- [ ] [T19: Room Member List Parity](./task-19-member-list-parity.md)
  **Priority:** 19 (HIGH — core UX) **Status:** PLANNED
  **Effort:** 2h expert
  - Compact horizontal badges with 24px avatars
  - Status indicators, self-styling (green), host icon
  - Flex-wrap layout matching UpDown player list

- [ ] [T20: Room Chat Parity](./task-20-chat-parity.md)
  **Priority:** 20 (CRITICAL — chat is broken) **Status:** PLANNED
  **Effort:** 3h expert
  - Bottom sheet drawer pattern (collapsed/expanded)
  - Drag handle, message peek preview, WS status indicator
  - QR invite popup, transform animations, backdrop blur
  - Verify chat works end-to-end between users

## Dependency Graph
```
T18 (Header)  ──┐
T19 (Members) ──┼──→ T13 (E2E) ──→ T17 (Bug fixes)
T20 (Chat)    ──┘
T14 (Integration tests — independent)
T16 (Deployment — independent)
```

T18-T20 must be done BEFORE E2E tests (T13) — no point testing broken UX.

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 8 (1 done, 7 planned) |
| Expert effort | ~13h + bugfixes |
| Tester effort | ~3h + bugfixes |
| Prerequisite | Router port 4444 forwarding — DONE |

## Definition of Done
- UX parity with UpDown (header, members, chat)
- Playwright E2E: full user journey passes in headless Chrome
- All integration tests pass
- Server starts reliably, restarts on crash
- External access confirmed at https://home.donges.it:4444/app
- No critical bugs open

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-23
**Sprint:** Sprint 3 — E2E Testing & Hardening
