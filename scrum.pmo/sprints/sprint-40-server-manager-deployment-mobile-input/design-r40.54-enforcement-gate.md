# R40.54 ENFORCEMENT GATE — `check:ac-failable` (architect design, DESIGN-NOT-BUILD, 2026-08-20)

> **NOTE (2026-09-05, architect — symbol-vs-principle honesty, req flag):** "the ONE `structuralDiscover`" is the **PRINCIPLE** (glob/AST discovery, no site hides), realised in **3 local copies today** — **NO literal shared symbol yet**. Read it as the **design target**; R40.55 extractionDebt (my lane) makes it a real shared symbol, at which point `discoveryUtilitySingleSource` becomes literal. Honest statement: requirements.md R-boot-currency AC.

PO measured (twice) that R40.54 is UNENFORCED: no script references it, ci:gates:raw has no meta-guard, `satisfaction-UNVERIFIED` exists in one unit as inert data. ⇒ **R40.54 is its own first violation** — the requirement that forbids satisfying a requirement whose ACs lack a provably-failable check is itself such a requirement. Unenforced doctrine is folklore; folklore is lost at the next rewind. This design turns R40.54's MECHANISM (design-r40.54-failable-ac-meta-guard.md + the AcGuard chain) into a RUNNING gate. **BUILD waits until Tron's two items clear (device-verify + push); land the DESIGN now.**

## The gate: `scripts/check-ac-failable.ts`, registered in `ci:gates:raw`
For every requirement whose `satisfactionStatus` claims **Satisfied**, for EACH of its ACs, the AC must name a check that:
1. **EXISTS** — its `gateRef` (`{kind:'test'|'lint'|'script'|'ci', ref, assertion}`) resolves to a real target on disk (a Test unit / a lint file / a script+assertion). Missing or unresolvable ⇒ unfailable.
2. **is WIRED** — the named check is reachable from `ci:gates:raw` (a Test wired into a run, a lint/script registered in the gate chain). Exists-but-dead ⇒ unfailable.
3. **has a recorded STUB-MUST-FAIL** — `stubMustFail` references a RED observation (the check was fed the AC's defect and went RED). No proven-RED ⇒ unproven ⇒ unfailable.

## R40.54's own laws, applied to this gate (the recursion, closed)
- **ENUMERATE-not-universal:** the (requirement, AC) universe is DERIVED by **structuralDiscover** over all requirement units' `acceptanceCriteria[]` — never a hand-list. Plus a **completeness/divergence check**: the set of ACs the gate evaluated must EQUAL the set of ACs that exist; a NEW AC added without a gateRef appears in the discovered set and FAILS — it cannot HIDE by being absent from a curated list. (Reuses the ONE `structuralDiscover`, discoveryUtilitySingleSource — same as the boot-essence-no-state lint; no copied shape-matcher.)
- **FAIL-CLOSED:** an AC whose gateRef is unknown / unparseable / unresolvable ⇒ **RED (unfailable)**, never a silent pass. A requirement with an unparseable AC is NOT satisfiable.
- **THIRD state `satisfaction-UNVERIFIED`:** the gate computes three outcomes — **Satisfied** (every AC exists+wired+proven-RED-stub AND currently green), **Unsatisfied** (a check is RED), **UNVERIFIED** (an AC is unfailable → can't verify either way). `--strict` FAILS the build iff a requirement is marked **Satisfied while carrying an UNVERIFIED AC** (claiming done over a wish = the violation). Existing reqs with unfailable ACs land in UNVERIFIED — neither inflated to Satisfied nor erased to Unsatisfied (no retro-shock, honest). The UNVERIFIED count is the wish-sweep drain target (published, false-drain-detected per the mechanism doc).
- **ITS OWN stub-must-fail (self-application):** the suite carries a self-test — seed a requirement marked Satisfied with a wish-AC (no gateRef) and assert `check:ac-failable` goes **RED**. A NO-OP version of this gate (one that passes everything) MUST turn the suite RED on that seed. If the gate is inert, its self-stub fails — the guard-of-guards is itself provably-failable, closing the recursion with no meta-meta-guard.
- **R40.54 GATES ITSELF:** when it runs, `check:ac-failable` evaluates R40.54's OWN ACs — each must name `check:ac-failable`, be wired, and carry a proven-RED stub. Until this gate exists+wired+stubbed, **R40.54's own satisfaction is UNVERIFIED** — which is the true current state (the PO's finding, now computed rather than noticed). The build that lands this gate is what flips R40.54 from folklore to enforced.

## What it reports (visibility now, enforcement on build)
- Per requirement: state ∈ {Satisfied, Unsatisfied, UNVERIFIED}, and for UNVERIFIED, the specific ACs that are unfailable (no gateRef / dead check / no proven-RED stub) + why.
- The UNVERIFIED-due-to-unfailable-AC count (the wish backlog), drained by risk, false-drain-detected.
- `--strict` (in ci:gates:raw) RED while any Satisfied-req carries an UNVERIFIED AC.

## Sequencing (PO)
Land THIS DESIGN now (no tree churn). BUILD after Tron's device-verify + push clear, so we don't churn the tree during the pending Layer-2 migration. On build: implement `check-ac-failable.ts` (the AcGuard chain's `assertEveryAcFailable`/`sweepWishes`/`assertUniversalEnumerated` methods become its functions), wire into ci:gates:raw, add the self-stub, and run it — its first run reports R40.54 itself as UNVERIFIED-until-its-own-ACs-carry-gateRefs, which req then fills. That first RED-on-itself is the proof the folklore became a mechanism.
