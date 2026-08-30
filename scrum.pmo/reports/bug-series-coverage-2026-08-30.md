# BUG-series structural coverage (planner, 2026-08-30)

Structural = a Task's `coveredRequirements` POINTS at the BUG uuid, or the BUG's own `tasks[]` is non-empty. NEVER name-match. Script: scratchpad/bug-coverage.mjs.

**19 BUG-series units · 6 COVERED · 13 UNCOVERED.**
Validated vs Tron/PO examples: BUG18 uncovered+tronDone ✓ · BUG13 covered ✓.

## COVERED (6) — have a real task pointer
BUG1, BUG2, BUG13(Resolved), BUG15(Resolved,tronTraced), BUG16(Resolved,tronTraced), BUG17(Resolved,tronTraced)

## UNCOVERED (13) — NO covering task
Two classes:

### (a) FIXED but untracked — traceability hole (Tron marked these himself)
- **BUG18** `949ee3c2` — status **Done**, tronDone+tronTraced — the in-room file→detail regression Tron asked about. HE closed it; zero task ever existed.
- **BUG14** `1b216edc` — status Resolved.

### (b) UNTRIAGED — status (none), likely still-open = real engineering backlog
- BUG3 `8c1f37d1` · BUG4 `76a2e5a4` · BUG5 `0ec303b0` · BUG6 `90a0af77` · BUG7 `2e6d691b` · BUG8 `12cf7bb5` · BUG9 `6da84135` · BUG10 `da4a27bc` · BUG11 `871c5cf9` · BUG12 `d2389829`
- **BUG-KEYBAR-SILENT-EMPTY** `34b0b233` — named bug, status (none).

## Minting stance (Tron's 2nd critique: '47 are just copies from requirements')
Mint REAL tasks — reproduction · surface/component · fix approach · verifiable acceptance step — an engineer could pick up. Fewer/better > row-per-req restatement. req = single-minter; this measurement sizes the gap first.
