# Identity-Family Detector — TWO root causes, FOUR symptoms (item 3)

**Author:** robbin-architect · 2026-08-08. PO two-cause synthesis. ONE detector, full-uuid-ONLY, fail-closed on truncation (or it reproduces the phantoms it's meant to find). Feeds the pre-flight + the gate + repair sizing. Folds into R-C3.

## The causal theory (why this is 2 causes, not 4 diseases)
- **CAUSE A — FABRICATED (hand-typed) uuids → PREFIX-COLLISIONS.** Hand-typed values cluster in low-entropy space; real random v4 uuids essentially never share 8 chars. §4 proves it: Impl `3542dcb3-a1b2` is fabricated, and THAT is exactly why it collides with the Method `3542dcb3-aae6`. Measured: 16 of 18 collision groups involve a fabricated uuid. **Re-mint the fabricated one → the collision is gone. One fix, two symptoms.**
- **CAUSE B — TRUNCATED STORED REFS → PHANTOM ORPHANS.** A ref stored as `5d9132cf` (8-char) fails a full-uuid lookup → the unit LOOKS orphaned but is well-formed (14 of my "289 orphans" were this). **Fix the REF (restore full uuid), never assign a new owner.** Different fix entirely.

## The four symptoms (views of the two causes) + MEASURED counts
| Symptom | Cause | Count (full-uuid, sentinel-excluded) | Fix |
|---------|-------|--------------------------------------|-----|
| FABRICATED uuid | A | HIGH 65 / MED 32 / REVIEW 34 (one entropy rule; reconciles my 33 & req's 113 — tune threshold WITH req) | re-mint (gated migration, rewrite refs) |
| PREFIX-COLLISION | A (16/18) | 18 groups / 67 members | killed by re-minting the fabricated member |
| TRUNCATED STORED REF | B | **43** (ownerIor 41 · useCases 1 · tasks 1) | repair the ref → full uuid |
| PHANTOM/TRUE ORPHAN-OWNER | B (phantom) / real | TRUE 275 (14 were phantom = truncated-ref, moved to row above) | real: assign-owner via reverse-link; phantom: it's a truncated-ref, fix the ref |

## Detector design (ONE module `identity-classify.ts`, imported by pre-flight + gate + repair)
- **Full-uuid ONLY.** Every reference resolution is on a 36-char uuid; a non-36-char stored value is classified `TRUNCATED-REF`, NEVER silently treated as dangling/orphan (that's the phantom trap). Fail-closed.
- **`classifyUuid(uuid)`** — FABRICATED via ONE entropy rule: HIGH = ascending-x11 run ≥4 OR nibble-entropy < 2.5 (catches ascending-pair tails AND family-prefix schemes like `16a010xx`); MED = entropy < 3.2; REVIEW = weaker signal. Single entropy rule → ONE number both req & I import (kills the 4th divergence).

### ★ REGISTERED-SENTINEL exclusion (the INVERSE problem — PO 2026-08-08) — provable, NOT a skip-list
The detector kills fabricated identities, but some patterned identities are DELIBERATE and CORRECT — a random v4 there would BREAK a lookup. Example: the S40 UmlNode M2 unit `a1d2e3f4-0000-4a1b-8c2d-000000000021` joins the existing M2 metamodel catalogue family (`a1d2e3f4-…0003` = UmlClass, etc.) — patterned ON PURPOSE so the M2-family lookup works. My entropy rule flags exactly that shape. **A tool that removes fiction must NOT erase deliberate truth (both-directions rule).**
- **`fabricated(uuid) = patterned(uuid) AND NOT isRegisteredSentinel(uuid)`.**
- **`isRegisteredSentinel` reads a REGISTRY the detector CONSULTS — it is not a hand-maintained skip-list.** Legitimacy must be PROVABLE (declared somewhere the detector reads), never REMEMBERED (someone recalling which uuids were on purpose). The registry sources: **(a) the M2 metamodel catalogue** — any `ior:class:ModelElement` in the declared `a1d2e3f4-…` family is a metamodel sentinel; **(b) system constants** — `00000000-0000-4000-8000-000000000001` (root), the CurrentSprint singleton, etc.
- **Exclude by FAMILY / registry-membership, NOT per-uuid** — the S40 `…0021` and the next legitimate M2 member (`…0022`, …) must ALL be covered by the family rule, or each new sentinel trips the detector again.
- **Forward (mint side):** when the mint-path creates a deliberate sentinel (a new M2 member, a system constant), it REGISTERS it (joins the declared catalogue / sets a `sentinel` marker) so the detector proves-it-legit by reading. `mint-or-refuse` still rejects a patterned uuid that is NOT a registered sentinel. **Without this, the detector will eventually "repair" our own metamodel into breakage — the only safeguard being memory, which is exactly what "provable-not-remembered" removes.**
- **Do NOT build now (S40 features first, Tron). RECORDED here** so the detector is built with the registered-sentinel concept from the start, not retrofitted after it damages a sentinel.
- **`classifyRef(field, value)`** — TRUNCATED-REF if `!isFull(value)` (scan ownerIor/method/class/implementations[]/tests[]/useCases[]/tasks[]/…). Report per-field count.
- **`classifyUnit(unit)`** — ORPHAN-OWNER only if ownerIor is EMPTY or a FULL-uuid that genuinely doesn't resolve (never a truncated-ref).
- **PREFIX-COLLISION** = two full uuids sharing 8 chars; flag + tag whether a member is fabricated (the cause).

## Repair ordering (causes before symptoms — one fix clears two)
1. **Fix truncated stored refs (43)** first — restores full-uuid resolution → the 14 phantom orphans vanish from the orphan count by construction (they were never orphans).
2. **Re-mint fabricated uuids (gated migration, dry-run+count, rewrite every ref)** — collapses most prefix-collisions at the source (16/18).
3. THEN size the residual TRUE orphan-owner (275) + any genuine collision left. Repair-1003 stays gated behind this — sizing on pre-fix counts would mutate non-defects.

## Forward guards (mint-or-refuse — never accept a hand-typed/truncated identity)
- Mint-path REFUSES a non-random (low-entropy/patterned) uuid and a non-36-char ref at write (req's R5 `dfb19e33` truncation-ban is the write-side of this).
- `trace:audit:strict` fails on TRUNCATED-REF (absolute-0, it's a hard well-formedness class) + on NEW fabricated/collision beyond baseline (delta, item 4).
