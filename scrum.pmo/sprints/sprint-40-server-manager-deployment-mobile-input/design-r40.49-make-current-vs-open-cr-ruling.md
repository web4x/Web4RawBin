# make-current vs open-CRs — architect ruling (Tron-facing, 2026-08-20)

PO asked: does a task with open CRs derive to "QA Review unchecked + processing-change-requests pending" (→ settable, 200), or clean QA-Review (→ 409)? **CORRECT, not confirm — it stays clean QA-Review → 409. There is a genuine gap.**

## Measured
- **Task 40.1 (`7a956c21`) carries 5 OPEN CRs** (`18ebe066/461d5db6/4babebb1/7286d45a/c27ae455`, all status=Open) — confirmed.
- Its `statusChecklist` has **`- [x] QA Review` CHECKED at top level**; there is **no "processing change requests" line**.
- `deriveStatusEnum` (task-status.ts:16-25) = the **highest CHECKED TOP-LEVEL box**; **indented sub-steps are explicitly IGNORED**. ⇒ Task 40.1 derives **QA Review**.
- `TaskPolicy.validate` (task-policy.ts:76): `makeCurrent` legal ONLY for `Planned`/`In Progress` ⇒ QA-Review task **throws 409**.
- The ONLY code that unchecks QA Review is **`intent.reopen`** (task-policy.ts:79, :113 `untickBox(cl,'Done'); untickBox(cl,'QA Review')`) — a deliberate DECLINE/reopen action. **No mechanic derives status from open CRs; open CRs do not touch the top-level box.**

## Ruling
The PO's 409-is-correct call **stands** (QA Review = the exit condition for being current; never silently re-open reviewed work). But the hypothesis that open CRs auto-derive 40.1 to a non-clean QA-Review is **not what the code produces**: a "processing change requests" SUB-STEP would be ignored by `deriveStatusEnum`, and no auto-untick-on-open-CR exists. **40.1 with 5 open CRs still derives clean QA-Review → Tron's tap gives 409, not 200.** This is a real gap between his intent (40.1 needs rework → make it current) and the policy — a DECISION, not a hope.

## The two ways to close it (PO/Tron decides)
1. **Use the EXISTING reopen/decline path (no new code):** to make 40.1 current it must first be **REOPENED** — the decline action unticks QA Review → derives **In Progress** → makeCurrent then returns 200. This already matches his workflow (a declined QA verdict sends the task back to In Progress). So the true unblocker for the tap is **reopen**, not the mere presence of open CRs. Recommended: tell Tron "decline/reopen 40.1 (its 5 CRs are the reason), then set-current works."
2. **Build CR #86-2 as designed (new code):** make open-CRs **untick the TOP-LEVEL QA Review box** (present-iff-open-CR), so `deriveStatusEnum` drops to In Progress automatically. NOTE: it must move the **top-level** box — adding an indented "processing change requests" sub-step will NOT work, because `deriveStatusEnum` ignores sub-steps. This is a real derived-status change (task-status.ts + the checklist writer must read open-CR count), currently **NOT built**.

## CR #86-2 — RE-POINTED to the BEHAVIOUR (PO ruling: build this, not the decoration)
Tron's sketch (QA Review as an UNCHECKED box with "processing change requests" beneath) is a BEHAVIOUR spec, not a decorative sub-line: **an open CR must leave QA Review unchecked.** #86-2's real content:

> ⚠️ **SUPERSEDED sub-approach:** an earlier draft here said "untick the top-level QA Review box → derive In Progress." That is WRONG — it violates Tron's **no-regress** rule (a QA-Review task with open CRs must NOT display as In Progress; req's AC-qa-review-unchecked-under-open-cr + his own sketch). The PO's band ruling below replaces it.

