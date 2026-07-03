# (D) Legacy no-chain requirements — triage measurement (finding, DEFERRED)

**By:** robbin-architect · 2026-07-03. Surfaced by the scenario-chain diagrams (req audit). **PO deferred execution (needs Tron's go post-rewind); this is the read-only measurement INPUT only — NO backfill/mark done yet.**

## What & how
"Bare" requirement = a Requirement unit with an empty `useCases[]` → no chain at all (Req→UC→Class→Method never built). Measured across the 3 sprints the diagrams flagged (S13, S19, S20) by reading `requirements[]` and checking each bare req's `supersededBy` / `refinedBy` / `splitInto` / `status`.

## Result: 52 bare no-chain reqs
- **DEAD / refined-away (3, safe to prune or mark superseded):** `R19.88` → refinedBy R19.88.A · `R19.89` → refinedBy R19.91 · `R20.13` → refinedBy R20.13.A.
- **No death-marker (49) — need a DONE-vs-OPEN human call.** By sprint: S13=3, S19≈17, S20≈29.

## ★ The important nuance (mechanical signal is weak — don't over-trust "RELEVANT?")
Only 3 carry an explicit supersession/refinement marker. The other 49 have NO `supersededBy`/`status`, so a name-only scan calls them "relevant" — but reading the titles, they are overwhelmingly **S19 (Room-Handling) + S20 (Traceability-First) requirements whose functionality has SINCE SHIPPED** and is live today: the trace tree/UI, the global SelectionModel (R20.6a-h), the detail drawer + grab-bar (R20.2/BUG3), room-tree files/members (R19.86/93/101/102), source `file:line` links (R20.23-27), Bug/ChangeRequest OOP (R20.4), CurrentSprint view (R20.13.A/R20.17). So the true split is NOT relevant-vs-dead but:
- **DONE-but-unchained** (most): the code shipped; the scenario req was captured but never wired to a chain. This is the retroactive-#126 pattern at legacy scale (like R27.1/R27.3/R29.1, but ~40+ units).
- **Genuinely-superseded / dropped** (the 3 explicit + likely a few more that need eyeballing).
- **Still-open** (few, if any — most S19/S20 work is delivered).

A definitive DONE-vs-open verdict per req needs checking whether its functionality exists in current code / is covered by a shipped feature — that's the human judgment, deferred.

## Recommended triage (when Tron prioritizes — NOT executed)
1. **Prune / mark-superseded** the 3 refined-away (R19.88, R19.89, R20.13).
2. **Mark DONE-chainless** the shipped-era reqs that don't warrant a retroactive code-chain (legacy functionality already live + covered by newer chained reqs) — so the audit stops flagging them without fabricating chains.
3. **Backfill-chain** only the still-load-bearing ones (functionality live AND referenced by active work) — retroactive #126, honest markers.
4. Re-run the chain-diagram audit after → the (D) count should go to 0 (all either chained or explicitly chainless).

Ties to R27.5 Axis-4 (marker-has-chain) philosophy inverted: this is *requirements* captured without chains (vs code shipped without chains). A future audit axis could flag "Requirement with no useCases AND no chainless-marker" so this class can't silently accumulate.
