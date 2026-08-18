# Gate-presence by construction — every gate proves it is PRESENT and ABLE TO FAIL (fleet doctrine)

robbin-architect 2026-08-18, PO directive (generalize the owner-action-smoke meta-assertion). **Fleet doctrine, not a one-off.** Lives here (a durable skill), NOT in a sprint spec — a doctrine in a sprint doc EVAPORATES at archive (the same lesson that moved the hooks code-adjacent). Hand to expert to implement the shared check + manifest.

## The problem (measured)
`package.json` `ci:gates:raw` is a hand-maintained `&&`-chain of ~30 `npm run check:X`. ANY link can be silently deleted to green CI — that is exactly how `check:task-status` was removed. A deleted link is INVISIBLE: the chain runs the rest and reports GREEN; nobody investigates a passing pipeline. Detection is weak; **prevention** is the only real fix (R40.39 impossible-not-detectable). Predeploy (the new owner-action smoke) has the same exposure.

## The invariant (fleet-wide)
Every gate we RELY ON must prove TWO properties, or it is not a gate:
1. **PRESENT** — it is in its chain and actually ran (a silently-removed gate = RED).
2. **ABLE TO FAIL** — its stub-must-fail trips (a gate that can't fail is vacuous, proves nothing).
The owner-action smoke's meta-assertion (manifest must contain the smoke step) is the PRESENT half; stub-must-fail is the ABLE-TO-FAIL half. Doctrine = both, for every gate.

## The pattern
### 1. ONE single-source manifest (the authority)
`scripts/gates.manifest.json` (or `.ts`) lists every required gate: `{ name, command, chain: 'ci'|'predeploy', stubMustFail: <path or marker>, why }`. This is the SINGLE SOURCE of "what must run" (L2). The `&&`-chain is retired.
### 2. Manifest-DRIVEN runner (can't run a subset)
`scripts/run-gates.mjs <chain>` reads the manifest and runs EVERY gate for that chain, collecting a roll-call of what ran + each exit. `ci:gates = node scripts/run-gates.mjs ci`; predeploy = `node scripts/run-gates.mjs predeploy` (blocking). You cannot drop a gate by editing a script line — adding/removing is a VISIBLE, reviewable diff on the manifest, never a buried `&&` deletion.
### 3. `check:gate-presence` — the meta-gate (self-registered in the manifest)
Asserts, for each chain:
- **Roll-call completeness:** the set of gates that RAN == the manifest set for that chain (a missing receipt → RED). The runner can't skip a manifest gate without the roll-call coming up short.
- **Frozen FLOOR (manifest may not SHRINK):** the manifest is compared to a committed floor; a REMOVED gate fails UNLESS the diff carries an authorized `GATE-REMOVED: <name> by <authority> reason <...>` marker — mirroring `check-controller-dominance`'s "allowlist may not GROW" bite, inverted to "manifest may not SHRINK". Removal becomes a deliberate, attributed act, never a silent green.
- **Self-registration:** `check:gate-presence` is itself a manifest entry → removing it shrinks the manifest → the floor-check RED. It guards its own presence.
### 4. stub-must-fail (the ABLE-TO-FAIL half, per gate)
Each manifest entry names its stub-must-fail. `check:gate-presence` (or a companion `check:gate-falsifiable`) asserts each gate's stub actually TRIPS it — a gate that stays green with its defect injected is vacuous and RED. (The owner-action smoke already carries this; doctrine requires it of all.)

## Who guards the guard (the recursion, resolved)
The recursion bottoms out at ONE high-scrutiny entry, vs today's ~30 silently-editable links:
- The CI config line `run: npm run ci:gates` and the predeploy entry point invoke the manifest-runner. Removing THOSE is a visible change to the pipeline ENTRY (high review), not a buried sub-script edit.
- Everything below the entry is manifest-driven + floor-guarded, so no gate below can vanish silently. The attack surface shrinks from ~30 editable `&&` links to 1 reviewed entry.

## stub-must-fail for the doctrine itself
- Comment out / delete a gate from a chain → `check:gate-presence` RED (roll-call short + floor shrank).
- Shrink the manifest without the `GATE-REMOVED:` authorization → RED.
- Make a listed gate a no-op → its `stubMustFail` no longer trips → RED.

## Rollout
Expert: build `gates.manifest.json` + `run-gates.mjs` + `check:gate-presence` (self-registered) + migrate `ci:gates:raw` and the predeploy chain to the runner. Seed the floor from the CURRENT ~30-gate set (so nothing already-present can be dropped) + the owner-action smoke (predeploy). Report-only→strict once the roll-call is green. This makes the `check:task-status` silent-deletion class IMPOSSIBLE fleet-wide, not merely detectable.
