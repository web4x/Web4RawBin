# Branch Reconcile — DESIGN (architect, 2026-08-31, Tron-ruled)

Root of 3 incidents today: prod serves `hotfix/t40.1-checklist-band`; work landed on BOTH branches. (1) 47 tasks invisible (minted main, prod serves hotfix); (2) empty CurrentSprint P0 (14 units on main, never carried); (3) R37.29 double-minted on both. Three occurrences of one cause = structural defect. Design-only; **execute AFTER the v0.8.150 server-perf deploy lands** (no branch op under an in-flight deploy). Expert executes on the R40.31 isolated scratch, tester gates there, nothing touches prod until green.

## Measured divergence (mine, not relayed)
- **127** commits on hotfix (HEAD) not on main; **57** on main not on hotfix (PO's 126/57 + 1 new).
- ★ **The 57 main-only commits touch 0 src code** — 203 scenario-DATA touches, 87 planning, 2 scripts (`second-store-audit.mjs`, `ac-untasked-audit.mjs`), 0 `src/`, 0 dist. **Main has NO code hotfix lacks.** Hotfix has all 127 code+deploy commits (RCE closure, Phase-A, P0 fixes, v0.8.140–150 deploys) AND prod serves it.
- The 57 are **100% real work, 0 experiments**: R37.25 truth-decay family, R37.26–29 chains + bidirectional wires, S37 R37.13-19 backfill, **S40 47-task STATUS-STAGING backfill (the "47 invisible")**, R37.29 referential-integrity (double-minted), 2 audit scripts.

## (a) DIRECTION — hotfix is the trunk; carry main's 57 INTO it. Old main line = frozen.
**Why:** hotfix is CODE-authoritative (main contributes 0 code) AND prod already serves it — so making it the trunk means **no prod code ref-switch, no build-break risk**. The only thing main has that hotfix lacks is DATA+planning, which is ADDITIVE and carries with no code-merge. The reverse (merge hotfix→main, switch prod ref to main) would force prod onto a branch that must first absorb 127 commits + a risky ref switch — strictly worse. **The LOSER = the current divergent `main` line; future work must NOT continue on it.** End state: the reconciled branch is the single trunk (`main` reset/fast-forwarded to the reconciled HEAD, or hotfix renamed to `main`), prod keeps serving the same code it serves today.

## (b) The 57 main-only — per-class ruling (never bulk-drop; all salvage)
| Class | Content | Ruling |
|---|---|---|
| scenario DATA units | R37.25-29 chains, S37/S40 task backfills (incl the 47), family ACs, bidirectional `tasks[]` wires | **CARRY ALL** (additive; the exact units whose absence caused the P0s) |
| R37.29 double-mint | `8d2eeab1` on main == the hotfix R37.29 | **CARRY + DEDUP** — keep one (content-identical); the double-mint reconciles to a single unit |
| planning docs | backfill status-staging, orphan worklists, backlog records | **REGENERATE from units** after the data carry (boards are `GENERATED_HEADER` from units) OR carry; never hand-merge |
| 2 audit scripts | `second-store-audit.mjs`, `ac-untasked-audit.mjs` | **CARRY** (standalone `scripts/`, not `src/` → no build-break) |
0 experiments, 0 drops. Every main-only commit is this session's design/req/planner output stranded by the split.

## (c) DATA vs CODE — treated separately + integrity check after
- **CODE:** hotfix authoritative; main-only src = 0 (measured) → **no code merge, no build-break**. Verify by a build on the scratch post-carry (trivially green — no code changed).
- **DATA:** carry the 57 commits' scenario units into the reconciled branch (path-limited data carry / cherry-pick, the proven pattern — same op as the P0 carry `f57d8188e`). **INTEGRITY CHECK after = R37.29 referential-integrity** (every `tasks[]`/`ownerIor`/chain ref resolves in the committed tree, report-ALL) + `check:sprint-md`/board regen clean. A data unit missing → fail-closed pin (today's P0); a src missing → build break (N/A here). This is why data and code reconcile differently: data needs referential-completeness verification, code needs a build.

## (d) Prod safety — scratch first (Phase-A pattern)
Expert executes the reconcile on the **R40.31 isolated scratch** (worktree/clone, non-4444, teardown): carry main's 57 → build (green) → R37.29 referential-integrity (0 dangling) → board regen clean → serve the scratch + tester gates (CurrentSprint pin resolves, the 47 tasks visible, /trace + /model render). **NOTHING touches prod until that is green.** Then establish the reconciled branch as trunk + prod serves it (it's the same code prod serves now — the flip is making `main` == the reconciled HEAD and freezing the old divergent line, not a code deploy).

## (e) END STATE — recurrence impossible (ONE guard, coordinated with R37.29)
1. **ONE authoritative trunk** (the reconciled branch); the old divergent `main` line is **deleted/frozen**; future work only on the trunk. Short-lived branches only — merge to trunk before work is "real" (a unit's existence is not "real" until on the served trunk).
2. **Served == trunk invariant:** extend the existing R31.7 served==committed==HEAD check to assert the SERVED branch IS the canonical trunk (a served ref that is not the trunk = RED). This makes "prod serves a divergent branch" impossible-to-not-notice.
3. **DO NOT build a second "unit-on-a-non-served-branch" scanner** (you cannot reliably scan branches you don't know exist, and it would overlap R37.29). Instead: **R37.29 referential-integrity runs in ci:gates ON THE TRUNK** — a unit whose refs don't resolve in the trunk is exactly the signature of an uncarried cross-branch unit, caught at the read/CI side. R37.29 (intra-tree completeness) + the served==trunk invariant (no divergent served branch) + single-trunk discipline (no long-lived parallel branch) = the three-part structural cure, no overlapping guard. Coordinate with req: R37.29 stays intra-tree referential-integrity; the served==trunk check is a small addition to R31.7's INV-V family, NOT a new R37.29-overlapping req.

## Sequencing
Design (now) → v0.8.150 server-perf deploy LANDS → expert reconciles on the R40.31 scratch (carry 57 → build → R37.29 verify → board regen → tester gates the served surface) → establish trunk + freeze old main → served==trunk gate wired. I backstop each step (the carry is referentially complete, the build is green, the end state has one trunk + the gate). No branch op starts under the in-flight deploy.
