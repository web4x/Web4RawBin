# Tron-resting ACs — two-bucket scope (planner, 2026-09-05)

**Purpose:** every board AC whose closing condition currently RESTS on Tron *doing something* (per the "Tron is the customer, not the tester" law). Bucket 1 = we can verify today, worded lazily as his-screen/he-confirms → reword to **team-verified @390, his acceptance following**. Bucket 2 = genuinely unverifiable with the harness we have → **named harness gap + proposed fix**, escalated as work, never a Tron-confirms AC or ship-and-ask.

**Gate checked, not assumed** (PO mandate): the room file/folder path is **MEMBER-gated, not owner-gated** — `server.ts:2401` "F1 auth: require valid token + room membership", `:2414` `authorized = memberOf(...)`, fail-closed on membership (no owner-only lock). ⇒ a legit **test-member** room is verifiable by us *today*; several "past-owner-auth" items are Bucket 1.

---

## BUCKET 2 — genuine gaps, NON-security, NOT-NOW (recorded, not proposed for action)

**★ Aligned with the STOP-SECURITY directive (2026-09-05): for BASIC FUNCTIONALITY (the folder) there is NO harness gap — the room is MEMBER-gated, so a live member session verifies the entire real user path with NO owner rights. That is the whole verification we need. No owner-auth harness is needed, proposed, or wanted here.**

1. **iOS transport-suspend resync — T37.31 / R37.27 (c0157a03 / 9ad82c6e; Test 3e84d26a).** NOT security, NOT owner-auth (a transport-lifecycle *functionality* concern), and NOT basic-functionality-for-the-folder. iOS suspends the WS on background/lock; un-mockable in headless / desktop-WebKit. **Recorded only — DEFERRED behind basic functionality; no harness proposal now.** The verification concept would be a real-iOS-*device* driver (no auth, no owner), but that is a later concern, not this workstream. Flagged so it is not silently closed via a Tron-confirms AC.

## BUCKET 1 — verifiable by us today (reword his-screen → team-verified @390 + his acceptance)

1. **T40.80 (dd2326a2)** — "@390 screenshot … his screen is the acceptance … un-mockable" for human-size legend+center. **WRONG "un-mockable"**: sizes ARE verifiable @390 real-WebKit. Reword: WE verify real-WebKit @390, Tron accepts.
2. **T40.79 (d47ec615)** — "@390 … on Tron's device" for center-total. Same reword.
3. **T40.78 (7193c129)** — "@390 screenshot" room Add-folder affordance + room path. **Room = member-gated (verified)** → a test-member room verifies it. Reword: WE verify @390 in a test-member room, Tron accepts.
4. **T37.21 (1bf4acc5)** — P4b + any "@390 Tron-device closing" conditions → we verify @390, his acceptance follows. (P1/P4a were already Tron-device-experienced historically — same pattern, note for consistency.)
5. **P2 2-browser-WS-insert (Test 919e3f36)** — filed "not-covered-on-prod". **RECLASSIFY:** member-gated room = two test-members = two-browser verifiable by us; not a gap. (Distinct from the still-open client-subscribe piece awaiting the expert probe — that's a real open bug, not a Tron-resting AC.)

---

**Full-sweep note:** a grep for Tron-resting phrases across `scenario/index` returned **24 units** (tasks/reqs/tests); the active board ACs above are the load-bearing ones. The remaining ~19 are mostly Test *descriptions* mentioning Tron-real-iOS (descriptive, not closing conditions) — req + I sweep them for wording as the reword lands.

**Reword ownership:** requirement-AC rewordings = req's lane (I coordinate, do not rewrite unilaterally); I mirror the task side once req rewords. **Does not delay the folder fix — runs alongside.**
