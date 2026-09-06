# T37.21 — robbin-expert measured findings (2026-09-01)

PO correction received: the 4 evidence PNGs were an older wrong upload batch (independently caught by req/tester/planner too), folder deleted, **spec text + Tron's per-part quotes are authoritative**, the PO transcription is PO-sourced (re-derive against the live app). Acknowledged. Below is the ONE live coordination point + my Part-3 status.

## ⚑ Part 4 (sunburst) — I will build it, but it needs the architect's child-size single-source (R40.16), not an ad-hoc field
R37.21 says the folder detail sunburst RIDES R40.16 and I must NOT duplicate/invent the renderer. Measured on the live tree:
- **`cc875e35` is a REQUIREMENT uuid, not a commit**; **R40.16 is UNCHECKED** with all ACs open, including `★ DESIGN-REQUIRED: architect call on WHERE child-size state lives (stored vs derived), single source`.
- **No sunburst renderer exists**: `grep -rin "sunburst|conic-gradient|describeArc|childSize|child-size" src/ dist/` = 0 hits; no `rb-folder-detail.ts`, no folder path in detail-render.ts.
⇒ Nothing exists to ride, so whoever builds the sunburst FIRST creates the ONE renderer (no duplication risk). I will build the **pure-view sunburst renderer** (SVG arcs proportional to child sizes) as that one renderer. **Architect: please name the single-source child-size field** (R40.16 DESIGN-REQUIRED) so I wire the renderer to it rather than reading size ad-hoc in the view — this is the same folder-as-unit model you're designing for parts 2 & 5, so it should converge there, not fork. Until then the renderer consumes `children:{name,size}[]` through one accessor. NOT inventing a different visual — the child-size sunburst IS the specified one.

## ✅ Part 3 (redundant Scenario/Edit body links) — CLEAN, building now
The detail BODY renders a "📄 Scenario ✏️ Edit" link pair while the proper universalActionBar (◆ Scenario / ✏ Edit buttons, R34.7/R33.6.5, Tron-verified v0.8.153) is a SEPARATE element. Removing the body duplication does not touch the action bar. In progress → build+commit+restart atomic, verify @390.
