# Champagne Intention Verification Standard

> TRON: "let the team eat its own dogfood and verify if the tests test the right thing by verifying the trace chain intention per chain. this is what its all about!!! convert eat your own dogfood into drink your own champagne and become the best programming team in the world."

> TRON (refinement): "champagne is when the architect self discovers from the traceability. let the tester feedback such screenshots from playwright tests."

**Co-authored by:** robbin-req (requirement intention), robbin-tester (test correctness + Playwright screenshots), robbin-architect (chain integrity + self-discovery)
**Date:** 2026-06-05
**Principle:** A test that passes but verifies the WRONG THING is worse than no test — it gives false confidence.

---

## The Champagne Principle

"Drinking your own champagne" means more than running your own tests. It means:

1. **Intention verification:** each test tests the INTENTION of the requirement it traces to — not just that the code doesn't crash, not just that a function returns something, but that the specific behavior Tron asked for is actually verified.

2. **Self-discovery:** the architect proactively discovers issues BY READING the traceability chain — the chain itself is a diagnostic tool. If the chain shows UC→Method with no Class, the architect catches it before Tron does. Champagne = the traceability system surfaces its own gaps.

3. **Visual evidence:** the tester provides Playwright screenshots of the trace browser as feedback artifacts — not just pass/fail assertions, but screenshots showing what Tron would see. These screenshots are the proof that the champagne is real.

For every chain in `/trace`:
```
Requirement (Tron's INTENTION) → Task → UC → Class → Method → Implementation → Test
```

The leaf TEST must verify the root REQUIREMENT's intention. If it doesn't, the chain is cosmetically complete but semantically broken.

---

## Three-Role Verification

### Req-eng: Intention Match (THIS role leads)

For each chain, req-eng answers: **"Does this test verify what Tron asked for?"**

**Process:**
1. Read the Requirement's `model.name` (atomic one-sentence) and Tron verbatim quote
2. Read the Test's name and its test file source
3. Ask: "If this test passes, can I tell Tron that this specific requirement is satisfied?"
4. If YES → **CHAMPAGNE** — mark the chain as intention-verified
5. If NO → **FLAT** — the test exists but doesn't verify the requirement's intent. File a test-correction requirement.

**Intention categories:**

| Verdict | Meaning | Action |
|---------|---------|--------|
| **CHAMPAGNE** | Test verifies the requirement's exact behavioral intent | Chain is complete — celebrate |
| **FLAT** | Test passes but tests something adjacent/tangential | Tester must rewrite or add a test that targets the specific intent |
| **CORK** | Test is a placeholder/stub that doesn't test real behavior | Tester must implement real verification |
| **EMPTY** | No test exists at the chain leaf | Create test (existing gap — separate from intention mismatch) |

### Tester: Test Correctness + Playwright Screenshot Evidence

For each chain flagged by req-eng, tester answers: **"Does this test ACTUALLY verify the behavior, or does it just check a side effect?"**

**Checklist:**
- [ ] Test name describes the requirement's behavior, not an implementation detail
- [ ] Test assertion checks the OUTCOME Tron would observe, not internal state
- [ ] Test would FAIL if the requirement were NOT implemented (not a tautology)
- [ ] Test does not depend on implementation specifics that could change without affecting the requirement

**Screenshot feedback (Tron refinement):**
The tester provides Playwright screenshots of the /trace browser as champagne evidence:
- Screenshot the trace tree showing the complete chain from requirement to test
- Screenshot the detail view of the test node showing its assertion
- Attach screenshots to the sprint completion report
- Screenshots are the VISUAL PROOF that Tron would see — not just a pass/fail log

### Architect: Chain Integrity + Self-Discovery

For each chain, architect answers: **"Does the chain path make sense — does this Method actually implement this UseCase which actually fulfills this Requirement?"**

**Self-discovery (Tron refinement):**
Champagne is when the architect **proactively discovers issues FROM the traceability chain** — before Tron reports them. The trace browser is a diagnostic tool:
- Read the chain top-to-bottom: does it make semantic sense?
- If UC→Method with no Class → catch it (R18.16 pattern)
- If chain ends at Implementation with no Test → catch it (R18.13 pattern)
- If chain loops back to Task → catch it (R18.9 pattern)
- Report findings BEFORE Tron's next review — that's champagne

**Checklist:**
- [ ] The Class→Method in the chain is the one that actually does the work (not a helper/utility)
- [ ] The UseCase correctly describes the behavior the Method provides
- [ ] The chain doesn't skip levels (no req→test without the intermediate impl)
- [ ] No chain passes through a Class that doesn't actually participate in the requirement

---

## Verification Process

### Per-Chain Walkthrough

For each chain visible in `/trace`:

```
1. REQ-ENG reads the requirement root:
   "R18.1: Scenario browser shows ALL methods; traceability browser shows ONLY the chain-relevant method."

2. REQ-ENG follows the chain to the leaf test:
   Chain: R18.1 → T187 → traceGraph.buildModel → TraceGraph → TraceGraph.children → impl → test

3. REQ-ENG reads the test:
   "it('trace tree narrows class methods to chain-relevant only', () => { ... })"

4. REQ-ENG asks: "If this test passes, is R18.1 satisfied?"
   - Does it verify SCENARIO shows ALL methods? → check
   - Does it verify TRACE shows ONLY chain-relevant? → check
   - VERDICT: CHAMPAGNE (or FLAT if it only checks one half)
```

### Batch Verification

Run champagne verification on ALL complete chains (requirement → ... → test):

```bash
# Count chains by verdict
CHAMPAGNE: N  (test verifies the requirement's intent)
FLAT: N       (test exists but misses the intent)
CORK: N       (test is a stub)
EMPTY: N      (no test at chain leaf)
```

**Target: 100% CHAMPAGNE on all complete chains.** FLAT and CORK are bugs — they need test corrections, not just test additions.

---

## When to Run Champagne Verification

1. **Sprint completion** — before reporting to Tron, verify every chain in the sprint
2. **After data-fill** — when architect fills new chain links (T178 pattern), verify the new paths
3. **After test creation** — when tester adds new tests, verify they match the requirement intent
4. **Tron QA review** — when Tron tests the app, the champagne checklist is the PO's evidence that tests verify intent

---

## Atomic Requirement

- [ ] **R-CHAMP: For every complete chain in /trace, the leaf test verifies the behavioral intention of the root requirement — not just that it passes, but that it tests the right thing.**
  [requirement:uuid:a0b1c2d3-e4f5-6a7b-8c9d-champ0000001]
  > TRON: "let the team eat its own dogfood and verify if the tests test the right thing by verifying the trace chain intention per chain. this is what its all about!!! convert eat your own dogfood into drink your own champagne and become the best programming team in the world."

  **Acceptance criteria:**
  - [ ] Every complete chain (req→...→test) has a champagne verdict (CHAMPAGNE/FLAT/CORK/EMPTY)
  - [ ] Zero FLAT verdicts (tests that pass but miss the intent are corrected)
  - [ ] Zero CORK verdicts (stub tests are replaced with real verification)
  - [ ] Champagne verification runs at sprint completion
  - [ ] Results visible in /trace (chain-level status indicator)

---

## The Standard in One Sentence

**A passing test that doesn't verify Tron's intent is not a test — it's a lie.**

---

**Formulated by:** robbin-req (intention match protocol) + robbin-tester (test correctness checklist) + robbin-architect (chain integrity checklist)
**Approved by:** (pending Tron review via robbin-po)
