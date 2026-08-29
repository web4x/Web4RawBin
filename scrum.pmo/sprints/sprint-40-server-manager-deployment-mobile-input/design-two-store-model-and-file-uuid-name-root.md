# Two-store model + File-name=uuid regression — root ruling + FIX SHAPE (architect, 2026-08-29)

Supersedes the open questions in `second-store-ruling-PRESERVED.md` (my pre-wall diagnosis, preserved by trainer commit 4eb9ea2a). req + expert independently MEASURED the answers while I was walled; PO relayed; my own re-measurement corroborates. This note rules the FIX SHAPE for req/planner/expert (blocked on it). Tron features only — no security work.

## MEASURED REALITY (settled, do not re-derive)
1. **TWO STORES ARE LEGITIMATE, not accidental duplication.** `scenario/index` (5777, git-tracked) = canonical scenario units. `data/model-store` (720, gitignored runtime) = a DELIBERATE separate M1/view store, canonical for Folder/File/Diagram/ModelElement. Writer sets are DISJOINT (my grep: model-store ← server.ts + detail-children.ts + rb-detail-drawer.ts; scenario/index ← the mint/index classes class-mint/classes/CurrentSprint/skills/…). Largely disjoint content. My preserved "same disease at storage level / two-stores-is-the-bug" framing was WRONG on the duplication charge — corrected here. (The DRY instinct was right in general, wrong on THIS pair.)
2. **The 33 overlapping uuids ALL AGREE** — byte-identical name+ownerIor, all `ModelElement`. Since ModelElement's canonical store = model-store, the 33 copies **in scenario/index are the accidental ones**. Because they agree, this is safe **elimination, not reconciliation**.
3. **The visible regression is SEPARATE from the 33:** 5 `File` units in model-store with `name==location==uuid`, `inScenario=false`, minted from `file:<uuid>` refs. ROOT = **a caller passed a raw uuid where a file PATH belongs** → `ensureViewUnit` set name=location=uuid. A bad CALLER, not a broken writer.

## MECHANISM (measured, server.ts:1252 ensureViewUnit)
`file:`/`dir:` branch (1259-1262): `rel = ref.slice('file:'.length)`, then `location = rel; name = rel.split('/').pop() || rel`. The only guard (1254) rejects `..`. So a `file:<uuid>` ref flows straight through → `location = <uuid>`, `name = <uuid>`. Nothing asserts that a `file:` payload is path-shaped.

## FIX SHAPE (a) — eliminate the 33 accidental scenario/index copies
- **GATED dry-run+count migration** (R40.31 isolated, must be able to FAIL). Dry-run prints the 33 uuids + confirms each is byte-identical (name+ownerIor) to its model-store twin BEFORE removal — a divergent pair ABORTS (never delete a copy that disagrees; that would be data loss, not dedup).
- Remove the 33 from `scenario/index` ONLY (ModelElement canonical = model-store). **INV: model-store byte-diff == 0** (the canonical store is untouched). **Conservation:** distinct-ModelElement-uuid count across BOTH stores unchanged (33 removed from the non-canonical store, 0 lost — each still resolvable in model-store).
- Reversible; run on a scratch copy; cleanup surviving failure.

## FIX SHAPE (b) — the file:<uuid> caller → KILL THE CLASS, not just the instance
Rule: **BOTH**, and the by-construction guard is primary.
- **PRIMARY (class-kill, correct-by-construction): `ensureViewUnit` REFUSES a uuid where a path belongs — fail-closed.** In the `file:`/`dir:` branch, after computing `rel`, if `rel` matches a bare v4-uuid shape (or more strictly: has no `/` AND no file extension AND matches the uuid regex), **return null + WARN** (`[ensureViewUnit] refused file:<uuid> — a uuid is not a path; caller passed a raw ior where a path ref belongs`). A `File`/`Folder` unit can then NEVER be minted with name==location==uuid, regardless of which caller misbehaves. This is *scan-the-hazard-not-the-actors*: the hazard (uuid in a path slot) names itself and is unevadable; we do not hunt every caller forever.
  - Pair with the existing fail-loud drawer path: a refused ref surfaces `⚠ unresolved`, never a permanent Loading — the R40.11 fail-loud lesson.
- **SECONDARY (instance): fix the specific caller** the expert is hunting (~90%) that constructs `file:<uuid>`. It should pass the real path (`unit.model.sourceFile` stripped of `ior:file:`) or a `type:uuid` instance ref — NOT `file:<uuid>`. The caller fix repairs the 5 live units; the guard ensures no future caller re-opens the class.
- **FAILABLE (R40.54 family — this IS an unenforced-wish defect "File names are paths"):** the guard ships with a stub-must-fail fixture — `ensureViewUnit('file:<a-v4-uuid>')` MUST return null (RED if it returns a unit). Wire into the same lint family. Repair the 5 existing name==uuid File units (re-derive name from their real sourceFile, or retire if the ref was pure garbage) as a gated count-migration alongside (a).

## HANDOFF
- **req:** mint the AC — (a) no ModelElement lives in >1 store (33→0 in scenario/index, gated); (b) ensureViewUnit refuses a path ref whose payload is a bare uuid (fail-closed, stub-must-fail); ride the R40.54 failable-AC family. UC shape: `modelStore.dedupeModelElements` + `modelTree.refusePathRefUuid` (or extend the existing ensureViewUnit UC c3902503 with the refusal invariant).
- **planner:** stand up the two gated migration tasks (33-elimination, 5-File-repair) + the guard.
- **expert:** land the caller fix (instance) + the ensureViewUnit refusal (class) + the two gated migrations behind their dry-run+count gates. CHOKEPOINT: the migrations write via the store APIs — mint/remove as explicit gated authoring, hold for my confirm before running either removal step.
- I RE-INSPECT: guard stub fails; model-store byte-diff==0; 33 gone from scenario/index + still resolvable in model-store; 5 File units name!=uuid.
