# Type-index archaeology — `feature` (and 10 others) never got a type-index

robbin-architect 2026-08-17, PO/Tron task ("when did you lose that!!!"). Design archaeology + the by-construction fix. Feeds R40.39. **Design only — nothing built.**

## WHEN/HOW did `feature` lose its type-index? — it NEVER had one (never wired, not dropped)
- **`scenario/sprints.md/feature/` NEVER existed in git history** (`git log --all -- scenario/sprints.md/feature` = empty). Not lost — never created.
- **Feature units have existed since S31** — `648136ad6` / `df7becc50` (R31.8 "mint Feature typed unit + FeatureManager"). 3 Feature units on disk today. ~9 sprints with no `feature/` index.
- **HOW (root):** the type set is enumerated in **multiple hardcoded/partial sources, none bound to the corpus**, and Feature was added to NONE:
  1. **`templates.ts` view-template registry** (`reg.register('ior:class:X', …)`) registers **17 types** — Sprint/Task/Requirement/UseCase/Class/Method/Test/TraceLink/User/Implementation/Room/Message/File/Device/Skill/Bug/ChangeRequest. **Feature is NOT registered.** The dynamic view generator (`regenerate-views.ts`→`generator.ts:generateAll`) derives the folder from `unit.ior` BUT renders via `registry.renderMd(unit)` — **no Feature template → Feature units never render a view → no `feature/` folder.**
  2. **`migrate-to-scenario.ts` `emitClassSymlinks('task'|'requirement'|'usecase'|'class'|'method'|'tracelink', …)`** — the one-time migration that SEEDED the folder set, hardcoded per-type, pre-S31. Feature absent.
  3. **No `byType` index on `ScenarioIndex`** (grep = none) — there is no reverse type→uuids index at all, so "give me all Features" has no fast path.
- **Net:** registering a new unit TYPE and creating its index/view-folder are **not bound to one source**. Feature slipped in (S31) as a stored type with no template, no emitClassSymlinks entry, no byType index → no folder. The corpus walk in `bootstrapSeed`/`listFeatures`/`featureRoots` is the **SYMPTOM** of that missing registration, not a perf choice. (It is cheap — 0.1s — so not an outage; it is the abandoned-pattern smell Tron flagged.)

## AUDIT — "if we lost one we may have lost more": we lost ELEVEN
Measured: distinct `ior:class` types with units on disk (**29**) vs the `sprints.md/` view-folder set (**18**). **11 types have units but NO type-index/view-folder:**

| type | units on disk | folder? |
|---|---|---|
| **testcase** | **1023** | ✗ MISSING |
| method | 643 | ✓ |
| relationship | 21 | ✗ MISSING |
| profile | 20 | ✗ MISSING |
| webitem | 26 | ✗ MISSING |
| modelelement | 44 | ✗ MISSING |
| phone | 16 | ✗ MISSING |
| gate | 7 | ✗ MISSING |
| **feature** | 3 | ✗ MISSING |
| config | 2 | ✗ MISSING |
| company / email | 1 / 1 | ✗ MISSING |

`feature` is not special — **`testcase` (1023 units, more than most foldered types) is the biggest miss.** Every type introduced AFTER the migration's frozen 18-set was dropped. No stale folders (nothing to prune) — purely additions that never wired. The enumeration froze while the type set grew: a classic multiple-sources-of-truth drift.

### Triage of the 11 (PO triage refined + partly REFUTED by measurement)
- **GENUINE type-index gaps (need an index) — 7:** `feature`(3, boot-used), `testcase`(1023, the big one), `profile`(20), `webitem`(26), `gate`(7), `modelelement`(44), `relationship`(21). ★ **REFUTES the PO's "maybe Profile/WebItem are alt-indexed":** measured `scenario/alt/` holds **exactly** company/email/phone — Profile and WebItem are NOT there → they are genuine gaps. `gate`/`modelelement`/`relationship` = post-migration types (gate + MOF/diagram S33 era), never wired — same omission class.
- **INTENTIONAL — alt-indexed (value-keyed), 3:** `company`(1), `email`(1), `phone`(16). CONFIRMED — `scenario/alt/` = {company, email, phone} exactly. These are indexed by VALUE, not type; not a gap.
- **INTENTIONAL — near-singleton, 1:** `config`(2, `config-singleton-…`). A type-index over ~1 unit is pointless.
- So: **7 genuine gaps + 4 intentional.** The requirement must name the FAMILY (any-type-without-its-index), not `feature` alone — fixing only feature leaves testcase's 1023 units corpus-walking tomorrow.

## THE BY-CONSTRUCTION FIX — make the omission IMPOSSIBLE, not merely detectable
Tron's bar: a new unit type **cannot** be introduced without its index. Two layers (prevention + un-skippable gate), the R27.2 shape:

### Layer 1 — ONE source of truth for the type set; DERIVE everything from it
- The **corpus is the ground truth**: the set of types = the distinct `ior:class:*` present. The view/index generator ALREADY derives the folder from `unit.ior` dynamically — the break is only the `registry.renderMd` dependency on a hardcoded template map. **Fix: a GENERIC default template fallback** (render any unit by its M2/model fields — the same type-driven generic view as R40.11 Slice 3) so a type with no bespoke template STILL renders + gets its folder. Then no type can be silently unrenderable.
- **Add `ScenarioIndex.byType(ior)`** backed by a type→uuids index built during the same single directory walk that `list()` already does (one pass, cached) — so "all Features" is O(features), and `bootstrapSeed`/`listFeatures`/`featureRoots` stop corpus-walking. This is the missing "index to resolve through."
- **Delete the hardcoded enumerations** (`emitClassSymlinks` per-named-type; any KNOWN_TYPES list) — every consumer reads the derived set. One source: the corpus's actual types.

### Layer 2 — every type DECLARES its index strategy (declared, not defaulted) + a GATE that fails on any undeclared corpus-walked type
The PO/Tron bar: a new type either **gets a type-index OR is explicitly DECLARED alt-indexed / singleton — declared, not defaulted.** So the single source is a **type-strategy registry**: each `ior:class:*` maps to one of `{ typeIndexed | altIndexed(keyField) | singleton }`. 
- CI assertion (`trace:audit:strict` family, the R27.2 duplicate-Class gate's sibling): for every distinct `ior:class` type with units, it MUST have a declared strategy; and `typeIndexed` types MUST have their folder + `byType` key. **A type with units but NO declaration → RED. A `typeIndexed` type resolved anywhere by corpus scan when its index exists/should-exist → RED.** stub-must-fail: add a unit of an undeclared type → gate red.
- The declaration is the forcing function: you cannot add a type and stay green without saying HOW it is indexed. `company/email/phone` declare `altIndexed`; `config` declares `singleton`; `feature/testcase/profile/webitem/gate/modelelement/relationship` declare `typeIndexed` (and backfill their folders + `byType`). 
- Prevention (Layer 1 derives from the one registry) + un-skippable gate (Layer 2 fails on undeclared/corpus-walked) = **impossible to introduce a type without its index, not merely detectable.** Same family as R27.2 "1 Class per code-class name" + the no-2nd-source lint.

## Scope / handoff
Own next-phase requirement (R40.39, req re-framing). Latent structural debt independent of inc-3. ACs: (1) `byType` index O(type) not O(corpus); (2) generic template fallback so every corpus type renders+folders; (3) the equality gate that FAILS on any unindexed type; (4) generated view-folder set == corpus types (regenerate to backfill all 11, incl. testcase's 1023). Nothing built tonight; expert builds on build-go. **The bootstrapSeed corpus-walk is fixed for free once `byType` exists — it was always the symptom.**
