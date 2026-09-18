# T41.6 — M2 persist-by-construction (persist path + persisted==derived gate) (robbin-architect, 2026-09-18)

SPEC for the expert to build in one pass (design-only; PO re-ranked this ABOVE inc-4). Closes the EXISTS⊂PROVEN gap: inc-3's gate is green over the RE-DERIVED graph, but the PERSISTED /model units are still mis-homed (FileModel not minted; 4 attrs still `memberOf=File 13782f0c` though their derivationKeys say `file.ts::FileModel.<attr>`).

## ★ LIVE DUP HAZARD — CONFIRMED from code (raises urgency)
The go-live/re-sync persist path REACHES these classes TODAY and uses the LEGACY (no-resolveByKey) generate:
- `POST /api/model/generate` (server.ts:3368-3380) — generates ANY single `.ts` file → `TsToModel.generate([abs], {write:true})` (legacy).
- `POST /api/model/generate-project` (server.ts:3388) → `generateProjectModel` (generate-project.ts:34) — default manifest = **`src/ts/scenario`** (which CONTAINS `file.ts`), CAP 200, `TsToModel.generate(files, {write:true})` (legacy).
Because the existing File-M2 attr units are ARBITRARY-uuid hand-mints (82bfe4e5 ≠ `keyToUuid(::FileModel.uuid)`), a legacy generate over `file.ts` computes NEW keyToUuid uuids → **mints DUPLICATE attr/class units alongside the existing ones** on Tron's live model. So the moment file.ts is re-generated via either endpoint, the model dups. This is not hypothetical — it is one owner click away.

## Root (one line)
The CLEAN `deriveClassM2(resolveByKey:true)` — which resolves existing units by their `derivationKey` field and reuses their uuid (no dup) — is invoked ONLY with `write:false` in the 3 check scripts. It has NO persist path. The persist path that DOES exist is the legacy no-resolve generate. So the clean structure is never persisted, and the legacy path dups.

## FIX-1 — resolveByKey IS the persist path (by construction, ONE path, no fork)
Make **resolveByKey the DEFAULT/always-on** in the generate persist path (both go-live endpoints + generate-project), eliminating the legacy no-resolve path entirely. Rationale: resolveByKey is a strict SUPERSET-safe behaviour — it builds `existingByKey` (derivationKey→uuid) from disk, resolves a unit when its key matches (reuse uuid, update memberOf/M2 fields), and falls to `keyToUuid(key)` when NO unit carries that key (identical to legacy for un-keyed units). So:
- Clean M2 units (derivationKey-stamped) → RESOLVED (uuid reused, memberOf→FileModel, FileModel minted fresh once) — no dup.
- Legacy/un-keyed units → keyToUuid (unchanged behaviour).
- Every future source change RE-DERIVES-AND-PERSISTS clean (no drift).
- No per-class fork ("which class uses which path") — one path, unevadable.
**Guard:** the r32.x go-live gates (r32.5/r325/r328/r332a) run `generate({write:true})` over fixtures — re-verify they still pass with resolveByKey default (the `derivationKey` stamp is ADDITIVE; if any gate asserts exact uuids, confirm they are keyToUuid-derived not hand-set). If a gate needs the legacy path for a specific reason, that reason must be NAMED, not defaulted.
**One-time reconcile:** after FIX-1, one `generate({resolveByKey:true, write:true})` over `src/ts/scenario/file.ts` persists the current fix (resolve the 4 attrs by key → memberOf=FileModel; mint FileModel). Expert's DRY-RUN (write:false) first, proving: resolve-list (4 attrs + File resolve to existing uuids), memberOf changes (File→FileModel for the 4), mints (FileModel only), **0 re-keys / 0 deletions**.

## FIX-2 — PERSISTED==DERIVED gate (the surface inc-3 does NOT cover)
A new FAILABLE gate `check-m2-persisted-equals-derived` (own npm script, in ci:gates): `deriveClassM2({resolveByKey:true, write:false})` over the clean-M2 sources → compare the WOULD-WRITE unit set to the PERSISTED disk units (by uuid): assert **0 would-change** — every derived unit already persisted with identical memberOf/instanceOf/relations/kind, and NO derived unit missing from disk, and NO persisted derived-class unit absent from the derivation. Equivalent idempotence check: a second `write:true` run reports `wrote==0`.
- This is DISTINCT from inc-3 (which compares the re-derived TS/UML/PUML graphs to EACH OTHER — internal consistency of the derivation). FIX-2 compares the derivation to the PERSISTED DISK (does Tron's stored model match what TS says). EXISTS⊂CORRECT (inc-3) ⊂ PROVEN (FIX-2).
- **stub-must-fail (failable):** hand-edit a persisted unit's `memberOf` (or delete FileModel) → the gate goes RED. Prove it self-catches.

## ACs (hand to req; each guard removed → RED)
1. **AC-persist-path:** the generate persist path resolves-by-derivationKey by default; a source re-generate over file.ts produces `wrote>0` on first run, `wrote==0` on second (idempotent), and **0 duplicate units** (no unit shares a derivationKey — reuse inc-3's one-representation check post-persist).
2. **AC-no-legacy-dup:** generating file.ts via `/api/model/generate` mints 0 duplicates of the existing keyed units (resolve, not mint). Remove resolveByKey → a dup appears → RED.
3. **AC-persisted-equals-derived:** the FIX-2 gate is GREEN (persisted disk == derivation); hand-edit a persisted memberOf → RED.
4. **AC-reconcile-landed:** post-reconcile disk state — FileModel M2 unit EXISTS; the 4 attrs `memberOf=FileModel`; File 13782f0c has 0 attr members; 0 re-keys (the 4 attr uuids unchanged).

## Scope / handoff
Expert builds FIX-1 + FIX-2 + runs the reconcile (after the dry-run PO ordered). I own the SHAPE + backstop: verify the dry-run proof (resolve-list/memberOf/mints/0-rekey), then that FIX-2 is failable and persisted==derived post-run, then the one-representation invariant holds on DISK (not just the re-derived graph). The edges-only lint (a85e9a954) still builds after — orthogonal.
