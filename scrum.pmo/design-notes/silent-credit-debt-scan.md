# Silent-Credit-Debt Scan — comment-only shipped work (capture + campaign triage)

**By:** robbin-architect 2026-08-11, per PO. Pattern: a source function carrying a `// R<n>.<n>` / `// T<n>.<n>` requirement-ref comment with NO `[impl:uuid:<36-char>]` marker in its body = potentially real shipped work invisible to the chain (can never reach QA-Review, its gate never legitimately credited). R40.17 is the known instance.

## Counts (MEASURED)
- **115** candidate debt functions across `src/` (178 raw line-hits → 115 at function granularity). Full list: `scratchpad/debt115.json` (capture as a req — NO silent cap).
- ★ **SCOPE CORRECTION (verify caught it):** an initial all-Task count read 189-below / 88-at-QA — dominated by a **"?" bucket of 319 tasks with UNRESOLVED sprint parents** (the fabricated/synthetic cluster — overlaps `[[fabricated-identifier-sweep-guard]]`). Excluding that + scoping to the CAMPAIGN sprints (S30/S31/S32/S37/S40) gives **12 below-QA + 33 at-QA tasks** — matching the PO's 13/32 (off-by-1 at a status boundary).

## ★ CAMPAIGN INTERSECTION (the campaign-critical cut)
Debt functions whose req-ref belongs to a campaign task:
- **AT-QA debt = 32** (WORST — Tron about to approve a task whose real impl is uncredited). Heavy in `rb-diff-editor.ts` (merge-editor R30.x: mountThreePane/loadSide/save/addSide/removeLine/openFromParams/openRepoManager/jumpToChange/renderInterPaneGutters/renderConnectorRibbons/connectedCallback), `rb-update-banner.ts` (R30.14 SW), `edit.ts` (R30.35), `universal-actions.ts` (R40.10), `repo-registry.ts` (R30.43 ×3), `sprint-pin-resolver.ts` (R37.1 ×2), `server.ts` (R31.1 renderFeatureGrants / R40.4 traceabilityRoots), `diagram-view-model renderFacet` (R40.2), `rb-terminal-detail mount` (R40.1), `TsToModel generate` (R32.5), `consistency-guard` (R37.1), `rb-requirement-detail render` (R40.10), `rb-file-detail render` (R40.12), `rb-editor-toolbar render` (R40.7).
- **BELOW-QA debt = 1**: `sprint-overview-generator.ts:63 renderIndex [R37.6]`.

## ★ HONEST CAVEAT — this is a CANDIDATE set, not confirmed debt
Heuristic. It includes (a) **explanatory refs** — a function that *uses* / is styled-per a requirement whose real impl is a different, already-marked function (e.g. `renderFacet [R40.2]` is the already-chained R36.1/2 shared facet-lens; the comment is a use-ref, not an impl-claim); (b) helper/private functions legitimately marker-free (the marker sits on the public method). So the true campaign-critical debt is a SUBSET of the 33. Each needs verify-owner-first triage: *is THIS function the chain-worthy impl of that requirement, or does the req's real impl live elsewhere already-marked?* — the same rigor that confirmed R40.17 real. R40.17 (universal-actions handlePinDesignate + connectedCallback subscribe) is a CONFIRMED instance in this set.

## Recommendation
The 33-item campaign set is TRACTABLE (vs a blind 115-item sweep the PO explicitly rejected). Next step = architect verify-owner-first triage of the 33 → the confirmed true debt (likely a handful), each then req-minted a marker/Impl so its task can be legitimately credited before Tron's verdict. Full 115 = a captured req (post-campaign debt). The "?" 319-unresolved-parent bucket = a separate data-integrity finding (folds into the fabricated-identifier work).

## ★★ CORRECTION + CAMPAIGN CLEARANCE (2026-08-11, after triage)
MY SCAN HAD A BUG: it checked only the function BODY for an `[impl:uuid]` marker — but the standard placement is ADJACENT-ABOVE the decl (AST-attach; I documented this myself). So it FALSE-flagged every function whose marker sits above its decl. `renderFacet` exposed it (marker `[impl:uuid:94ad4f50…]` at diagram-view-model.ts:73, decl :78 — body-scan missed it → false "debt"). Corrected scan (marker checked ABOVE-decl + body): **total 115→51, campaign-intersection 33→10.**
TRIAGE of the corrected 10 (req-chain discriminator): **ALL 10 = CLEAR (req-credited-elsewhere — the requirement has a marked impl; these functions are USE-REFS).** ⇒ **CAMPAIGN-CRITICAL TRUE-DEBT INTERSECTION = EMPTY.** No campaign at-QA task's credit rests on an unmarked impl. Tron can render the 33 verdicts safely on this axis.
- The 51 corrected total = ordinary POST-CAMPAIGN debt (capture req).
- R40.17 (captureOnly req, NO chain at all) remains the ONE confirmed real debt — already mapped to req (distinct chain).
- MINOR post-campaign note: R30.14 has 3 impl units unmarked/unplaced in files OTHER than these functions — its task is still credited via 1 marked impl (not campaign-blocking).
