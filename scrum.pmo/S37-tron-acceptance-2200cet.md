# Sprint 37 — TRON ACCEPTANCE LIST (14 QA-Review → Done tonight)

**Deadline 22:00 CET.** Each item is machine-verified + at QA-Review awaiting **your** accept (0 Done till Tron). Accept in one pass, top-down — ordered fastest-to-verify-on-your-own-screen first.

## A · VISUAL — verify by glancing at your screen (fastest)
| # | Delivers | Evidence |
|---|----------|----------|
| **T37.26** | Items read EXACTLY "Sprint N: title" / "Task N: title" (formatter) | SEE it on the board |
| **T37.1** | The pin is COMPUTED from files, never hand-set | GREEN · v0.8.77 |
| **T37.2** | The board IS a generated view + one-time reconcile-all (drift 6→0) | reconcile-all gate GREEN · 9b1c2ab18 / 5b2630552 |
| **T37.6** | sprints.overview.md is a generated view (narrative preserved) | GREEN · fa9131be7 |
| **T37.21** | Room collections = real Folder units + sunburst + Add-flow (your 5-part scope) | SEE it in a room |
| **T37.24** | A routed write appears LIVE in item + detail + preview (no reload) | SEE it: do one edit |

## B · YOUR DEVICE — verify on your phone
| # | Delivers | Evidence |
|---|----------|----------|
| **T37.31** | iOS transport resync — background/lock then foreground → live-MVC recovers, no reload | gate r4065 GREEN DET-3x · 612f44711 · closing AC = your real-iOS confirm |

## C · STRUCTURAL / CI — accept on the gate verdict (not a screen thing)
| # | Delivers | Evidence |
|---|----------|----------|
| **T37.3** | Fail-loud guard asserts pin==board==files in ci (drift-injection BITE) | GREEN DET-3x |
| **T37.5** | Dual-status reconcile — status vs checklist = ONE truth | GREEN |
| **T37.7** | Legacy hand-authored boards migrated to generated, zero-loss (completeness-proven) | GREEN DET-3x |
| **T37.8** | Generated-output routes through one owned-output guard (never clobber) | GREEN · 356a98100 |
| **T37.4.1** | MODEL self-heal on read — any unit validates on init/read (fresh-or-refuse) | af178943d |
| **T37.4.2** | CONTROLLER — one generic unitController.apply for any mutation | GREEN · 3cce48cbb |
| **T37.4.3** | CONTROLLER is the unique dominator + single-source Done delegation | committed, QA-Review |

**14 tasks. Your accept = Done. Nothing marked Done by us.**

## ★ HEADLINE — T37.20 DnD DROP CONTRACT (built + gated GREEN tonight, awaiting your accept)
| # | Delivers | Evidence |
|---|----------|----------|
| **T37.20** + **T37.20.1** | **Drop anything into a room and it becomes its OWN kind of thing, and shows as itself.** A photo → Image (renders a real image, not a filename row) · an email → Email card · a contact card → Contact card · a calendar invite → CalendarEntry card · a link → WebItem. **And dragging an in-app object now actually lands** instead of silently doing nothing. | **SEE it: drop those 6 things into a room.** Live prod v0.8.204 (served==committed). Class 7/7 · render-as-class 4/4 class-distinct (mutual-distinctness GREEN) · in-app drop links (roomcoll 0→1) + renders + ZERO fetch. Commits 6dbfb6c7c / 599d1a745 / 96121fee3 · gates d2f95670a |

**By-the-book, not patched:** GoF **Proxy** (local vs remote chosen once — the origin branch DELETED, not reordered) + **Factory-Method** (`MimeType.from`) + **self-registering Registry** for both mime AND render. **Open/Closed proven on BOTH layers by failable lints = 0**: a 6th class is one `register()` line with **zero edits to any central conditional**, in the drop path or the view path.
