---
name: LOG_DEVICE headless fallback
uuid: b7e3f1a0-4d82-4c9e-a1f5-8c2d6e9b0f34
type: improvement
sprint: backlog (ooshTeam scope)
owner: oosh-expert
---

# Task: LOG_DEVICE self-heals on headless servers

## Problem (measured 2026-06-28 on WODA.prod)
OOSH `log` script line 105 writes to `$LOG_DEVICE`, which defaults to `/dev/tty`.
On headless Linux servers (no TTY), every `otmux send` fails with:
`/root/oosh/log: line 105: /dev/tty: No such device or address`

This blocks ALL hiveMind/otmux agent communication on headless hosts.
Workaround: `export LOG_DEVICE=/dev/stderr` before every command — fragile, not self-healing.

## Fix (self-healing, rule 4)
In the `log` script init, detect whether `/dev/tty` is available:
```bash
LOG_DEVICE="${LOG_DEVICE:-$(test -w /dev/tty && echo /dev/tty || echo /dev/stderr)}"
```
The object heals on init — no manual export needed. Works on both TTY and headless.

## Acceptance Criteria
- [ ] `otmux send` works on headless server WITHOUT manual `LOG_DEVICE` export
- [ ] `otmux send` still works on TTY servers (MacStudio) — no regression
- [ ] No `/dev/tty: No such device or address` errors on headless

## Status
- [x] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Origin
ARON CMM4 hourly improvement — gap became task. "Objects self-heal" (doctrine rule 4).
