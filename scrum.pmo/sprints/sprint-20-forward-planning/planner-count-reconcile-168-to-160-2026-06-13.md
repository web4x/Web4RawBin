# Planner Count Reconcile — sealed 168 → now 160 (UUID-level delta) — 2026-06-13

**Trigger:** SM flag — numerator 168→160, denom 168→201. PO: "drop = same rigor as climb" — produce the UUID-level delta, classify each (a) de-inflation / (b) S20-denominator-only / (c) real regression. SM cross-verifies before any number reaches Tron.

## Method (climb-rigor, tool-strictness controlled)
- **det-3x current HEAD:** complete=**160**, total=**201**, excluded=41 (160/160/160 identical).
- **Seal @f3ce4e56 measured with the CURRENT tool** (worktree-cert; copied current `scripts/` + `skill-classes.ts` onto seal data to isolate DATA changes from TOOL-strictness): complete=**168**, total=168, excluded=41 → **168/168**.
- Diff the COMPLETE chainName sets (seal vs now).

## (a) DE-INFLATION = 0  — PROVEN
The current (stricter) tool on the SEAL data still yields **168/168**. There is **no over-credit in the sealed set** by today's rules. The 168→160 drop is **NOT** de-inflation.

## (b) S20-denominator-only — the +33 denom growth, numerator-neutral
Denom 168 → 201 (+33) = new **incomplete** reqs added after seal: R19.83–102 (chain-open at UC) + S20 R20.1–R20.4. These add to the DENOMINATOR only; they do **not** subtract from the numerator. Confirmed: the numerator drop is entirely (c), not (b).

## (c) REAL REGRESSION = 11 reqs — genuine@seal, broke post-seal at the Impl hop
All 11 were complete@seal (under the current tool) and are open NOW, every one at the **Impl hop**. Root cause: post-seal in-room-consolidation work (R19.90/101 etc.) wired **NEW methods to EXISTING impls** (shared-impl, several cross-class) instead of giving each its own impl — tripping the structural `impl→1-method` guard, which correctly opens every chain touching the shared impl (including the originally-genuine one).

| Req | UUID | broke at | shared impl (now wired by N methods) |
|-----|------|----------|--------------------------------------|
| R19.11 | 61c2661a-fb8a-489a-9d5d-abc4e819cf5d | impl | e289349c ×3 (RbRoomContent.render + RoomView.diffRenderItems + RoomView.awaitItemUpgrade) |
| R19.12 | dc2e99eb-8e31-4337-887b-8204f7588c20 | impl | e289349c ×3 (same) |
| R19.13 | 409ea58b-763b-433e-b17d-0ea156d94355 | impl | e289349c ×3 (same) |
| R19.21 | d1391ee3-d08c-4db1-8445-753b4d1c89a3 | impl | 32578dc6 ×2 (RbRoomContent.mountTraceTree + RoomView.seedIorTree) |
| R19.27 | 4603db83-167a-43a2-a06f-1f56167eb34b | impl | f7b0c24a ×2 (RbObjectItem.squareCollapse + longPressCollapse) |
| R19.31 | 836c97f9-0c2a-4974-9a77-d4658296fd2e | impl | 71c283ff ×2 (RoomView.fixBrokenLink + RbRoomContent.linkResolve) |
| R19.63 | 6052570f-4630-4cdf-8270-6ef29eec33df | impl | f94da2cd ×2 (RbDetailDrawer.filePreview + filePreviewButton) |
| R19.69 | d989c0c4-d024-44de-b3e2-ef271c731157 | impl | 96fbfac9 ×2 (ContentPreviewer.iframeSandbox + touchActionFix) |
| R19.71 | 91ba9fbd-6482-44bc-ab88-1efc14a04af4 | impl | 28f244c7 ×2 (Room.forwardRefs + server.roomCollectionChildren) |
| R19.72 | 380dc7c0-0dec-4bc4-b0a0-dafa3552b86b | impl | 25884b0c open (removeLocalIdentity impl marker/wiring changed — relates to R19.89 button move) |
| R19.73 | 02af5fc2-2cc5-4a32-ba6c-1167a0a513d6 | impl | 6471cfbd ×2 (RoomView.openFilePreview + RbRoomContent.filePreview) |

**Fix (expert/data lane):** give each new in-room method its OWN Impl unit + real `[impl:uuid:]` marker; un-share. NOT a code/runtime regression — a DATA/wiring regression from the marathon's impl-reuse. Likely overlaps tonight's 22:07 backfill scope.

## Math closes
168 (seal) − 11 (regressed) + 3 (new genuine completions since seal) = **160**. ✓ (det-3x)

## TRUE canonical now & trajectory
- **TRUE = 160 / 201** (41 excluded), det-3x stable.
- Trajectory: **168/168 (100%, sealed @f3ce4e56)** → denom +33 (S20 + R19.83-102 added incomplete) → 11 impl-share regressions (−11) offset by +3 new completions → **160/201 ≈ 79.6%**.
- Recovery: un-share the 11 impls (each method own impl+marker) → restores ~171/201; R19.83-102 + S20 chains complete forward toward 201.

## Bottom line for SM/Tron
- **(a) 0 de-inflation** (seal was genuinely 168, proven with current tool).
- **(b)** denom +33 = new incomplete reqs (numerator-neutral).
- **(c) 11 real regressions** (UUIDs above) — fixable shared-impl wiring at the Impl hop, not runtime breakage.
- The sealed-168 was HONEST; the drop to 160 is real but recoverable + fully explained.

---
## UPDATE — T-TOOL-1/2 correction: CERTIFIED 158/207 excl 44 (2026-06-13T18-01)
Skill-expert + PO: T-TOOL-1/2 landed — **superseded reqs auto-excluded** from the canonical denominator. excl 41→44 (+3). Planner det-3x CERT (source-verified, not relayed):
- **complete=158, total=207, excluded=44** — det-3x identical (158/158/158).
- **+3 exclusions are genuinely superseded** (verified): R18.24 (c9de63d7) `supersededBy` 7734f4e1; R19.58 (af607390) `supersededBy` 7734f4e1; + 1 other parallel chain. Superseded ≠ open — correct to exclude (honest de-inflation, like orphanByDesign).
- **160→158 is NOT a regression:** it's the supersession-exclusion correction (R18.24+R19.58 were counted complete; now excluded as superseded → −2 numerator). The denom 201→207 reflects new R20.x atomics.
- **The 11 shared-impl regressions PERSIST** (R19.11/72/73 spot-confirmed open) — unchanged; still the T-s19-shared-impl-split-recovery (d43fce61) target. Fixing them recovers toward ~169/207.

**CORRECTED CANONICAL BASELINE = 158/207 excl 44** (snapshot 2026-06-13T18-01). Certified det-3x; superseded-exclusions verified. Ready for SM independent seal.
