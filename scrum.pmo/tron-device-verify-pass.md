# Tron Device-Verify Pass — one phone pass, real iOS @390
Phone-readable. Each row = ONE action on your device. These are GENUINELY device-only (multi-touch / iOS keyboard / owner-session / real-finger tap) — everything automatable at 390 real-WebKit was already gated and is NOT here. Ordered by risk; **suspected-already-broken first.** A red result on a ⚠️ row = an OLD silent regression (green headless for sprints, never actually exercised); a red on a 🆕 row = new work never confirmed, not a regression.

---

## 1. ⚠️ R22.2 — drawer pinch/pan/double-tap  · OLD SILENT REGRESSION if red
Green headless since it shipped — but headless only SYNTHESIZES touch, so the real iOS gesture recognizer was never exercised. This is the standout.
- **DO:** on the trace drawer — two-finger **pinch** out, then **one-finger drag**, then **double-tap**.
- **PASS:** zooms toward your fingers · pans with your finger · double-tap snaps back to fit. The page does NOT scroll instead.
- **Closes:** R22.2 touch ACs (AC-t / AC-v touch half).

## 2. ⚠️ R40.3-B — iOS keyboard stays suppressed  · could be OLD (suppress-by-construction) · needs terminal restored ⏸
Headless has no on-screen keyboard, so "it didn't appear" is vacuously green — only your device can prove it.
- **DO:** open the terminal, tap the input line.
- **PASS:** the iOS soft keyboard NEVER slides up; the on-screen key bar is your only input, and typing on the bar still reaches the terminal.
- **Closes:** R40.3-B.

## 3. 🆕 T40.8 / R40.8 — Files shows the real on-disk path (owner)  · owner-session only
Server path is gated GREEN + measured-not-composed; only the owner-visible UI is unconfirmed.
- **DO:** as owner, open any unit → **Files** tab.
- **PASS:** it shows the REAL path `scenario/index/…/<uuid>.scenario.json` and is tappable through to that folder.
- **Closes:** R40.8 owner visible+browsable AC.

## 4. 🆕 R40.10 — approve / decline tap (owner)  · owner-session only
Verdict logic + non-owner-403 gated GREEN; only your own tap on your session is unconfirmed.
- **DO:** as owner, open a QA-Review task → tap **✓ Approve**. On another → tap **✕ Decline**.
- **PASS:** Approve → "✓ Approved — status now Done"; Decline → a Change Request is created + task goes back to In Progress.
- **Closes:** R40.10 owner tap.

## 5. 🆕 T40.1 / R40.1 — RC per-pane deep-link (owner)  · owner-session · needs Server Manager restored ⏸
Client resolver + 403-security gated GREEN; only the owner action on a real pane is unconfirmed.
- **DO:** as owner in Server Manager, tap the remote-control action on a specific pane (e.g. the expert's).
- **PASS:** it opens the correct per-pane session link — that pane's agent, never pane %0's.
- **Closes:** R40.1 AC-1 + AC-2-server.

## 6. 🆕 T40.9 / R40.9 — Preview node tap opens the drawer  · real-finger tap only (low)
Preview RENDER + drawer-open were gated GREEN @390 real-WebKit; only the real-finger tap-fire on the node is device.
- **DO:** open a unit → **👁 Preview** → tap a node in the tree.
- **PASS:** the details drawer opens for that node.
- **Closes:** R40.9 drawer-on-select (tap-fire half).

## 7. 🆕 R40.28 — ◆Scenario / ✎Edit open in a NEW TAB (AC-7 iOS sync-block)  · real iOS Safari only
AC-6 (a new browsing context ACTUALLY opens — sync-uuid + synthetic-ref about:blank→pointed) is gated GREEN DET-3x @390 real-WebKit (r4028-newtab-gate). AC-7 = iOS silently blocks a NON-synchronous window.open; headless WebKit does NOT enforce the sync-gesture rule (measured: async also opens), so only a real device confirms the tab truly opens.
- **DO:** open any unit's drawer → tap **◆ Scenario**, then **✎ Edit**; also try a synthetic-ref node (dir:/file:).
- **PASS:** each tap opens a NEW TAB (not the current one) landing on the real target (Scenario view / editor) — no silently-blocked or empty `about:blank` tab.
- **Closes:** R40.28 AC-7 (iOS sync-gesture new-tab).

---

### Pulled OFF this list (automatable @390 real-WebKit → I gate, not you — no padding)
- **R40.28 new-tab AC-6 (actual-open)** — gated GREEN DET-3x @390 real-WebKit (r4028-newtab-gate); only AC-7 (iOS sync-block, headless cannot enforce) is device (row 7).
- **R40.9 preview render + drawer logic** — already gated GREEN @390 real-WebKit (r409); only the real-finger tap (row 6) remains.
- **R40.4 sprint-label render @390** — pixel-automatable; I'll re-gate, not hand it over.
- **R40.20 keybar first-key toggle** — NOT shipped yet (never-built); add a row when it ships (its "bar stays above the keyboard" AC will be device-only).

Never headless-green any row above — that is the whole point. A ⚠️ red is a regression to fix; a 🆕 red is new work to finish.
