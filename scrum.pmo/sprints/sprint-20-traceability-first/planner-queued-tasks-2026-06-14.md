# QUEUED tasks (Tron directive: strict-forward uninterrupted; do NOT drive now) — planner 2026-06-14

## QUEUE-1: /trace DETAIL BUG (collection + leaf detail render)
**Owner:** architect (diagnosing root cause) → expert fix. **Status:** QUEUED (after strict-forward work).
**Symptom (Tron):**
- Collection 'Files' node → drawer shows 'Loading / no children' (SHOULD show link.url child).
- Leaf 'link.url' node → EMPTY drawer (SHOULD show file detail).
- Room-level detail WORKS (so the drawer/render path is fine for room type; bug is Files-collection + link.url-leaf specific).
**Root cause + fix-plan (architect-diagnosed 2026-06-14; champagne UNAFFECTED — functional bugs, not chain gaps):**
- BUG1 collection 'Files'→no-children: collection node has a SYNTHETIC uuid (members-/files-<roomUuid>) — NOT a scenario unit → fetchDetailData 404s. FIX (expert): special-case type='collection' in renderDetailForRef — extract parent-room-uuid → fetch /api/trace/children/<roomUuid> → render children as dv-links.
- BUG2 leaf 'link.url'→blank: tagMap file→rb-file-detail is UNREGISTERED/nonexistent → blank. FIX (expert): remove 'file' from tagMap (1-line → falls to working generic rb-detail-view). FOLLOW-UP: build a real rb-file-detail.
**Acceptance:** Files collection shows its link.url children; link.url leaf shows file detail (generic for now); room-level unchanged.

## QUEUE-2: 2-orphan-prune cleanup (aggregate hygiene)
**Owner:** expert. **Status:** QUEUED. **NOT data-loss — DATA-SAFE already sealed (all 11 reals present, 0 lost).**
**What:** data/profiles.json has 2 STALE TEST orphan entries (no dir): E2E-webkit (4e5655bf) + test-merge (ae9a8a5e). Earlier '24/0' was transient/uncommitted; fresh read of data/profiles.json = 26 with the 2 orphans still present.
**Fix:** prune the 2 stale entries from data/profiles.json (written+saved to file) → aggregate==profiled-dirs(23), orphans=0. Then planner re-confirms clean-seal.
**Also (separate, later):** SystemTester x8 → consolidate to canonical ce981242 (conservative-keep now).
