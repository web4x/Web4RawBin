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
- The lint's DEEPER assertion (escalation): a boot file SHOULD carry no active-state sprint/version at all. Ship as **WARN now / RED after each agent's cure-migration is scheduled** (delta-vs-absolute, the R40.54 lesson — don't RED-gate absolute-conformance before the migration that achieves it, or it false-fails the very files being cured). ★ The WARN is a MIGRATION RAMP, never a terminal state: as each file cures, its assertion **flips to terminal RED-for-any-state** — a cured boot that later re-acquires state goes RED. WARN-forever is forbidden (see NO-GENERATOR below): it would let a cure silently decay back and there is nothing else to catch it.

## ★ NO BOOT GENERATOR — this lint is the SOLE enforcement (PO measured 2026-08-20)
Measured: there is **no boot generator**. `/root/oosh/hiveMind` is the ONLY thing that touches boot.md and it is a pure **CONSUMER** — hiveMind:3339-3344 resolves `session/agents/<role>/boot.md` and sends the newly-bootstrapped agent `Read session/agents/<role>/boot.md` (skips if absent). No template, no regeneration. Three consequences that the design DEPENDS on:
1. **Hand-cures are DURABLE** — no generator will overwrite a cured (timeless+pointer) boot back to a stateful template. R113 state-removal, once done, stays done.
2. **Nothing structurally prevents state being hand-RE-ADDED** — so this lint is the **SOLE** enforcement, not a secondary guard behind a generator. Therefore the absolute no-state assertion MUST reach **terminal RED per-file** (not WARN-forever): a cured boot is only kept cured by the lint failing the build if state reappears. A WARN-only end-state = a cure that silently decays back to ghost-context.
3. **boot.md IS the fleet's wake-up instruction** — hiveMind BLINDLY tells every bootstrapped agent to read its boot.md. That is precisely how stale state became **fleet-wide ghost-context**: a stale boot doesn't just mislead its own agent, it is the first thing every rebooted agent obeys. This is why the lint is **load-bearing, not hygiene** — it guards the fleet's first instruction.
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

## ★ THE CURE MOVED THE ROT — context anchors (PO D5 ruling, 2026-08-20)
Re-inspection D5 found: cured boots point at context.md anchors that are THEMSELVES days-stale (skill-expert v0.8.78, tester v0.8.91, planner v0.8.103, po v0.8.116, expert v0.8.120 — while prod is v0.8.123). A timeless boot pointing at a stale anchor still hands the next agent a dead world, one hop later. **Structural limit (load-bearing):** an anchor's JOB is to carry state, so it can NEVER be made rot-proof the way a boot can (removal isn't available) — only rot-EVIDENT. Different problem, different fix: **boots → removal; anchors → currency-check + verify-don't-trust framing.**
- **(1) IMMEDIATE + CHEAP — anchor SHAPE = verify-don't-trust.** Every context.md RESUME-STATE/anchor head must carry: the live-truth line(s) AND the re-derive commands AND an explicit "DO NOT TRUST THIS LINE, VERIFY IT" preface. This converts an anchor from an ASSERTION into a STARTING POINT — the only honest thing a written state-snapshot can be. (robbin-po's anchor already does this; robbin-architect conformed 2026-08-20.) Trainer PROPAGATES this framing as the anchor shape (I design it, trainer applies — never the same agent).
- **(2) DEBT, NOT NOW — extend the currency invariant to context anchors.** The right end-state: the same `boot.named==HEAD.derived` currency check applied to context-anchor named version/sprint (anchors are rot-EVIDENT via currency, since they can't be rot-proof via removal). NOT while boots are mid-cure + L2 migration pending. Recorded as explicit named debt (below), not a hope.

## ★ TERMINAL-RED FLIP with a NAMED EXCLUSION (PO ruled policy 2026-08-20; mechanism mine)
Problem: at count==0 for OUR boots we flip ci to live `--strict`. But the oosh-trio boots are another PO's files — we may not edit them. Flipping `--strict` while they are state-bearing would RED OUR ci on files we neither own nor may fix = the unfair-intermittent-RED that teaches people to delete gates (caught exactly that today). An exemption is the fix — but **an unnamed/wildcard exemption is how a guard quietly stops guarding**. So enumerate-not-universal applies to EXEMPTIONS too.

**Mechanism — every discovered boot lands in EXACTLY ONE of three buckets; a bucket sets its FAILURE POSTURE, and only STATE-BEARING triggers RED (a timeless boot always passes):**
1. `OWNED` = an explicit ownership predicate for our boots (e.g. `session/agents/robbin-*`, plus our infra `ARON`/`scrum-master` — a NAMED set, not a catch-all). Post-cure these MUST be timeless; **state-bearing ⇒ RED** at `--strict`.
2. `EXCLUDED` = an **EXPLICIT NAMED list** of the other-team boots (`oosh-expert`, `oosh-po@MacStudio`, `oosh-tester`) — never a `oosh*` wildcard, never a silent skip. Each entry carries a reason (other-PO-owned) + a time-box (closes when oosh-PO coordinates their cure). State-bearing here ⇒ **WARN-loud in our report** (flagged, not RED — we can't fix them), never green-silent.
3. `UNCLASSIFIED` = discovered − (OWNED ∪ EXCLUDED). **Held to the OWNED standard: state-bearing ⇒ RED ("cannot inherit the exemption"), TIMELESS ⇒ PASS.** ★ CORRECTED 2026-08-20 to match the SHIPPED guard (94e24ba59) — an earlier draft read "unclassified ⇒ RED (auto)", which would auto-RED every timeless unowned boot (24 in the live fleet) = the exact unfair-intermittent-RED-over-files-nobody-owns that teaches people to delete gates. The INTENT is fully preserved WITHOUT auto-RED: a state-bearing unclassified boot CANNOT hide behind the exemption (it REDs, must be triaged: ours→cure / theirs→named-exclude-with-expiry); a timeless one is already conformant so it has nothing to inherit. Auto-REDing stateless boots was never the intent — the divergence check is "no state-bearing boot escapes", not "no unowned boot exists". (A design doc that misdescribes the shipped guard is the same false-record class as a wrong rationale — [[L-S40b]] — so this is corrected in place, not left to drift.)
- **Dead-exemption check:** every EXCLUDED name must resolve to a boot that EXISTS on disk; an exclusion naming a deleted boot ⇒ flag (a stale exemption is itself rot — the exemption list is state and must not rot silently).
- **Recorded as time-boxed debt:** the oosh-trio exclusion closes when their PO coordinates their cure; until then it is a NAMED obligation, not a permanent hole.
- Enforcement staging: `--selftest`/WARN now (does not RED the fleet mid-cure); flip OWNED→`--strict` at OWNED-count==0, with EXCLUDED still WARN-loud and UNCLASSIFIED RED throughout.

## DEBTS (explicit named obligations, deferred per PO — not hopes)
1. **structuralDiscover extraction** (m.extractionDebt on R40.55, req d9a541d62): extract ONE shared `structuralDiscover` util + fold the 3 local copies (R40.54 AcGuard / R37.12 live-MVC lint / check-boot-currency.ts). MY lane (I own R40.54+R37.12). On extract → ping req → AC-discovery-single-source reverts to strict shared-SYMBOL wording.
2. **context-anchor currency extension** (PO D5, this ruling): extend the currency invariant to context.md anchors (rot-evident). Deferred until boots fully cured + L2 landed.

## HANDOFF
- **trainer PROPAGATES** the timeless+pointer boot shape into the boot generator + each agent boot (never me — I designed).
- **req MINTS the AC** (requirement: no boot may name a sprint/version diverging from HEAD; deeper: a boot carries no active-state — enforced by this lint, stub-must-fail). Ride the R40.54 failable-AC family (this IS an unfailable-AC-class defect: "boots are current" was an unenforced wish).
- I RE-INSPECT after propagation (verify the discovered-set covers new/renamed boots; verify the stub fails).
