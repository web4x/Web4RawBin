# f3 (tap/longpress) untangle + graph-integrity PRE-FLIGHT (architect, for req + PO)

**Author:** robbin-architect · 2026-08-08. req measured-first + held the mint (correct). MEASURED with FULL uuids — which corrects most of the reported defects (the §4 prefix-collision pattern again) and shrinks the untangle.

## FULL-UUID TRUTH (corrects the raw-read findings)
- **#2 "TWO duplicate `tapSwitchToggle` Methods" → FALSE (uuid head-vs-tail artifact).** `aee56fad.method` = `6b21088e-b6ba-44a8-83d8-bc4d8c249dcd`; the map's `6b21088e` is the SAME uuid (req read the tail `bc4d8c249dcd` as a second unit). Class `SelectionModel b57b8838`.methods[] = exactly `[10f3d3d4, c3c70517, 6b21088e]` — ONE tapSwitchToggle. **No dedup.**
- **#1 "gate Impls ORPHANED (empty ownerIor)" → FALSE for the gate targets.** Both resolve to real Methods on Class `RbObjectItem 3bc876b5`:
  - `cc1dcd0e-93b2` (handleTapSelect impl) → Method **`RbObjectItem.tapSingleSelect` 5cdfac82** → RbObjectItem. WELL-FORMED.
  - `4256aef7-7580` (simulateLongPress impl) → Method **`RbObjectItem.longPressMultiSelect` 0146ee6c** → RbObjectItem. WELL-FORMED.
- **#3 prefix collision `4256aef7` → TRUE.** `-7580` (RbObjectItem.simulateLongPress, the gate target, well-formed) vs `-3aee` (scenario-view impl, **empty ownerIor** = a genuine ORPHAN, but NOT f3-related). Use FULL `-7580`.
- **#4 `47528657` over-credit → TRUE.** It's a **Test** named `R15.4` whose owner `f2c32dc3` is **DANGLING**, cross-listed in the tests[] of `cc1dcd0e`, `4256aef7-3aee`, AND `4256aef7-7580` — a foreign (R15-era) test over-crediting three R20/scenario impls.

## ★ MAP CORRECTION (my earlier Group-D map was wrong for c/d)
The built gesture code + the f3 tests live on **`RbObjectItem`** (the item that handles the tap/long-press gesture), NOT `SelectionModel.tapSwitchToggle`. So:
- **R20.6c** (tap→single-select) → Method `RbObjectItem.tapSingleSelect 5cdfac82` (impl `cc1dcd0e`) — adopt Test `2fe84858` (tap-switch) here.
- **R20.6d** (long-press-toggle) → Method `RbObjectItem.longPressMultiSelect 0146ee6c` (impl `4256aef7-7580`) — adopt Test `ff903752` (longpress-toggle) here.
- `SelectionModel.tapSwitchToggle 6b21088e` is the selection-STATE helper (shared); the gesture chain is where the tests belong. (Supersedes my §2 map line for c/d.)
- NOTE: `2fe84858` / `ff903752` did NOT resolve on disk in my scan — req is minting them; verify they exist before adoption.

