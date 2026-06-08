# Intention Verification Model — Structural Chain vs Declared Intention

**Source:** Tron champagne finding 2026-06-05 (via robbin-po): 276 chains, only 11 verify intention (4%).
**Authors:** robbin-architect (lead) + robbin-req (JOINT)
**Context:** Shared-class fan-out (RbObjectItem used by 11 UCs) means the structural chain reaches tests that test the SHARED method, not the specific requirement. The model conflates code-dependency with intention-verification.

---

## The Problem

```
R16.4 (chain-data-diagnosis)
  → T123 (pageNav sticky)
    → UC contacts.memberClick
      → Class RbObjectItem          ← SHARED by 11 UCs
        → Method render              ← SHARED
          → Impl ...
            → Test "RbObjectItem renders correctly"
```

The test verifies that RbObjectItem renders. It does NOT verify that chain-data-diagnosis works. The structural chain correctly shows the CODE PATH — but the test's INTENTION is about RbObjectItem, not R16.4.

**96% of chains have this mismatch.** The structural chain reaches shared-infra tests, not dedicated requirement tests.

## Two Distinct Concepts

### 1. Code Traceability (structural chain — EXISTING)

```
Requirement → UseCase → Class → Method → Implementation → Test
```

(6-step chain; Task is navigation, not chain — corrected 2026-06-08)

**Answers:** "Which code exists because of this requirement?"

This is the LOCKED 7-step chain. It traces the CODE PATH forward from a requirement through the components that implement it. Fan-out through shared classes is CORRECT here — it shows all code affected by the requirement.

**This is NOT broken.** The structural chain does what it's designed to do.

### 2. Intention Verification (semantic — NEW)

```
Test --declares--> Requirement + AC
```

**Answers:** "Does this test VERIFY this requirement's acceptance criteria?"

A test verifies a requirement's intention ONLY if it EXPLICITLY DECLARES that requirement. The test's own `[test:uuid]` annotation + requirement/AC reference is the intention link — not the structural graph walk.

**This is what champagne needs.** Structural reachability alone is necessary but not sufficient.

## The Model: Champagne = Structural + Intentional

A requirement is **champagne-verified** iff there exists at least ONE test that satisfies BOTH:

1. **Structurally reachable** — the test is reachable from this requirement via the 7-step chain (code traceability ✓)
2. **Declares this requirement** — the test's `verifies[]` field includes this requirement's UUID or AC identifier (intention ✓)

Both conditions must hold. Neither alone is sufficient:

| Structural | Intentional | Status |
|-----------|-------------|--------|
| ✓ reachable | ✓ declares req | **CHAMPAGNE** — verified |
| ✓ reachable | ✗ tests shared infra | **Gap** — test exists but doesn't verify THIS req |
| ✗ unreachable | ✓ declares req | **Orphan test** — declares req but isn't in its chain |
| ✗ unreachable | ✗ no declaration | **No coverage** — neither code nor test |

## Three Categories of Tests

### Dedicated Tests (verify intention)
Test explicitly references a specific requirement + AC. Written TO VERIFY that requirement.

```typescript
/**
 * [test:uuid:abc123] R16.4 AC3 — chain data renders correctly
 * verifies: [requirement:uuid:b2237873...]
 */
class Test_R16_4_ChainDataRenders extends DefaultWeb4TestCase { ... }
```

→ Champagne for R16.4 ✓ (structural + intentional)

### Shared-Infra Tests (verify code, not intention)
Test verifies a shared class works. Reachable from many requirements via fan-out.

```typescript
/**
 * [test:uuid:def456] — RbObjectItem renders name and description
 * verifies: [requirement:uuid:R15.4-uuid] (the ORIGINAL req for RbObjectItem)
 */
class Test_RbObjectItem_Render extends DefaultWeb4TestCase { ... }
```

→ Champagne for R15.4 ✓ (dedicated to RbObjectItem's own requirement)
→ NOT champagne for R16.4 (structurally reachable but doesn't declare R16.4)

### Integration Tests (verify cross-cutting)
Test references multiple requirements. Champagne for each declared req.

```typescript
/**
 * [test:uuid:ghi789] — full chain walk from requirement to test
 * verifies: [requirement:uuid:R17.47-uuid], [requirement:uuid:R-E-uuid]
 */
```

→ Champagne for R17.47 + R-E ✓

## Data Model Addition

### Test.verifies[] (NEW field)

```json
{
  "ior": "ior:class:Test",
  "model": {
    "uuid": "...",
    "name": "Test_R16_4_ChainDataRenders",
    "verifies": ["ior:instance:<R16.4-requirement-uuid>"]
  }
}
```

Population: parse `[test:uuid]` annotations in test files. The existing annotation format often includes the requirement reference (e.g., `[test:uuid:abc123] R16.4 AC3`). Extract the R-number, resolve to requirement UUID, write `verifies[]`.

### Champagne Walk (algorithm)

```
For each Requirement R:
  1. Walk structural chain: R → ... → collect all reachable Tests
  2. For each reachable Test T:
     if R.uuid ∈ T.verifies[]:
       R is CHAMPAGNE-VERIFIED by T
  3. If no reachable Test declares R:
     R has STRUCTURAL coverage but NO intention verification
     → Gap: needs a dedicated test
```

### Champagne Report

```
Champagne Summary:
  Total requirements: 82
  Structurally covered (any test reachable): 75
  Intention-verified (test declares req): 11      ← current state
  Gap (reachable but no declaration): 64          ← need dedicated tests
  No coverage (unreachable): 7                     ← need chain data
```

## What Changes, What Stays

| Concept | Before | After |
|---------|--------|-------|
| Structural chain | 7-step forward-only | UNCHANGED — still shows code path |
| Shared-class fan-out | Treated as intention | Correctly categorized as code-dependency |
| Champagne criterion | Structural reachability alone | Structural + intentional (both required) |
| Test.verifies[] | Didn't exist | NEW — declares which requirement the test intends to verify |
| 96% mismatch | Appeared as failures | Correctly categorized as "shared-infra coverage without dedicated intention tests" |

## Implication for the Team

The 265 mismatches are GENUINE gaps — those requirements don't have dedicated intention-verifying tests. The correct response is NOT to remove shared-class links from the chain (that would break code traceability). The correct response is:

1. **Accept** that shared-class tests provide code coverage but not intention verification
2. **Write dedicated tests** for each requirement's specific AC (the champagne work)
3. **Annotate** each test with `verifies: [requirement-uuid]` so the champagne walker can match

This is the path from 11/276 (4%) to champagne. Each dedicated test moves one requirement from "gap" to "verified."

---

**Formulated by:** robbin-architect (2026-06-05)
**Pending:** robbin-req confirmation of the structural-vs-intentional separation + Test.verifies[] field specification