- **BEHAVIOUR (PO band ruling, req-encoded):** `deriveStatusEnum` becomes **sub-step-aware** — a checked top-level `QA Review` box **plus an open processing-CR sub-step** derives a distinct **"QA Review (processing CRs)" BAND**, which is still the QA-Review shape (NEVER In Progress — no regress), but is a recognised rework sub-state. `Done` is **gated on zero open CRs** (a Done box with open CRs does not derive Done). When the last CR closes, it returns to clean QA Review (or advances to Done).
- **make-current ACCEPTS THE BAND:** extend the make-current status policy (task-policy.ts:76) to allow `Planned` + `In Progress` + **QA-Review-with-open-CR** — so a task in rework (open CRs) IS settable-as-current, while a CLEAN QA-Review still 409s (unchanged). This is how the tap works WITHOUT regressing the display to In Progress. **HARD DEPENDENCY: CR-2 (the band/policy) depends on CR-5 (the sub-step-aware `deriveStatusEnum`)** — build CR-5 first, or CR-2 has nothing to key on.
- **★ SINGLE-SOURCE preserved:** the band is derived from the CHECKLIST (top-level box + the present-iff-open-CR sub-step), not from a status-override reading external CR-count — the checklist stays the single source (task-status.ts:2). The sub-step is now MEANINGFUL to derivation (that is the change), not ignored.
- **THE TRAP (still applies):** do NOT ship the sub-step as pure decoration while `deriveStatusEnum` keeps ignoring it — that is a line everyone sees and behaviour that never fires. The behaviour is the band + the policy accepting it. stub-must-fail: a sub-step-only build leaves make-current 409-ing a task with open CRs (RED).

## ★ BAND-MECHANICS CONFIRM + CHOKEPOINT CLEAR (architect, on req's CR units 00fea8fa1)
**CONFIRMED sound**, with 4 implementation-critical conditions + 1 reference fix:
1. **Extend THE one `deriveStatusEnum`** (task-status.ts:19), never a parallel derivation. `statusSymbol` (:42) AND the drift detector `assertStatusConsistent` (:82) both delegate to it — so the band + the Done-gate stay consistent with the detector BY CONSTRUCTION (no false FALSE-DONE). This is the anti-two-source discipline (PO hard-condition 2026-08-12); CR-5 owns this and CR-2 depends on it (correct hard order).
2. **The band stays the QA-Review ENUM.** deriveStatusEnum returns `QA Review` for a QA-Review-with-open-CR task (not a 5th enum value — that would ripple through every 4-value switch). Its only CHANGE: **gate Done** — a checked `Done` box WITH the open-CR sub-step present derives `QA Review`, not Done. The band is "QA Review enum + open-CR sub-step qualifier."
3. **make-current (CR-3, task-policy.ts:76) + valid-focus (CR-4) read the open-CR SUB-STEP from the checklist** to accept the band (status==QA Review AND processing-CR sub-step present → settable; status==QA Review AND no sub-step → 409 unchanged). Single-source: they read the checklist signal, NOT an external CR-count.
4. **Maintain the processing-CR sub-step present-iff-open-CR IN THE SAME `UnitController.apply` seam transaction** as the CR-link add/remove (task-policy.ts:116 note: `get()` re-reads disk, a separate push is lost). CR-open/close edits the sub-step + the changeRequests[] in one seam op.
- **★ CHOKEPOINT CLEARED:** #86 writes task units through the established `UnitController.apply`/TaskPolicy seam (same path reopen/sub-step/make-current use) — it USES `ScenarioIndex.put` as always, does NOT change the put machinery. No chokepoint-machinery modification; the R40.49 chokepoint flag was migration-auto-mint-specific and does not apply here. **Expert may build #86 without a chokepoint hold.**
- **⚠ REFERENCE FIX:** CR-5 currently references my `ac4913493` — that is the **SUPERSEDED** "untick→In-Progress" spec. Re-point it to **`c6652f88c`** (this file, the band ruling), else the AC cites the wrong behaviour.

## What NOT to tell Tron
Do **not** say "the processing-CR mechanic will auto-unblock his tap" — it will not, as built. Either reopen 40.1 (option 1, works today) or schedule #86-2 to make open-CRs untick the top-level box (option 2, a build). The gap is real and needs the call made, not assumed away.
