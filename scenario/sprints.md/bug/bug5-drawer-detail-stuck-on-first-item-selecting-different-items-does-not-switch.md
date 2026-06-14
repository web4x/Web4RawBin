### BUG5: Drawer detail stuck on first item — selecting different items does not switch content.

<details><summary>Tron directive</summary>

> BUG (v0.6.10 drawer consolidation): on /trace, selecting a DIFFERENT item does NOT update the drawer detail — it stays stuck on the first/room detail regardless of which item is selected. E.g. select link.url → drawer still shows DeFED.net Room; select Files(1) → still shows room. REQUIREMENT: drawer detail MUST switch to match the currently-selected item. Likely over-idempotent renderDetailForRef (b1dd1275) — the ref comparison thinks it's the same item and skips re-render.

</details>