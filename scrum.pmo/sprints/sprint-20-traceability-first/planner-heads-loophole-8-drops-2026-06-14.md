# Heads-loophole close: 8 dropped chains classified (planner, 2026-06-14)
Tool fix 5b8fc82b1 (heads branch now requires name-match) — SETTLED, det-3x 18/204 excl 47, 5/5 anchors. The '26' was inflated by 8 chains passing ONLY via heads-no-name-check. Per-chain assess (PO method: genuine-typo-relabel vs different-method-over-credit):

| req | impl heads (source) | marker label | verdict | action |
|-----|---------------------|--------------|---------|--------|
| R19.2 | private openRoomEditor() @ RoomView.ts:128 | "RbRoomDetail.editOpen" | **TYPO** (openRoomEditor IS the genuine open-editor method; editOpen=word-order/name typo) | relabel f9b579c1 → openRoomEditor → RECOVER |
| R19.2.A | same f9b579c1 (refinement of R19.2) | "editOpen" | **TYPO** (same impl) | recovers with R19.2 relabel |
| R19.22.B | private openRoomEditor() @ :129 | "RbRoomDetail.scenarioLinkRender" | **OVER-CREDIT** (scenarioLinkRender impl parked on openRoomEditor — different method than the scenario-link behavior) | STAYS dropped (relabel = gaming) — needs its OWN method |
| R19.33 | private render() @ rb-detail-drawer.ts:90 | "RbDetailDrawer.stickyClose" | **BORDERLINE→over-credit** (stickyClose has no named method; inline in render → not champagne per named-method rule) | architect: extract or accept functionalDone |
| R19.59 | setVisibility() @ Room.ts:142 | "Room.visibilityCheck" | **OVER-CREDIT** (label visibilityCheck, heads setVisibility, req=rooms-load-from-disk — triple mismatch; mis-wired) | STAYS dropped — verify chain wiring |
| R19.62 | file-header @ drop-dispatcher.ts:2 | "DropDispatcher.urlDrop" | **OVER-CREDIT** (file-header marker, heads no method) | STAYS dropped — needs marker in real method |
| R19.75 | export function renderContentPreview() @ content-preview.ts:6 | "ContentPreviewer.authToken" | **BORDERLINE** (authToken behavior lives in renderContentPreview? or own method?) | req-text/architect judgment |
| R19.81 | export function renderContentPreview() @ :7 | "iframe pinch-zoom" | **BORDERLINE** (pinch-zoom in renderContentPreview? descriptive label, not method) | req-text/architect judgment |

## Settled honest = 18/204 excl 47. Recovery path (NOT blanket):
- CLEAR TYPO → recover: R19.2 + R19.2.A (relabel f9b579c1 → "openRoomEditor"). → +2 → 20.
- CLEAR OVER-CREDIT → stay dropped: R19.22.B, R19.59, R19.62 (different method / file-header / mis-wired — relabel-to-pass would be gaming).
- BORDERLINE (architect/req-text): R19.33, R19.75, R19.81 — behavior-lives-in-headed-method vs needs-own-method; decide each (extract→champagne, or accept functionalDone).
## FINAL honest range: 18 now → 20 (the 2 genuine typos) → borderlines TBD. NOT 26 — the loophole was hiding 3-6 genuine over-credits.