## The REAL untangle (small — no dedup, no gate-impl orphan-fix)
1. **Remove foreign Test `47528657` (R15.4)** from the tests[] of `cc1dcd0e`, `4256aef7-7580`, `4256aef7-3aee` (over-credit; it's R15-era, owner dangling).
2. **Adopt the real f3 tests** onto the well-formed gesture chains: `2fe84858`→ Impl `cc1dcd0e` (tapSingleSelect); `ff903752` → Impl `4256aef7-7580` (longPressMultiSelect). Wire `Impl.tests[]` + `Requirement.useCases[]` per the corrected map.
3. **Log `4256aef7-3aee`** (scenario-view, empty owner) into the ORPHAN-OWNER debt list (separate; not an f3 blocker).
4. NO Method dedup, NO gate-impl re-owner (both already correct).

## ★ PRE-FLIGHT (PO ask — find blockers UPFRONT, not one adoption at a time)
- The Group-D REQ-CHAINS all pre-flight **CLEAN** — because the malformed units are the **adoption TARGETS** (loose Impls/Methods/Tests req will wire), NOT yet in `req.useCases[]`. → the pre-flight must run the shared `classifyCollisionArtifact` over each pending adoption's **target-unit set** (the specific Impl/Method/Test uuids), not the wired chain. **Ask req/planner for the credit-next target-unit list** (remaining Group-D, R-C1/R-C6 refinement chains, A1=15) so I run it precisely.
- **Delivered now — the 18 PREFIX-COLLISION groups (the class that CREATES false findings).** ★ Root insight: **most are FAKE-SUFFIX uuids** (fabricated, not real v4 — real v4 UUIDs do not collide on 8 chars): `d4e5f6a7` = 14 `R17.x` reqs all `-b8c9`; `a1d2e3f4` = 20 ModelElements all `-0000`; plus many `-a1b2-4c3d-8e4f-…` templated impls. Only a FEW are genuine random collisions biting adoptions: `3542dcb3` (§4), `4256aef7` (f3), `76bbedda`, `e927ecfe`, `63d58e0f`, `bfbc0874`, `79601135`, `01771d5b`. → **Recommend the prefix-guard ALSO flag fake-suffix uuids** (a `[0-9a-f]{4}`-repeated / non-random-suffix pattern) — connects to `strict-marker-audit`'s existing FAKE detector + the never-fake-suffix rule (my SKILL #17). Real random uuids don't collide; a collision is a fake-suffix smell.
- **Master malformed-inventory** req checks any adoption target against: PREFIX-COLLISION (18 groups / 67 members, list above) + ORPHAN-OWNER (289 units, from the shared classifier) + foreign-test over-credit (a Test in >1 Impl.tests[] with mismatched era/intent, e.g. R15.4 on R20 impls).

## ★★ PRE-FLIGHT RESULT (PO priority #1 — identity-family classify per credit-next target)
Ran the identity-family classifier over the identifiable credit-next targets. ONE list, defect-class per chain:

| Chain | Verdict | Defect (full-uuid) |
|-------|---------|--------------------|
| A1 `54519bc4` parseTestCase | **MALFORMED** | `e4f5b693-2150` PREFIX-COLLISION · `e4f5b693-c1d2` PREFIX-COLLISION + FABRICATED |
| A1 `e83dc244` resolveOrEnroll | **MALFORMED** | `cc6df739` ORPHAN-OWNER |
| A1 `842d4f01` mintOrReuseShared | **MALFORMED** | `4a7d30bb` ORPHAN-OWNER |
| f3 R20.6c tapSingleSelect | **MALFORMED** | `2fe84858` (tap-switch Test) **TRUNCATED** |
| f3 R20.6d longPressMultiSelect | **MALFORMED** | `4256aef7-7580` PREFIX-COLLISION · `ff903752` (longpress Test) **TRUNCATED** |
| f3 SelectionModel methods | **CLEAN** | — |
| R-C1 resolveSprintPin | **CLEAN** | — |

★ **Key: the f3 Tests themselves (`2fe84858`, `ff903752`) are TRUNCATED uuids** — that's why they didn"t resolve on disk. The real f3 blocker = truncated Test uuids + the 4256aef7 collision, NOT the (well-formed) gesture chains. **⚠ INCOMPLETE:** the remaining Group-D (R20.6e/f/g/h) + R-C6 + §4 adoption-target uuids are needed from req/planner to finish the sweep — the malformed lives in the ADOPTION TARGETS, not the wired chains, so I can only classify targets I"m given. Sending req this list; req mints against CLEAN only + fixes the named defects.

## ★ 3 more malformed A1 rows (req audit) + FABRICATED-UUID detector (PO ask — I ran it)
**Add to the pre-flight list (all confirmed my two catalogued classes, landing on rows Tron is about to sign):**
- **54519bc4** = PREFIX-COLLISION on `e4f5b693` (UC `testCase.parseFromSource` e4f5b693-**2150** vs Impl `parse-test-cases.ts` e4f5b693-**c1d2**, different KINDS = §4-class). Disambiguate by full uuid.
- **e83dc244** = Impl `cc6df739` (IdentityResolver.resolveOrEnroll) ORPHAN-owner (empty ownerIor; Method 4e203d64↔Impl link one-directional). Assign owner (reverse-link).
- **842d4f01** = Impl `4a7d30bb` (Company.mintOrReuseShared) ORPHAN-owner.
These are ORPHAN-OWNER + PREFIX-COLLISION on SIGNABLE rows → the classes are BLOCKERS, not backlog.

**FABRICATED / HAND-CRAFTED UUID detector — ran graph-wide (5273 units). ★ HONEST count (my raw detector over-counts, classify-don't-naive-count):**
- **HIGH-confidence fabricated = `ascending-x11` 33** — a run of ≥4 bytes each = prev+0x11 (the `…a1b2-4c3d-8e4f-5a6b7c8d9e0X…` template family). Real v4 uuids virtually never do this. = NEEDS-REMINT. (17 Requirements + 9 Implementations + …). e.g. `01771d5b-a1b2-4c3d-8e4f-5a6b7c8d9e0f`.
- MEDIUM = `literal-seq` 38 (contains 0123/89ab/cdef/dead/beef…) → NEEDS-REVIEW (some chance hits).
- ★ **LOW / MOSTLY FALSE = `repeated-nibble` 106** — my `/(.)\1{3,}/` rule flags ANY 4-same-nibble run, which a RANDOM uuid hits by chance: e.g. `0146ee6c-…-9ca6**5555**ed88` is a REAL method (f3's longPressMultiSelect owner), flagged only for a chance `5555`. → NOT reliable; the rule must require the WHOLE uuid patterned, not a chance run. Do NOT auto-remint these.
- **★ ROOT CONFIRMED: 16 of 18 prefix-collision groups involve a fabricated uuid** → fabricated (patterned) uuids CLUSTER and are the ROOT of nearly all prefix collisions. Fixing fabricated-uuid-minting kills most of the collision class at the source.
- **DETECTOR SPEC (fail-closed toward NEEDS-REVIEW, not auto-remint):** flag NEEDS-REMINT only on HIGH-confidence whole-uuid patterns (ascending-x11 run covering the tail, all-zero template, exact known literals); everything else → NEEDS-REVIEW. Belongs in the mint-path guard (mint-or-refuse: reject a hand-typed identity at mint) + `strict-marker-audit`'s existing FAKE detector [[never fake-suffix UUIDs / SKILL #17]]. Give the tuned high-confidence count from the shared detector; ~33+ confirmed, ≤179 upper bound.
