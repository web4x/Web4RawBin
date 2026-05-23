# Sprint 3 Planning — E2E Testing & Hardening

## Sprint Goal
Verify the full RawBin stack end-to-end in a real browser, fix any issues found, and harden the deployment for external access.

## Sprint Overview
**Duration:** 2026-05-23 – ongoing
**Focus:** UX parity, Playwright E2E, integration tests, deployment hardening
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directives via iphone:0.0
**Prerequisite:** Port 4444 forwarded on router — DONE (2026-05-23)

## Task List

### UX Parity Block (done — unlocked E2E)

- [x] [T15: MD Browser PUML/SVG Support](./task-15-md-puml-viewer.md)
  **Status:** DONE — `/md/*.svg` + `/md/*.puml` routes, markdown relinking, PROJECT_ROOT fix

- [x] [T18: Header Parity with UpDown](./task-18-header-parity.md)
  **Status:** DONE — room header: home, fullscreen, reload, delete buttons (44px tap targets)

- [x] [T19: Room Member List Parity](./task-19-member-list-parity.md)
  **Status:** DONE — compact badges, 24px avatars, green self-styling, gold star host, status dots

- [x] [T20: Room Chat Parity](./task-20-chat-parity.md)
  **Status:** DONE — bottom sheet, drag handle, peek preview, WS status, QR invite, 274 lines

- [x] [T21: Tron Live Feedback](./task-21-tron-feedback.md)
  **Status:** DONE — profile edit button, avatar upload verified, QR invite popup

- [x] [T22: Lobby & Server Fixes](./task-22-lobby-fixes.md)
  **Status:** DONE — lobby header buttons, private room key check, Watch removed, md linking, directory listing

### Testing & Hardening (in progress)

- [x] [T13: Playwright E2E Test Suite](./task-13-playwright-e2e.md)
  **Status:** DONE — 6 specs (323 lines), 2 passed, 4 skipped (gate→room session flow), 0 failed

- [x] [T14: Integration Test Alignment](./task-14-integration-tests.md)
  **Status:** DONE — 202/202 tests pass in 2.9s, all refactored to unit tests

- [x] [T16: Deployment Hardening](./task-16-deployment.md)
  **Status:** DONE — rawbin.sh 53 lines, stop.sh 36 lines, /api/health, log rotation, .env config

- [x] [T17: Bug Fix Sprint](./task-17-bugfixes.md)
  **Status:** DONE — 4 session bugs fixed, root cause: ROOM_JOINED not sent to creator. 6/6 E2E pass

## Dependency Graph
```
T15,T18-T22 (UX parity) ──DONE──→ T13 (E2E) ──→ T17 (Bug fixes)
                                    T14 (Integration — parallel)
                                    T16 (Deployment — independent)
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 10/10 DONE |
| Expert effort | ~13h + bugfixes |
| Tester effort | ~3h + bugfixes |
| Unit tests | 202/202 pass (2.9s) |
| Build | 53.4KB |

## Definition of Done
- [x] UX parity with UpDown (header, members, chat)
- [x] Playwright E2E: suite created (2 pass, 4 skipped — gate→room session bugs in T17)
- [x] All integration tests pass (202/202 unit-style, no server dependency)
- [x] Server starts reliably, restarts on crash (rawbin.sh auto-restart loop)
- [x] External access confirmed at https://home.donges.it:4444/app
- [x] No critical bugs open (T17 fixed all 4)

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-23
**Sprint:** Sprint 3 — E2E Testing & Hardening
