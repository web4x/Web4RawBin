# Boot active-section CURRENCY guard + STATE-REMOVAL cure (architect design, 2026-08-20)

PO-dispatched. My boot-currency finding, scope-converged with PO (committed a7ac8892). Two layers: **interim currency guard** (catch rot while state-bearing boots exist) + **the cure: state-removal** (R113 — timeless rules + anchor pointer, ALL state in context.md). I DESIGN + RE-INSPECT; trainer PROPAGATES; req MINTS the AC — never the same agent.

## RE-INSPECTION (independent, git-HEAD truth = S40 / v0.8.123 == HEAD)
Measured every `session/agents/*/boot.md`, not the PO's 7-name list — and the divergence catch already fired:
| boot | named state | verdict |
|---|---|---|
| robbin-expert | ~v0.8.61 + "S36 DONE" | STALE (~62 versions) |
| robbin-req | "CURRENT: Sprint 31" + R31 table | STALE |
| robbin-planner | "prod v0.7.65" + S30 + S31 | STALE (two FINISHED sprints) |
| robbin-po | v0.8.123 + S40 | CURRENT but STATE-BEARING → will rot |
| robbin-architect | none (fixed to cure shape this session) | ✓ target |
| robbin-tester | "v0.6.0 marathon" as LESSON provenance | near-timeless (version is lesson-stamp, not a current-state claim) |
| robbin-skill-expert | none | ✓ target |
| **oosh-expert / oosh-po@MacStudio / oosh-tester** | sprint-1 (ooshTeam, other team) | **STALE — OUTSIDE the 7-name list** |
**⇒ A universal "the 7 robbin boots == HEAD" would MISS 3 stale oosh boots.** This is the concrete proof the guard must DISCOVER all boot files + carry a divergence check, never a hand-list (enumerate-not-universal).

## LAYER 1 — INTERIM CURRENCY GUARD (equality invariant, like served==committed)
Fold a CURRENCY dimension into the existing boot-essence lint (efbc30e3e), routed through the SAME `structuralDiscover` as R40.54's AcGuard — ONE discovery source, no copied shape-matcher (the DISCOVERY-UTILITY-SINGLE-SOURCE fold; closes recursion).

**Invariant:** for every boot file that NAMES a sprint/version in an active-state position, `boot.named(sprint,version) == gitHEAD.derived(sprint,version)`, else **RED**. `gitHEAD.derived` = `package.json` version + the CurrentSprint pin's sprint (single-sourced, same as the app).

Apply my laws:
- **enumerate-not-universal + divergence:** DISCOVER every `session/agents/*/boot.md` by glob (incl. other teams: oosh*, @host variants). Divergence check = a boot file present on disk but NOT in the lint's evaluated set ⇒ RED (a NEW agent file cannot hide by being unlisted). The set is discovered, never hand-maintained.
- **fail-closed on unparseable:** a boot that names a version/sprint the parser can't resolve to a comparable value ⇒ RED, never skipped-as-pass. (An ambiguous boot is treated as stale until proven current — same fail-closed as the R3 uuid resolver.)
- **lesson-provenance exemption, tightly scoped:** a version inside an explicit `## Hard-won patterns (v0.6.0 …)` lesson heading is provenance, not active-state — exempt ONLY when under a marked lessons section, never in a `## Current`/`## Goal`/anchor position. (Prevents false-RED on robbin-tester; the exemption itself is enumerated, not a blanket "ignore versions".)
- **stub-must-fail (own failability, R40.54):** the lint ships with a RED-proving fixture — a seeded boot naming a deliberately-old version MUST make the lint RED. If the stub passes, the lint is not wired; CI blocks. Isolated (fixture in scratch, no prod mutation, cleanup-on-failure per R40.31).

Wire into `ci:gates` alongside the boot-essence lint. Output names each stale boot + its named-vs-HEAD delta (evidence, not a bare count).

## LAYER 2 — THE CURE: STATE-REMOVAL (R113 conformance; currency-check becomes vacuous)
Currency-checking only guards files that STILL carry state; the defect class disappears when boots carry NO state. Target shape (R113): **timeless rules + identity + an ANCHOR POINTER to `context.md` (refreshed each save) — zero sprint/version/findings.**
- The lint's DEEPER assertion (escalation): a boot file SHOULD carry no active-state sprint/version at all. Ship as **WARN now / RED after each agent's cure-migration is scheduled** (delta-vs-absolute, the R40.54 lesson — don't RED-gate absolute-conformance before the migration that achieves it, or it false-fails the very files being cured).
- **Conformance flag** per boot: `state-bearing` vs `timeless+pointer`. The currency check applies to `state-bearing`; a `timeless+pointer` boot passes by construction (nothing to rot).

**Who goes straight to the cure (no state to reconcile — just confirm pointer shape):**
- **robbin-architect** (done this session — timeless + points at context.md anchor), **robbin-skill-expert** (already no state), **robbin-tester** (strip/mark the v0.6.0 stamp as lessons-only; otherwise timeless).

**Who needs state STRIPPED into their context.md anchor first, then cured:**
- **robbin-expert** (v0.8.61/S36 → anchor), **robbin-req** (S31 table → anchor), **robbin-planner** (v0.7.65/S30+S31 → anchor), **robbin-po** (accurate today but state-bearing → anchor), and the **oosh* trio** (own team's anchors). For these the interim currency guard protects them until their cure lands.

## SEQUENCING
1. **Ship Layer-1 currency guard now** (protects the 7 state-bearing boots from silent rot immediately; failable, discovered-set, fail-closed).
2. **Cure the 3 already-timeless boots now** (architect done; tester + skill-expert trivial) — removes them from the guard's scope by construction.
3. **Schedule state-strip → cure** for expert/req/planner/po/oosh-trio; as each lands, flip its conformance to `timeless+pointer` and the absolute-conformance WARN→RED for it.
Currency-check = the interim guard; state-removal = the cure. Both designed; the guard is what makes ghost-context impossible-by-construction until the cure reaches every file.

## HANDOFF
- **trainer PROPAGATES** the timeless+pointer boot shape into the boot generator + each agent boot (never me — I designed).
- **req MINTS the AC** (requirement: no boot may name a sprint/version diverging from HEAD; deeper: a boot carries no active-state — enforced by this lint, stub-must-fail). Ride the R40.54 failable-AC family (this IS an unfailable-AC-class defect: "boots are current" was an unenforced wish).
- I RE-INSPECT after propagation (verify the discovered-set covers new/renamed boots; verify the stub fails).
