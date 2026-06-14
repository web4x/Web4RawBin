# T176: Headless test-infra unblocker — page JS must execute over the isolated test server (R-O)
[task:uuid:c9ebef46-a418-40f3-9a0c-93db265a29cf]

## Traceability

- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) — R-O verbatim (req-eng captured in `7bc51c5b`)
  - **R-O** `[requirement:uuid:dc7aa9c8-165b-46ab-8539-8444a7048563]` — test server must serve page JS so headless Playwright executes it; browser-behavior ACs become headlessly verifiable (planner pre-seed; req-eng `7bc51c5b` anchors verbatim — no formal scenario unit yet)
- follows
  - T100 (isolated test server on port 4445 with self-signed cert — the surface this fix lives on)
- unblocks
  - T174 R-M3d/M3e tester verification headlessly
  - T175 R-N1/N2 tester verification headlessly
  - ALL future browser-behavior tasks (DOM state, click interactions, lazy-load cascading)
- down
  - None (atomic task — single approach picked by architect, single fix)

## Acceptance Criteria

**R-O (headless module-load unblocker):**
- [ ] AC1 — Architect-picked approach is documented in this file with rationale (parity vs simplicity)
- [ ] AC2 — Isolated test server (T100, port 4445) — or Playwright launch config — modified per the picked approach
- [ ] AC3 — Headless Playwright loads a page with `<script type="module">` from the test server; the module's top-level code runs (e.g. a known global is set, a known DOM mutation occurs)
- [ ] AC4 — Tester reports a previously-deferred browser-behavior AC (T174 R-M3d/M3e OR T175 R-N1/N2) is NOW verifiable headlessly — runs and produces a definitive PASS/FAIL (not "deferred to Tron device")
- [ ] AC5 — No regression on the prod scheme/cert path (test-only change; production HTTPS unchanged)
- [ ] AC6 — Existing T100 test specs still pass with the new scheme/cert config (no break of non-module specs)

**Ship rules:**
- [ ] AC7 — Rule-pair (a)+(b) — architect declares: likely **EXEMPT** (test-infra only, no user-facing surface change). If a cert is committed (option 1), exempt holds; if launch flag is in playwright.config (option 3), exempt holds; if test server URL scheme changes (option 2), still exempt — no PWA/app behavior change. (Per learning #24.)
- [ ] AC8 — `npm run build` clean; `npm test` clean; new headless module-load proof spec passes

## QA Audit & User Feedback

- 2026-06-03: req-eng captured R-O verbatim in `compound-requirement-source-2.md` — headless Playwright + self-signed SSL + ES modules silently refuse to load, deferring all browser-behavior ACs to Tron's physical device.
- 2026-06-03: PO directs T176 stand-up — "fix the isolated test server cert/scheme so module JS executes in headless. This unblocks ALL future browser-behavior verification." Owner: architect (approach) + expert (impl) + tester (prove /scenario JS runs headless). 4-role.
- 2026-06-03: Expert `45a733d2` ships proof test: headless Chromium + `ignoreHTTPSErrors:true` ALREADY exec's ES `type="module"` scripts over self-signed HTTPS. /scenario: 2 module scripts execute, body rendered, 0 errors. /trace: rb-trace-tree element created, 24K body text. 834/834 vitest pass. **R-O root cause was incorrect** — no systemic cert-blocks-modules issue; existing config already handles it.
- 2026-06-03: Architect confirms convergence (per PO).
- 2026-06-03: **PO closure — RESOLVED NOT-A-BUG.** No fix shipped, no fix needed. T174 R-M3d/M3e + T175 R-N2 JS-behavioral verification now UNBLOCKED (tester running per PO). QA Review + Done remain unchecked per the standing rule (Tron's gate only) — Resolution recorded in header + this timeline.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 32 — R-O (test-infra unblocker)
**Follows:** T100 (isolated test server)
**Unblocks:** T174 R-M3d/M3e headless verify · T175 R-N1/N2 headless verify · all future browser-behavior tasks
**Rule-pair scope:** (a)+(b) likely EXEMPT (test-infra only, no user surface — architect to confirm in refinement, per learning #24).

## Subtasks

None (atomic task — single architect-picked approach, single fix, single tester proof).
