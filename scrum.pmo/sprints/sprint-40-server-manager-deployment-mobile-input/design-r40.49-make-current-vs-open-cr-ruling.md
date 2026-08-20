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

- **BEHAVIOUR (the mechanism):** opening a CR on a task that derives QA-Review/Done **unticks the TOP-LEVEL `QA Review` (and `Done`) box** in the checklist — REUSE the existing `untickBox` path (task-policy.ts:113, the same untick `intent.reopen` performs). `deriveStatusEnum` then naturally derives **In Progress** → the task is settable/reworkable. This IS "opening a CR == a reopen," which is why option (1) and (2) are the same mechanic — (1) triggers it by hand, (2) triggers it automatically on CR-open.
- **★ SINGLE-SOURCE — the make-or-break implementation detail:** untick the ACTUAL top-level box, do **NOT** make `deriveStatusEnum` read open-CR-count and override. The checklist is the single source (task-status.ts:2: "status + checklist cannot disagree BY CONSTRUCTION"); a derivation-override would make the checklist say QA-Review-checked while the status says In-Progress = exactly the drift the whole status subsystem forbids, and the CI detector would flag it. So: CR-open **edits the checklist box**; derivation stays pure.
- **VISIBLE tracking (the surface, not the mechanism):** add/maintain the indented `- [ ] processing change requests` sub-step under In Progress, **present-iff-open-CR**. It is the visible indicator ONLY — `deriveStatusEnum` ignores it. Building this ALONE is the trap (a line everyone sees, behaviour that never fires).
- **SYMMETRIC (present-iff-open-CR, both directions):** when the LAST open CR is resolved, **re-tick** the top-level `QA Review` box and drop the sub-step — the status reciprocally returns to QA Review. Open-CR-count is the driver; the top-level box tracks it in both directions.
- **INVARIANT:** `status == deriveStatusEnum(checklist)` holds at every step (the box is really ticked/unticked; never a derivation-time override). Gate: a task with ≥1 open CR must derive In Progress (top box unticked); its last-CR-close must derive back to QA Review; stub-must-fail = a sub-step-only implementation leaves the status QA Review (RED, proves decoration ≠ behaviour).

## What NOT to tell Tron
Do **not** say "the processing-CR mechanic will auto-unblock his tap" — it will not, as built. Either reopen 40.1 (option 1, works today) or schedule #86-2 to make open-CRs untick the top-level box (option 2, a build). The gap is real and needs the call made, not assumed away.
