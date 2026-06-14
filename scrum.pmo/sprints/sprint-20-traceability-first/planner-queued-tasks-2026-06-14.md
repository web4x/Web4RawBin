# QUEUED tasks (Tron directive: strict-forward uninterrupted; do NOT drive now) — planner 2026-06-14

## QUEUE-1: /trace DETAIL BUG (collection + leaf detail render)
**Owner:** architect (diagnosing root cause) → expert fix. **Status:** QUEUED (after strict-forward work).
**Symptom (Tron):**
- Collection 'Files' node → drawer shows 'Loading / no children' (SHOULD show link.url child).
- Leaf 'link.url' node → EMPTY drawer (SHOULD show file detail).
- Room-level detail WORKS (so the drawer/render path is fine for room type; bug is Files-collection + link.url-leaf specific).
**Root cause:** <architect to fill — likely the Files-collection children-resolver and the link.url leaf detail-view handler not registered/wired in the /trace router>.
**Acceptance:** Files collection shows its link.url children; link.url leaf shows file detail; room-level unchanged.

## QUEUE-2: 2-orphan-prune cleanup (aggregate hygiene)
**Owner:** expert. **Status:** QUEUED. **NOT data-loss — DATA-SAFE already sealed (all 11 reals present, 0 lost).**
**What:** data/profiles.json has 2 STALE TEST orphan entries (no dir): E2E-webkit (4e5655bf) + test-merge (ae9a8a5e). Earlier '24/0' was transient/uncommitted; fresh read of data/profiles.json = 26 with the 2 orphans still present.
**Fix:** prune the 2 stale entries from data/profiles.json (written+saved to file) → aggregate==profiled-dirs(23), orphans=0. Then planner re-confirms clean-seal.
**Also (separate, later):** SystemTester x8 → consolidate to canonical ce981242 (conservative-keep now).
