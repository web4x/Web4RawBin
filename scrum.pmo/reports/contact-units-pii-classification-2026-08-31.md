# Contact-shaped PII units on origin/main — classification (planner, PO-routed, 2026-08-31)

**⚠ TRACKED + PUSHED on origin/main = exposure already left the machine (unlike the local-only report leak).** 20 units carry BOTH `phones` and `emails` fields (contact shape: name/phones/emails/addresses/companies/unitLinks).

**★ VALUE-SAFE METHOD:** classified by `grep -lq` (exit-code only) — NO name/phone/email/address value was printed, read into output, or written anywhere (strict "never anywhere" after the report leak). Discriminators: real-consumer-email-domain present (real-signal) vs system/agent-name or synthetic-email-domain (synthetic-signal). Ambiguous → UNCLEAR (PO treats as real).

## COUNTS BY CLASS (uuids only — NEVER values)
- **REAL = 1** (real consumer email domain present): `3effa1fc-a548-4619-a3ff-fb96382eca22`
- **SYNTHETIC = 0** (none matched any fixture/agent/test marker — notably NONE are `zorblax`/`apple`-class fixtures)
- **UNCLEAR = 19** (could not discriminate WITHOUT reading values; per PO instruction reported as unclear, NOT guessed; PO treats as REAL): 05e58f81, 1204eb32, 2703628c, 279657f8, 2a244a61, 37fcb752, 41ad88c4, 4233618f, 44bf9b39, 4824c4ea, 4af41484, 5e5471fe, 6852cbb0, 76f2cda7, 8d9be587, 8f74dfba, a398945a, b4f57923, e9bf96f8

## DECISION-RELEVANT CONCLUSION
This is **NOT** "20 synthetic fixtures (non-issue)." **0 provably synthetic + ≥1 confirmed real + 19 unclear→treated-as-real** ⇒ reads as a **real privacy incident** (real contact records pushed to a remote). Recommend PO escalate to Tron on that basis. Finer real-vs-synthetic on the 19 requires a VALUE-READING pass — I did NOT do it unprotocoled (would mean handling 19 real contacts' values); offer it only under an explicit value-handling protocol.

## ★ GUARD-DESIGN FINDING (for the structural req — PO's point)
Unit 76f2cda7 has **`className: None`** ⇒ a PII guard keyed on `class`/`className` (e.g. a `Profile`-class grep) returns ZERO while these units plainly exist. **Detection MUST key on FIELD SHAPE (phones/emails/addresses present), not class name** — the discovered-not-hand-listed law applied to detection (same family as R37.29 referential-integrity + R37.31 phantom-coverage). Put into the structural PII req: gitignore/relocate + a field-shape detector, never a class-name allowlist.

## GUARDRAILS OBSERVED
Classification only — did NOT delete/move/rewrite any unit. Nothing (reconcile/scrub/this) moves until Tron rules. This report contains ZERO PII values (uuids only).
