# T40.1 decline-band — architect CHOKEPOINT RULING (2026-08-24, disk-carried; survives a cut)

Tron ruled the SHAPE (CR 7286d45a authoritative, my design authoritative, PO's stays-checked wording superseded): QA Review UNTICKED + a processing-CR sub-step + a NEW DERIVED band "QA-Review-with-open-CR", distinct from clean QA-Review / In-Progress / Done, and the band IS current-able. This is a deriveStatusEnum STATUS-CORE change → behind the architect chokepoint. **Tron authorized the SHAPE, not a chokepoint bypass** — this ruling is the SAFETY gate, not a re-authorization.

## CHOKEPOINT RULING = PROCEED, under FOUR invariants
1. ★ **ATOMIC LANDING (the load-bearing one, expert-measured):** the band-derivation and the QA-Review-unticking MUST land in ONE atomic change. Unticking QA Review WITHOUT the band existing derives In-Progress = the exact regress Tron forbade. GATE: there must be NO committed state (no intermediate commit, no half-deploy) in which the untick behavior is live but the band is not derived. deriveStatusEnum's new band + the untick behavior ship together or not at all.
2. **DERIVED, not stored/hand-stamped:** the band is DERIVED by deriveStatusEnum from (QA-Review checklist state + an OPEN-CR signal), never a stored status field. The open-CR signal must be a DERIVABLE input (the processing-CR sub-step / CR 7286d45a state), so the band is single-sourced through deriveStatusEnum — consistent with status-discriminator-is-a-derived-field. [[status-discriminator-is-a-unit-field]]
3. **CURRENT-ABLE:** the band joins the current-eligible set {Planned, In-Progress, QA-Review, QA-Review-with-open-CR} — getThreeSlots eligibility + the R40.56/57/58 current-role path must include it (Tron: the band is current-able). Ties to the current-role work just shipped: eligibility is defined in ONE place; add the band there, not a second list.
4. **STATUS_ORDER + deriveStatusEnum extension:** deriveStatusEnum is currently top-level-only, STATUS_ORDER has 4 states, the band does not exist — the band is a derived refinement of QA-Review (distinct + current-able). The STATUS_ORDER / deriveStatusEnum change is the status-core touch this chokepoint gates; keep it single-source (one enum, one derivation), no parallel band-derivation elsewhere.

## GATE / stub-must-fail (tester)
- A task in QA-Review-with-open-CR DERIVES the BAND — NOT In-Progress, NOT clean-QA. RED baseline: assert that unticking-QA-without-the-band derives In-Progress (the forbidden regress) → the gate must catch it, proving the atomicity invariant is enforced, not hoped.
- The band is current-able: a task in the band can be the designated current (getThreeSlots eligibility includes it).
- Single-source: deriveStatusEnum is the ONLY producer of the band (no parallel derivation) — a hazard-scan (0 band-derivations outside deriveStatusEnum), same shape as the current-role single-source guards.

## Handoff
Expert HOLDS until this ruling (already given). Build the band+untick ATOMICALLY (invariant 1). I backstop on build: band derives (not In-Progress) for QA-Review-with-open-CR, atomic-landing (no half-state), band in the ONE eligibility set, deriveStatusEnum single-source. req mints/updates the R40.x status units + ACs (each gateRef+stub, incl the untick-without-band RED baseline). Tester gates the band-derivation + current-ability + the atomicity RED baseline.
