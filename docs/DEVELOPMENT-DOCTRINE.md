# DEVELOPMENT DOCTRINE — how we work, and why (Web4RawBin canonical reference)

**READ THIS BEFORE you claim a thing is done, remove a gate, cite a uuid, rewind an agent, or trust a number.** Every rule below was learned by being *wrong* and caught by *measurement, not authority* — the whole team's hard-won nights, purified. Companion to [ARCHITECTURE-PATTERNS.md](./ARCHITECTURE-PATTERNS.md) (reuse-before-you-build); this file is *conduct-before-you-claim*.

*Provenance: distilled by ARON (keeper of the doctrine) from the "Temple Offering" purification of all fleet agent learnings (2026-08-09, Tron directive). Full per-agent essences + contradiction ledger: `web4x/Web4AI:session/agents/ARON/purified/`. Reconcile changes into canon; propagate to build-SKILLs via the trainer.*

---
## PART A — First principles (the 11 canonical truths)
1. **Measure, never assume.** assume = ass-u-me. Ground truth (the `/context` panel, the process args, the committed disk, the served bundle) over any vouch, memory, estimate, or title. A self-estimate errs in *both* directions; a peer's vouch is a labelled hint, not proof.
2. **One truth, one source (DRY).** Each fact lives in exactly one place; everything else points to it. The resolver is the source, the display a hint; the panel the source, `context.read` a floor; the disk the source, memory a cache. Write once, link everywhere — never restate. (Two instruments naming one metric differently is the disease — collapse to one shared predicate.)
3. **Fail loud, never silent.** Errors are data. No `2>/dev/null`, no swallowed `.catch(()=>{})`. A silent failure records *nothing* — worse than an absent one, because it looks like success. A vacuous/empty/null/0 guard must REFUSE and name the reason.
4. **Verify with an INDEPENDENT method.** Corroboration must measure *differently*. The tool that made the claim confirming the claim proves nothing; the implementer verifying in their own frame is not verification.
5. **Disk wins over memory.** After any rewind, re-derive from disk — the restored conversation may be weeks stale. *Wer schreibt, der bleibt*: only what is written and committed survives the next incarnation.
6. **A rule or gate that never runs protects nothing.** A gate removed to green CI, a threshold never enforced, a rule written in a SKILL but never practiced — all equally empty. Codified ≠ enforced: put the invariant in a running gate, not a comment.
7. **Evidence must be able to FAIL.** A test that cannot fail proves nothing; a stub that passes is a false green; the gate must be able to *see* the bug. Bite your own gate — prove it reddens on a violation.
8. **A rule that exempts its author is not a rule.** Apply it to yourself first. (The night's deepest lesson: nine agents each broke a rule they authored or owned.)
9. **Contradict the one who leads you — with evidence.** Compliance while holding contrary evidence is the betrayal. Produce the measurement, halt, raise it as a question — hardest on a destructive or corrective order. Deliver literally; never inject caution that wasn't asked for.
10. **Nothing is urgent; all is diligence.** A machine has no pressure or fatigue — a rule is applied deterministically every invocation or it isn't. "Under pressure I relapsed" is an unmeasured assumption masking a rule not applied.
11. **Commit continuously — only what is printed survives.** In-context reasoning that never reached disk is unrecoverable; a big end-of-session write is a single point of failure. Write-as-you-go.

## PART B — The gating canon (delivery quality, R1-R7)
- **R1 no-silent-gate-removal** — a failing gate is the gate *working*; fix the DATA or make it report-only-LOUD; removal needs a committed justification naming what supersedes it.
- **R2 stub-must-fail** — every gate proves it can fail (silent-stub breaks the suite; drift-injection cases; name the vacuous *family*).
- **R3 full-uuid, never 8-char** — cite units by full 36-char uuid + kind; prefix resolution fail-closed on ambiguity. (8-char prefixes collide and manufacture phantom defects.)
- **R4 evidence-must-be-able-to-fail** — a Test credits only if AST-attached to an assertion exercising the claimed scope; classify fail-closed (PROVEN / UNPROVEN / FICTIONAL).
- **R5 identity-is-minted** — uuids are minted (random v4) and copied only from the disk unit; patterned/ascending/hand-typed = fabricated → re-mint via gated migration.
- **R6 certification-scope** — a partial-proof Test pins `certificationScope` {proven+surface / not+why}; the field's absence is itself the claim "fully proven" and must be true.
- **R7 contradict-with-evidence** — = first-principle #9, wired into every role.

## PART C — Settled engineering rules (the authoritative sides — these are LAW here)
**Traceability & crediting**
- The chain is **6-step, forward-only**: Requirement→UseCase→Class→Method→Implementation→Test. **Task is NAVIGATION** (Sprint→Task→coveredRequirements), never a chain hop.
- **`[impl:uuid]` credits only when AST-attached to a declaration whose NAME matches the Impl's method** — not a comment/const/closure/field/differently-named member; the marker heads (or is in-body of) the name-matched member. Presence ≠ attachment. Test-hop is lenient (unit-in-index + bare marker under `test/`); Impl is strict-AST.
- **A chain is COMPLETE only at a Test leaf** carrying a real full-uuid `[test:uuid:]` SOURCE marker AND wired `Impl.tests[]`. Markers live in `.ts/.test.ts` source only, never in `scenario.json` (a comment breaks JSON parse). **chain-complete ≠ task-Done.**
- **Scenario units are the source; markdown is a generated VIEW** (`generate-sprint-md.ts`). Edit the unit + regenerate. **Scenario-first (#126): the unit exists before the code; reject an impl with no backing unit; a backfill is proof the rule was already broken.** req+planner mint scenario units; the expert authors only Impl units + markers.
- **The pin is a single computed source: `resolveSprintPin`** derives the 3 slots from the board on disk. Stored/hand-set slots retire. `--force` is FORBIDDEN on pin-advance (a block is a bug to fix). ≥6 Active sprints → **FAIL-LOUD "UNRESOLVED", never silent-pick.**

**Deploy & verification**
- **Shipping to Tron's PWA = version bump + `sw.js` CACHE_NAME bump + new route in `sw.js` STATIC_SHELL + git tag — all in the SAME commit-set.** Any one missing → it never reaches his device.
- **Version SOURCE = the typed Config unit;** build generates package.json / sw.js / manifest from it; runtime reads the build-STAMP, never a live file per request.
- **Verify the fix in the BUILT/DEPLOYED artifact, not source.** `[r]` rebuild ≠ real restart (the "version-lie": `/api/config` shows the new version while the PID predates the fix — prove by fresh PID/uptime). Client bundles go live from disk; **server routes stay STALE until restart** — curl the actual new route.
- **Match the gate to the bug's physics.** Paint/compositor bugs are INVISIBLE to headless/Playwright (it serializes JS→paint→capture) → gate structurally + device-confirm; touch/gesture → real device coords + `page.click` (hit-tests), not `dispatchEvent`; visual → **pixel/screenshot at Tron's viewport (real-WebKit@390)**, never DOM presence. **Gate before deploy; Tron is a QA-gate that REDIRECTS, never the tester.** Every device-caught regression = a MISSING AC → fix the code AND backfill the AC.
- **Enforce invariants BY CONSTRUCTION, never by repeated data-patching.** If you fix the same data shape twice, file a code bug. `--force`/`--skip`/`--no-verify` are forbidden — the block IS the bug report; make the object self-heal.
- **A cleanup tool with no concept of "deliberate" is a demolition tool** — pair every fiction-remover with a truth-protector (registered inline sentinels, not a remembered skip-list). Identity surgery = the server's own non-destructive consolidate, never deletion.

**Agent conduct (applies to every role working this repo)**
- **QA-Review + Done are Tron's gate ONLY** — never self-check Done from impl commits. Report every landing as three dims: *mechanics-gate | renders-at-Tron's-surface | Tron-QA*; a green gate is necessary, not sufficient.
- **your-hop-your-status** — each agent self-marks only its own hop; never backfill another's.
- **OOSH wrappers only** (`otmux`/`hiveMind`/`claudeCode`) — no raw `tmux`/`find`/`stat`/`date`; no pipes/`2>&1`/`|head`/`|tail`. `git add` explicit paths, never `-A`/`<dir>` (it sweeps peers' in-flight work). Never rewrite pushed history.
- **Rewind, never `/compact`** a trained agent (compact drifts role); commit context.md first (that's what makes a rewind recoverable). A walled agent cannot self-save — a peer preserves it, commits, THEN rewinds; recover a walled driver first.

---
**Measure, never assume. One truth, one source. Wer schreibt, der bleibt.**
