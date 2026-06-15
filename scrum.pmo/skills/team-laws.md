# Team Operating Laws — Tron-mandated, marathon-proven, permanent

*Distilled from PO learnings #98-107 + auto-memory + agent learnings. Each law maps to
the skill(s) that enforce it. Laws are HARD GATES — violation = stop + fix, never ship past.*

## L1. DATA ON DISK = ONLY TRUTH (#103)
Only persisted disk data (scenario/index/*.scenario.json) is authoritative.
Nothing in-memory, computed-on-the-fly, markdown-scanned, or transient.
- discover → PERSIST (write to disk before it counts)
- verify = read disk (grep the file), not commit-claims or in-memory state
- **Skills:** realtime-traceability.md (endpoint reads disk per-request), po-chain-follow-up.md
  (scorer reads units from disk), chain-wire-impl-node.md (creates unit on disk)

## L2. MARKDOWN IS A VIEW (#100)
Scenario UNITS are source. .md files are GENERATED views — derived, never authored-as-source.
Never scan markdown back as source. Build/serve everything FROM units.
- **Skills:** realtime-traceability.md (chain = units, not task files), scenario.md (unit CRUD),
  how-to-write-skills.md (skill = class method, docs generated)

## L3. GIT = BACKUP, NO TAR (#104)
Git is the backup. Tar/manual snapshots are hallucinations. Destructive-op recipe:
commit clean → do the change → commit → rollback = git revert.
- **Skills:** ship-versionBump.md, ship-staticShell.md, audit.md (all commit-gated)

## L4. COMMUNICATE TOP-DOWN VIA SCENARIO CONTENT (#105, #99)
PO direction = content written INTO the unit hierarchy, read top-down by agents.
otmux = ≤1-line IOR pointer. NEVER multi-line diagnoses/specs/rulings via chat.
- **Skills:** quote-capture.md (Tron literal → unit), task-propose.md (task → unit),
  realtime-traceability.md (chain authored as units), planner-current-sprint-driving.md
  (setChain/focus writes to singleton unit on disk)

## L5. TEAM PROVES, NEVER WAIT TRON (#101)
Never ask Tron 'is it fixed?' The team PROVES correctness (det-3x, source-verify,
canonical, goal-present on the ACTUAL data). Tron redirects when we're wrong.
- **Skills:** po-chain-follow-up.md (det-3x canonical), verify-liveRepro.md,
  verify-7hopGate.md, audit.md (ci:gates)

## L6. GATE THE VISIBLE GOAL, NOT PROXY (#107)
gate-proven (test passes) ≠ chain RENDERS. Gate the USER-VISIBLE goal (does the chain
render in the drawer?), not an internal proxy (count on disk). Tron's screenshot
catches what the proxy gate misses.
- **Skills:** realtime-traceability.md (step 6 = verify on /trace), verify-liveRepro.md,
  verify-7hopGate.md

## L7. SOURCE-VERIFY + DET-3x + DISK-GREP (#93, #94, #95)
Source-verify from code/disk, never relay claims. det-3x = 3 identical runs +
agrees canonical + manual check on named case. A persistence claim must be
grep-provable on disk at time of claim.
- **Skills:** po-chain-follow-up.md (det-3x gate), chain.md (lintMarkers),
  audit.md (strict-marker-audit)

## L8. WIP = TRON'S PRIORITY, NOT LOWEST-OPEN (#106)
Next WIP = whatever Tron is focused on. Lowest-open is fallback only when
Tron hasn't signalled. gate-proven + QA ≠ Tron-done if a visible gap remains.
- **Skills:** planner-current-sprint-driving.md (focus verb), realtime-traceability.md
  (auto-follow tracks the focused task)

## L9. SWITCH ONLY WHEN TEST-GATE-PROVEN + PER-AGENT SELF-MARK HOPS (#102)
setFocus BLOCKED unless test = gate-proven. Each agent marks THEIR hop in realtime
via `planner-drive.ts hop <hop> <status>`. WIP=1 = proven-or-stay. --force = escape hatch.
- **Skills:** realtime-traceability.md (hopUpdate, isGateProven, setFocus gate),
  planner-current-sprint-driving.md (focus/hop/gate verbs)

## L10. SINGLE OWNER PER ARTIFACT TYPE
planner creates units, req captures Tron literal, architect chains UC→Class→Method,
expert implements (code + marker + wireImplNode), tester tests. Nobody crosses lanes.
- **Skills:** realtime-traceability.md (coordination matrix), how-to-write-skills.md
  (Object.verb = owner's class method)

## L11. NEVER /compact — REWIND (#53)
Agents own their context lifecycle. PO/SM never compact or /clear them.
Recovery = agent-trainer rewind. Context+learnings saved before 80%.
- **Skills:** (meta — applies to all agent boot files, not a specific skill)

## L12. IDEMPOTENT GENERATORS
Generated views (.md, symlinks, planning docs) must be re-runnable without drift.
Template change → re-generate all → commit. Stale views = Tron sees old rendering.
- **Skills:** scenario.md (regenerate-views), how-to-write-skills.md (emitOosh/emitDocs idempotent)

## L13. RELEASE = VERSION + CACHE_NAME + GIT TAG (#108)
A release requires ALL THREE: package.json version bump + sw.js CACHE_NAME stamp +
monotonic `git tag v<version>` at the impl commit. 'Version bumped' ≠ released
without the tag. Tag at release time, never batch/drift. Release gate verifies
all 3 present before a task counts as released.
- **Skills:** ship-versionBump.md (release recipe + gate + drift backfill),
  ship-staticShell.md (STATIC_SHELL in same commit), audit.md (release-verify gate)
