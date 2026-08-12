<!-- planner-owned — verify-owner-first gate-Test map for the 7 held rows (gateServedVersion stamping) -->
# Held-row → DISTINCT own gate-Test map (verify-owner-first)

**Measured 2026-08-12 from units** (scratchpad/held-map.mjs). Purpose: the tester stamps `gateServedVersion` on each held row's **OWN distinct-intent** gate-Test, NEVER a shared-Impl Test that belongs to another req (the 94ad4f50 R36.2-vs-R36.3 borrowed-credit rule). **Rule applied:** the shared Impls `a0b30550` (RbDiffEditor merge core) + `e24dc98a` (merge gutter/toolbar) are **R30.9's** (original owner); R30.35/50/52 each carry their OWN distinct-intent Tests, so no row stays HELD for lack of distinct evidence — each stamps its own.

## Already stamped (tester, distinct, on 72e4e143f)
- R37.3 → `caf74333…` · R37.7 → `0870c78b…` · R40.8 → `c4a7f1b9…` (gateServedVersion=0.8.92 ✓)

## The 4 merge rows — STAMP the OWN gate-Test you re-ran; NEVER the FOREIGN

### R30.9 (task 6a6a56d3-3e06-44e9-9ca2-b7c11d574bff) — ORIGINAL owner of a0b30550/e24dc98a
OWN (all `test:R30.9`, stamp whichever gate you re-ran):
- `eb4a550e-1151-49b0-a52a-db3ecaa16ee5` computeMergedCenter (impl a0b30550)
- `8fa42d89-0e86-45c4-b88b-f0a978782da0` renderMergeGutter (impl e24dc98a)
- `02117d3d-798a-4695-a140-219fd0265676` mountThreePane · `555a3077-104a-4535-a8dc-4e4815d5a14e` acceptChange
- `79139c01-754f-4867-9e77-bf9a255ce54f` applyAllNonConflicting · `de62d07f-b366-4d60-82fa-5d916c1f8e31` syncScroll3
- `a7ad62f1-63a7-41da-838c-e860e45115ee` GitApi.mergeBase · `2b3b0d79-53bf-4c00-ad3d-eb35b7800c10` monacoLoader

### R30.35 (task 16379ac9-889f-43b6-96da-c24f5505f7ab)
OWN (`test:R30.35`): `5d8b3f47-1a29-4e6c-b0d4-7f2e9a63c815` diff-coloring · `8a2f7d6c-4b91-4e05-a3d7-1f6c9e28b504` both-versions-center · `5c9e2a71-8d34-4b0f-a6e2-3f71c085d946` 2-block-render
FOREIGN — DO NOT STAMP: `eb4a550e`/`555a3077` (R30.9), `ab33b3e8` (R30.23), `3c8a5f19` (R30.27/29/30)

### R30.50 (task 7ed31b36-ba6f-4d25-8f22-7da1f74dbbb2)
OWN (`test:R30.50`): `0866205d-5bb6-4dcb-8273-67b0b8843f9a` change-number · `4d2260ea-5164-4171-a235-a37b6069263a` applyAllFromSide · `690f963c-f274-4ccd-8a68-781497a802c1` saveOrJumpToConflict · `5296e852-8b5e-4d7a-88e4-015e6f772e3a` updateSaveButtonState · `9e1bfc3d-4a8a-45d5-8d7c-ffa19217ca7a` openApplyAllMenu
FOREIGN — DO NOT STAMP: `8fa42d89` (R30.9), `919d290d`/`53731d96` (R30.52)

### R30.52 (task a0b24e6b-aa8b-4341-9f9d-ad158c5cb12e)
OWN (`test:R30.52`): `919d290d-e917-4cd1-a927-48470b582469` toolbar-layout · `53731d96-ce8f-498b-8381-1a64c2ad1e40` mobile-toolbar-visibility
FOREIGN — DO NOT STAMP: `8fa42d89` (R30.9), `0866205d` (R30.50)

**HELD-default reminder:** if for any row you did NOT re-run its own gate fresh (only rode the shared r309/a0b30550/e24dc98a), that row STAYS HELD (FRESHNESS-UNRECORDED) — borrowed credit is not credit. All 7 were re-run per your report, so all 7 have a distinct own gate to stamp.
