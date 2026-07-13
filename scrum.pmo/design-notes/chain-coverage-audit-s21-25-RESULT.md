# Chain-Coverage Audit S21–S25 — RESULT (gap backlog, measure-first)
*Run by robbin-skill-expert (traceability owner), 2026-07-13, against criteria [chain-coverage-audit-s21-25-criteria.md](./chain-coverage-audit-s21-25-criteria.md) (architect 3548e2f4c).*

## ⚠ Method caveat (tsx-denied this session)
Canonical (E) tooling (`npm trace:audit --strict`, `Chain.scoreboard/lintMarkers`) is **tsx = DENIED**. I reimplemented the architect's 6-hop walk in **node** (reads scenario JSON units + source markers via grep). Faithful to A (per-hop present+resolvable), C (dangling/orphan/dup), D (funnel), F (backlog). **The ⭐ AST-attach check is APPROXIMATED as marker-PRESENCE** (uuid appears in a `[impl:uuid:]` in source) — it does NOT verify the marker sits on a name-matching decl. Exact strict-credit + AST-attach still need a one-shot tsx run (architect can derive-confirm any suspect by uuid-file). Units loaded: 4111. Impl markers in source: 424 · Test markers: 444.

## D. Per-sprint funnel (reqs → deepest hop reached)
| Sprint | Reqs | →UC | →Class | →Method | →Impl(present) | →Impl(marker) | →Test | designAhead |
|--------|------|-----|--------|---------|----------------|---------------|-------|-------------|
| S21 | 9 | 9 | 9 | 9 | 9 | 9 | **9** | 0 |
| S22 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 1 (expected) |
| S23 | 3 | 3 | 3 | 3 | 3 | 3 | **3** | 0 |
| S24 | 5 | 5 | 5 | 5 | 5 | 5 | **5** | 0 |
| S25 | 7 | 7 | 7 | 7 | 7 | 5 | 2 | 5 (expected) |

S21/S23/S24 = **fully credited to Test**. S22/S25 have the buckets below.

## F. GAP BACKLOG — GENUINE gaps only (designAhead / superseded / orphanByDesign EXCLUDED)
**Genuine, actionable (2 — expert):** non-designAhead, non-superseded Impls with NO source marker:
| Sprint | Req | Impl | Method (sourceFile) | gapType |
|--------|-----|------|---------------------|---------|
| S25 | `2066ba12` | `bd080edb` | `RoomView.importFromClipboard` (src/public/ts/RoomView.ts) | **marker-missing** |
| S25 | `24509e35` | `1bd129e0` | `detail-children.scenarioFileHref` (src/public/ts/trace/detail-children.ts) | **marker-missing** |
→ expert adds `[impl:uuid:]` on the named method (AST-attached). *(AST-attach unverified without tsx — likely genuinely absent since grep found 0.)*

**no-Test (4 — classify champagne-pending vs genuine, tester):**
| Sprint | Req | name | note |
|--------|-----|------|------|
| S22 | `2c1fd942` | Chain nodes link to their source | S22 is old — verify: genuine no-Test or champagne-pending? |
| S25 | `f8097d7c` | Unified WebItem scenario unit | known-expected (R25.x empty tests[] champagne) |
| S25 | `225b18a6` | Drawer interaction: grab-bar mouse-parity | known-expected champagne |
| S25 | `585b6b9c` | Room membership dedup by resolved identity | known-expected champagne |

## Expected buckets (NOT gaps — per criteria B/F)
- **designAhead Impls**: S22 ×1, S25 ×5 — present-by-design, awaiting build. Not defects.
- **Champagne-pending empty tests[]**: the 3 S25 no-Test above (architect known-expected).

## C. Integrity (repo-wide — surfaced by the axis, not all S21-25-scoped)
- **dangling forward-refs: 26** — 0 inside the S21-25 chains walked. Breakdown: **19 Test→Impl** (Tests referencing a MISSING Impl — the **superseded-impl fallout**: R30.6.1/6.3 impls retired, but `Test.implementations[]` not repointed. benign-vs-real per the supersede rule → cleanup = repoint or drop the back-ref); 4 Req→UC, 2 Req→Test, 1 Task→UC (worth a targeted look).
- **duplicate Class-by-name: 0** ✓ (by uuid-file).
- **orphan**: not fully computed (reachability walk pending) — deferred.

## Handoff (measure-first — audit does NOT fix)
→ **expert**: 2 marker-missing (bd080edb, 1bd129e0). → **tester**: classify/close the 4 no-Test (esp. S22 2c1fd942). → **planner/req**: 19 Test→Impl dangling = supersede-cleanup task (repoint Test.implementations[] off retired impls). → **architect**: derive-confirm any suspect by uuid-file; one-shot tsx would upgrade marker-presence → true AST-attach + strict-credit.
