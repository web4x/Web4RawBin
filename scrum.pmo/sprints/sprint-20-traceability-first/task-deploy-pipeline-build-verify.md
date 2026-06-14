[Back to Sprint 20 Planning](./planning.md)

# T-INFRA: Deploy pipeline MUST build + verify-in-dist atomically (BUILD-NOT-RUN root fix)

[task:uuid:d3919e7a-6b2c-4f08-9a31-2e5c4d8b7011]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only.

## Traceability
- up
  - [Sprint 20 Planning](./planning.md)
  - Root-cause directive (PO/architect 2026-06-14): BUG5 saga meta-root = BUILD-NOT-RUN (5 source fixes never reached the deployed bundle; bundle stayed stale). Team learning #95.
- down
  - None (atomic infra task)

## Context
The BUG5 saga's meta-root was NOT a code bug — it was **BUILD-NOT-RUN**: source fixes were committed but the deploy never rebuilt, so the served `dist/` bundle stayed stale and the fixes never shipped. Architect confirmed the bundle was stale across 5 fix attempts. "Source change without rebuild = fix never ships" must be made structurally impossible.

## Task Description
Create a single atomic deploy script (e.g. `scripts/deploy.mjs` or `npm run deploy`) that the deploy process MUST use — no manual restart-without-build path. It performs, in order, failing loudly on any step:
1. **Build** — `npm run build` (source → `dist/` content-hashed bundle).
2. **Bump** — `package.json` version + `sw.js` CACHE_NAME (so PWA update detection fires).
3. **Verify-in-dist** — grep the built `dist/` for a caller-supplied proof-string (the specific change being shipped) AND confirm the new content-hash differs from the prior bundle. Abort if the change is NOT in dist.
4. **Tag** — `git tag v<new-version>` the release.
5. **Restart** — only after 1-4 pass.

Idempotent + verbose. Refuse to deploy a stale bundle.

## Acceptance Criteria
- [ ] AC1 — One command builds + bumps (version + sw.js) + tags + restarts atomically
- [ ] AC2 — Verify-in-dist gate: deploy ABORTS if the proof-string is absent from the built bundle OR the content-hash is unchanged (stale-bundle guard)
- [ ] AC3 — A source-change-without-rebuild can no longer ship a stale bundle (the failure mode that caused BUG5)
- [ ] AC4 — sw.js CACHE_NAME bumped every deploy (PWA update fires)
- [ ] AC5 — git tag present per release; `/api/health` reflects the new version
- [ ] `npm run build` succeeds; no regression

## Test Scenarios
| Test | Action | Expected |
|------|--------|----------|
| TS1 | deploy with a known source change + proof-string | dist contains it, version+tag+sw.js bumped, restart |
| TS2 | deploy WITHOUT rebuilding (simulate stale dist) | ABORTS at verify-in-dist (stale-bundle guard fires) |
| TS3 | deploy with unchanged content-hash | ABORTS (no-op guard) |

## Dependencies
- **Requires:** None (infra)
- **Enables:** every future fix actually reaches the device; ends the BUILD-NOT-RUN class of incident

## Definition of Done
- [ ] All AC met; the stale-bundle failure mode is structurally prevented
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-14: Created by planner per PO directive (BUG5 meta-root BUILD-NOT-RUN, learning #95). Awaiting refinement + impl.

## Subtasks
None (atomic infra task).

---

*Sprint 20 — Traceability-First / Infra*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: HIGH (process-integrity — prevents the BUILD-NOT-RUN incident class)*
