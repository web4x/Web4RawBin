<!-- SM-authored first-pass inventory (2026-08-09, TRON campaign 'finish S30++ -> bring to QA-Review'). Read-only measurement from generated boards + known facts. NOT authoritative per-task: fresh fleet MUST verify chain-state against scenario units at dispatch (boards lag recent credits). Done stays TRON's act via R40.10 approve-by-Tron. -->

# Campaign: S30++ unfinished tasks -> QA-Review

**Goal (Tron):** every unfinished task from Sprint 30 onward driven to **QA-Review** (chain-complete-to-Test + gated). **Done stays Tron's act** (R40.10 approve records approvedBy/approvedAt + flips Done-gate; decline mints a ChangeRequest). Tron approves in one pass from the tasks.

**Classification per task — what it still needs to reach QA-Review:** (a) BUILD · (b) MARKER placement / strict-AST flip · (c) GATE run · (d) TWO-KEY · (e) BLOCKED ON TRON'S DEVICE (split the AC, never headless-green it).

## ITEM ZERO (before the batch lands) — verify the payoff mechanism
- **R40.10 approve/decline @390 REAL-DEVICE gate** — tester FIRST, ahead of all else. Built+live v0.8.76 but NEVER device-gated (server-verified only). Prove on real device (pixel, not DOM): (a) approve VISIBLE+FIREABLE on a QA-Review task, (b) records approvedBy/approvedAt + Done-gate flips, (c) DECLINE mints a real ChangeRequest on the board, (d) non-owner 403, (e) evidence-precondition holds (approve CANNOT manufacture Done on a non-chain-complete task). **Rationale: the whole campaign terminates in Tron tapping approve on his phone; verify it before mass-producing work that depends on it.** Class: (c) gate + (e) device.

## S37 — CLOSE FIRST (consistency-by-construction; S40 jumped a still-open sprint)
Board shows C1-C7 all [ ] but tonight advanced some — VERIFY each vs units.
- **C2** (board generated view + reconcile-all): generated-view half DONE tonight (expert R37.6 write; stale-S20 overview fixed, --check flipped to pass). Remaining = one-time reconcile-all MIGRATION (dry-run+counts+reversible). Needs: (a) build(migration) + (c) gate + (d) two-key.
- **C5** (dual-status reconcile — one truth, no Done-flip): OPEN. Needs (a)+(c)+(d).
- **C1** (pin computed from files): VERIFY vs units — needs (a)/(c)+(d).
- **C3** (fail-loud guard pin==board==files, drift-injection BITE): needs (a)+(c gate w/ bite)+(d).
- **C4** (objects self-heal validate on init/read): needs (a)+(c)+(d).
- **C6** (sprints.overview.md generated view): expert's R37.6 --write landed the generation; VERIFY marker/two-key -> likely (b)+(c)+(d).
- **C7** (legacy hand-authored boards MIGRATED, units-completeness-proven zero-loss): needs (a migration)+(c)+(d).

## S40 — BOARD IS STALE (recent credits not reflected) — VERIFY EACH vs units
- **T40.10** (Tron QA verdict approve/decline): BUILT+live v0.8.76 -> needs ITEM-ZERO device-gate (e)+(c); then two-key.
- **T40.12** (file preview audio-player regression fix): SHIPPED 0.8.76 + @390 pixel-verified (tester PASS). Board stale. VERIFY credit/two-key -> likely just board-flip (b/d).
- **T40.11 carve-out** (fail-loud unresolved:<ior>): SHIPPED 0.8.76 (2cf8f9866). Carve-out credit c7a2d5e8 DEFERRED for R30.11 ride-vs-mint architect ruling -> (a ruling)+(b)+(d).
- **T40.1** (Open Claude RC per-pane deep link): at QA-Review awaiting Tron device-QA -> (e) device (approvable from task).
- **T40.3** (suppress iOS keyboard + controller): at QA-Review; AC split -> automatable ACs (c gate) + 1 device-only (e).
- **T40.4** (sprint labels show number): at QA-Review awaiting device -> (e).
- **T40.2** (WODA.prod UML deployment-node + 4 refs): req captured 4 measured refs; ref-units mint at build-go -> (a build)+(b)+(c)+(d).
- **T40.5** (extra buttons de-duped onto shared action bar): needs (a)+(c)+(d).
- **T40.7** (back=history.back + path-label nav): needs (a)+(c)+(d).
- **T40.8** ('Files' shows real on-disk path, fail-closed): needs (a)+(c)+(d).
- **T40.9** ('Preview'=trace chain+drawer reuse): needs (a)+(c)+(d).
- **T40.6** (deploymentRefs -> typed OOP model): flip-trigger Impl e009ace7 buildTypedModel COUPLED to deep R40.11 -> advances when expert builds+marks R40.11. (a via R40.11)+(b).
- **T40.11** (deploymentRefs scenario-first + default views; fix permanent-Loading drawer): the DEEP migration -- consolidate 2 depref emitters->1, kill depref:synthetic, generic type-driven view, fail-loud, gated dry-run+count INV-T==0. Parked; expert fresh BEFORE this (crypto/board build). (a)+(b)+(c)+(d).
- **R40.13-R40.18** (captured backlog, DESIGN-REQUIRED): web4ID R40.14 already DESIGNED (architect); R40.17 assign-as-current (skill-expert resolver semantics); R40.18 auto-progress-on-QA. Each: (a design->build)+(b)+(c)+(d).

## S30 — repo-manager + merge-toolbar backlog (17 not-Done; old, mostly never-built)
Verify each vs units; most are (a) BUILD + full chain. T30.9 (IntelliJ base-aware 3-way merge) · T30.14 (SW auto-update — visible deploys) · T30.35 (diff coloring + merge-action matrix) · T30.36 (diff-nav aids) · T30.37 (per-change resolved toggle) · T30.38 (merge save repo routing, no 404) · T30.39 (deep-link ?repo seeds both selectors) · T30.40 (center header actual branch) · T30.42 (add-repository option) · T30.43 (add repo by local path) · T30.44 (add repo by clone URL) · T30.45 (repo manage panel) · T30.46 (working-file left=latest) · T30.49 (delete dynamic repo) · T30.50 (merge toolbar optimization) · T30.51 (changes-focused folding) · T30.52 (toolbar re-layout). Several are visual/merge-editor = (e) device-split on the visual ACs.

## S31 / S32 — small tails
- **T31.1** (user-specific profile feature grants, owner-only): (a)+(b)+(c)+(d). NOTE ties to the new User-Admin + secretCode-security direction.
- **T31.6** (shared pan/zoom viewer — FUTURE/concept): NOT a deliverable (concept, no spec) — EXCLUDE unless Tron schedules.
- **T32.5** (drag itemView -> diagram view): (a)+(b)+(c)+(d).
- **T-R31.14** (deploy-hardening — scripted deploy + served!=committed monitor + pinned topology): S32 backlog; (a)+(c)+(d).

## Named debt (not sprint tasks, but on the path)
- pre-generator-views migration (~15 pre-gen views need header-guard) + 4 S19 needs-manual extras (from C2 reconcile).
- plaintext 4-digit secretCode on PROD unhashed — needs a real SECURITY requirement (hash+salt, rate-limit, no-log). Capture as a req.

## Exclusions / notes
- S33/S34/S35/S36 = COMPLETE (no not-Done tasks on board).
- T30.8/30.31/30.32 = unminted/backlog/superseded by design (not tasks).
- **Boards LAG recent credits** — this inventory is a first-pass; verify each task's chain-state (Test unit on disk + marker + gate result) against scenario units at dispatch. Do NOT headless-green a device-only AC — split it.
