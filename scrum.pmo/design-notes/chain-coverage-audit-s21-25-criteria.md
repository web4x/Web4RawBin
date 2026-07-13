# Chain-Coverage Audit S21–S25 — Criteria (architect spec → skill-expert runs)

**Author:** robbin-architect · 2026-07-13. PO-greenlit interim work (INTERRUPTIBLE on Tron R30.x-next). Roles: **architect defines criteria (this doc); skill-expert (0.2, traceability owner) RUNS the measure via the T27.5 `trace:audit` registry; gaps → BACKLOG (measure-first, do NOT fix inline).**

## Scope
Every `ior:class:Requirement` in `Sprint.requirements[]` for Sprints 21–25. Walk the LOCKED 6-hop chain per req: **Req → UseCase → Class → Method → Implementation → Test**. Measure completeness + integrity. Report per-sprint funnel + a gap backlog.

## A. Per-hop completeness (each hop must be PRESENT + resolvable)
For each requirement, derive the chain and record the deepest hop reached:
1. **Req→UC:** `req.model.useCases[]` non-empty AND each UC uuid resolves to a unit on disk.
2. **UC→Class:** `uc.model.class` set AND `uc.model.classes[]` includes it AND the Class unit exists.
3. **Class→Method:** `uc.model.method` set AND Method exists AND `Method.uuid ∈ Class.model.methods[]`.
4. **Method→Impl:** `method.model.implementations[]` non-empty AND each Impl exists.
5. **Impl→marker (AST-attach):** for each non-`designAhead` Impl, its `[impl:<uuid>]` marker is PRESENT in the sourceFile **AND sits on a name-matching declaration** (AST-attached, not a floating inline comment). ⭐ *marker presence ≠ attachment* — this is the R30.2/R30.3 + v0.7.11 lesson; the audit must check the decl, not just grep the string.
6. **Impl→Test:** `impl.model.tests[]` (or `method.model.tests[]`) non-empty AND each Test exists AND is credited (champagne: Test reachable + declares the chain).

## B. Credited vs present (two-tier per hop)
- **Present** = unit exists + reachable via forward refs (structural derive).
- **Credited** = the hop is marked done/gate-proven in the scoreboard (`Chain.scoreboard`).
- **designAhead honesty:** an Impl flagged `designAhead:true` is *present-by-design, not-yet-shipped* — NOT a defect. Report it as its own bucket ("chain-complete-to-design, awaiting build"), distinct from a genuine gap. A `designAhead:false` Impl with NO attached marker IS a gap.

## C. Integrity axes (T27.5 `trace:audit` registry — the measures)
- **Axis-2 nodeWellFormedness:** every unit has valid `ior` + `model.uuid` + UNIT-level `ownerIor` (ownerIor = `j.ownerIor`, NOT `j.model`).
- **Axis-3 oneClassPerFile / 0-dup:** exactly ONE Class unit per class name — measured by the uuid-FILE, not grep (prefix collisions are real).
- **Axis-4 markerHasChain:** every `[impl:uuid]` marker in source resolves to an Impl that sits in a live chain (no orphan markers); inverse also — every non-designAhead Impl has its marker attached.
- **No dangling:** EVERY forward ref (`useCases[] classes[] methods[] implementations[] tests[]`) AND back/nav edge (`tasks[] coveredRequirements parent ownerIor`) resolves to an existing unit. A ref at a deleted unit = dangling gap.
- **No orphan:** every unit is reachable from a Sprint root (Sprint→req→… OR Sprint→task→coveredRequirements); a unit with 0 inbound = orphan gap.

## D. Metric — per-sprint funnel (report table)
Per sprint: `N reqs | →UC | →Class | →Method | →Impl(present) | →Impl(marker-attached) | →Test(credited)` counts, + integrity totals `{dangling, orphan, dup-Class, designAhead-Impls}`.

## E. Tooling (skill-expert runs — the measure)
- `npm run trace:audit -- --strict` (auditAll/walk over scenario/index) → dangling/orphan/well-formedness/marker axes.
- Per sprint: `Chain.scoreboard <reqUuids> <sprintIor>` → present-vs-credited funnel.
- `Chain.lintMarkers` → marker-attach (AST) check across the Impl sourceFiles.
- `Chain.listComplete <sprint>` → which reqs reach Test.
- Node18: `/root/.vscode-server/bin/903b1e9d8990623e3d7da1df3d33db3e42d80eda/node`. Repo `/var/dev/Workspaces/web4x/Web4RawBin`.

## F. Output — GAPS AS BACKLOG (do NOT fix inline)
Each gap = `{sprint, req/unit uuid+altId, hop, gapType}` where gapType ∈ {no-UC, no-Class, no-Method, no-Impl, marker-missing, marker-not-attached, no-Test, dangling-ref, orphan, dup-Class}. Group by sprint; separate the `designAhead` (expected) bucket from genuine gaps. Hand the backlog to planner/req for scenario-first remediation tasks — **the audit MEASURES; it does not mint fixes.** Known-expected: recently-minted chains (R25.x, S24) have empty `tests[]` (tester champagne pending) and some `designAhead` Impls (unbuilt) — flag, don't alarm.

## Coordination
- **skill-expert (0.2):** RUN A–E, produce the F backlog. You own the registry + the measure.
- **architect (me, 0.3):** available to derive-confirm any ambiguous chain by uuid-file if the audit flags a suspected dup/collision.
- **planner/req:** receive the gap backlog → scenario-first remediation (measure-first, per #126).
