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

## What NOT to tell Tron
Do **not** say "the processing-CR mechanic will auto-unblock his tap" — it will not, as built. Either reopen 40.1 (option 1, works today) or schedule #86-2 to make open-CRs untick the top-level box (option 2, a build). The gap is real and needs the call made, not assumed away.
