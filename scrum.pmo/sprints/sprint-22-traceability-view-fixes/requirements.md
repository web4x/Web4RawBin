[Back to Planning](./planning.md)

# Sprint 22 — Traceability View Fixes — Requirements

**Source:** Tron directive (screenshot) 2026-06-29, via robbin-po.
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md) — 6-step chain: Requirement → UseCase → Class → Method → Implementation → Test.

---

## Requirements

- [ ] **R22.1 — Task detail: one chain section + Forward Links to MD task file**
  [requirement:uuid:661836fd-2db8-4863-8556-0d698c897cd5]
  > TRON (screenshot directive): "Task detail view has two issues: (1) 'Traceability Chain: No chain' appears as a FALSE DUPLICATE above the real chain (which renders correctly below it) — the empty first section must be removed or merged, one chain section only. (2) Forward Links shows raw useCases reference — should instead show a LINK TO THE MD TASK FILE (the sprint task documentation file path)."
  The Task detail view must render exactly ONE Traceability Chain section — removing the false-duplicate empty "Traceability Chain: No chain" section that currently appears above the correctly-rendered chain — and its Forward Links section must show a link to the MD task documentation file (the sprint task file path) instead of the raw useCases reference.
  **Acceptance criteria:**
  - [ ] **(issue 1 — dedupe chain)** The Task detail view shows only ONE Traceability Chain section
  - [ ] The empty/false "Traceability Chain: No chain" section that rendered ABOVE the real chain is gone (removed or merged into the single section)
  - [ ] The remaining single chain section still renders the real chain correctly (no regression)
  - [ ] **(issue 2 — Forward Links → MD)** The Forward Links section links to the MD task documentation file (the sprint task file path), not the raw `useCases` IOR reference
  - [ ] The link resolves/opens the task's `.md` file in the sprint directory
  - [ ] Verified live (headless) against the running app — the Task detail view matches the corrected layout
  → [UC-VF.1: taskDetail.renderSingleChainAndMdLink](./planning.md#uc-vf1) `[uc:uuid:4d0e454a-124a-43f7-8487-28aa61c12fbf]` *(placeholder)*

- [ ] **R22.2 — Drawer pan/zoom: full mouse parity (touch-first)**
  [requirement:uuid:b7000fa1-01d6-4757-a211-b24051eea7eb]
  > TRON: "the drawer works well on touch and it shall be touch first, but it shall also work the same way with mouse."
  The drawer pan/zoom is touch-first (touch is the primary design surface) but MUST work identically with a mouse: mouse-drag pans (mirrors 1-finger pan), scroll-wheel zooms (mirrors pinch-zoom), and double-click resets/toggles (mirrors double-tap). Mouse mirrors the touch behaviour exactly.
  **Acceptance criteria:**
  - [ ] Touch remains the primary surface: 1-finger drag pans, pinch zooms, double-tap resets/toggles (unchanged)
  - [ ] Mouse-drag pans the drawer content, identical to 1-finger pan
  - [ ] Scroll-wheel zooms the drawer content, identical to pinch-zoom (zoom toward the pointer)
  - [ ] Double-click resets/toggles the zoom, identical to double-tap
  - [ ] Behaviour is identical across input types (no mouse-only or touch-only divergence in pan/zoom/reset)
  - [ ] Verified live (headless) on both a touch surface and a mouse/pointer surface
  → [UC-VF.2: drawer.panZoomMouseParity](./planning.md#uc-vf2) `[uc:uuid:ada54a0e-0eef-4f16-a393-8c30c6bdd06d]` *(placeholder)*

- [ ] **R22.3 — Chain nodes link to their source artifacts (per type)**
  [requirement:uuid:2c1fd942-a6f1-414c-976f-ea7af7008201]
  > TRON: "the implementation should be a link to the source code of the Profile class. The Class Profile a link to the puml diagram and its svg. Same as the method should be a link to the source code of the method."
  Each node in the chain detail view MUST be a clickable link to its real source artifact, by type: a Class node links to its PlantUML .puml diagram AND the rendered .svg; a Method node links to the source .ts file:line of the method; an Implementation node links to the source .ts file:line of the impl. This is the live-bug re-raise of the designed-ahead source-link specs R20.23-R20.27.
  **Acceptance criteria:**
  - [ ] A Class chain node links to its .puml diagram AND its rendered .svg
  - [ ] A Method chain node links to the source .ts file:line of the method
  - [ ] An Implementation chain node links to the source .ts file:line of the impl
  - [ ] Every chain detail-view node renders as a clickable link to its real artifact (not raw text/IOR)
  - [ ] Links resolve to the actual file:line / diagram (open in the browser)
  - [ ] Verified live (headless) against the running app
  → [UC-VF.3: chainNode.linkToSource](./planning.md#uc-vf3) `[uc:uuid:1371923a-06f2-4c84-a1ca-75a98ef77f51]` *(placeholder)*

- [ ] **R22.4 — PNG files clickable + open in preview (same as SVG)**
  [requirement:uuid:c13ee707-0099-45ef-9d4d-f5541d21b2bd]
  > TRON: "in the /md/ file browser, PNG files should be clickable and open in a preview — same behavior as SVGs currently do." (URL: https://prod.wo-da.de:4444/md/test/visual/?highlight=r211-vcard-persist-gate.mjs — the PNGs listed there are not clickable.)
  In the /md/ file browser, PNG files MUST be clickable and open in the same preview/viewer that SVG files currently open in — the PNGs are not clickable today.
  **Acceptance criteria:**
  - [ ] PNG entries in the /md/ file browser render as clickable links (like SVG entries)
  - [ ] Clicking a PNG opens it in the SAME preview/viewer that SVG files use
  - [ ] SVG behaviour is unchanged (no regression)
  - [ ] Verified live (headless) on the /md/ test/visual listing (e.g. r211-vcard-persist-gate.mjs highlight page) — the listed PNGs open in preview
  → [UC-VF.4: mdBrowser.pngOpensPreview](./planning.md#uc-vf4) `[uc:uuid:3ab76d13-2ef6-4ca2-b597-7692cb2a30f6]` *(placeholder)*

---

## Traceability Matrix

| Req | Concise name | Requirement UUID | UC placeholder UUID |
|-----|--------------|------------------|---------------------|
| R22.1 | Task detail: one chain + MD-file links | 661836fd-2db8-4863-8556-0d698c897cd5 | 4d0e454a-124a-43f7-8487-28aa61c12fbf |
| R22.2 | Drawer pan/zoom full mouse parity | b7000fa1-01d6-4757-a211-b24051eea7eb | ada54a0e-0eef-4f16-a393-8c30c6bdd06d |
| R22.3 | Chain nodes link to source artifacts | 2c1fd942-a6f1-414c-976f-ea7af7008201 | 1371923a-06f2-4c84-a1ca-75a98ef77f51 |
| R22.4 | PNG clickable + opens preview (like SVG) | c13ee707-0099-45ef-9d4d-f5541d21b2bd | 3ab76d13-2ef6-4ca2-b597-7692cb2a30f6 |

**R-I note (for planner/PO):** R22.1 bundles two distinct atomic behaviours — (a) dedupe the chain section, (b) repoint Forward Links to the MD file. Per the atomic-one-sentence rule these could split into R22.1 + R22.2; captured as one unit per the PO directive ("R22.1"). Flag if a split is wanted for independent tasking.

---

*Captured by robbin-req 2026-06-29. Verbatim Tron (screenshot) directive is authoritative; concise name is for display.*
