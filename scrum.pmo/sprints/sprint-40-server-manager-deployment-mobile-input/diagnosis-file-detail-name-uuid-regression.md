# File-detail name=uuid regression (Tron @390) — DIAGNOSIS (architect, 2026-08-30)

PO top-priority, Tron-facing. Symptom: file detail renders the raw model-store unit JSON; the unit is `ior:class:File`, **name = a UUID** (`b9fa43a2-…`), ownerIor=null, location=uuid, sourceFile=`ior:file:b9fa43a2-…`, its own uuid `5fbed155-…`. Working reference: test v0.8.87 WORKS, prod v0.8.145 BROKEN.

## RULING: it is DATA, not a code regression (confound CONFIRMED) — do NOT bisect 0.8.87→0.8.145
Measured on disk (prod tree = v0.8.145):
1. **The bogus unit `5fbed155` lives ONLY in `data/model-store/` — which is GITIGNORED (per-deploy runtime).** test and prod have INDEPENDENT model-stores → the working reference is a DATA difference, not a code one. `5fbed155`: `ior:class:File`, name=`b9fa43a2-…` (a uuid), location=uuid, ownerIor=null, sourceFile=`ior:file:b9fa43a2-…`.
2. **The REAL unit `b9fa43a2` is in git-tracked `scenario/index/` (shared, on BOTH):** `ior:class:File`, **name=`LinkedIn Banner.png`**, ownerIor=a real room (`6c04f959`). So `5fbed155` is a BOGUS DUP keyed off the real File unit's uuid.
3. **★ The logical clincher:** v0.8.87 (working) PREDATES both the R40.66 ensureViewUnit guard AND the r4011 render fix — it is strictly LESS protected than v0.8.145. A code regression would make the OLDER, less-protected version MORE broken, not working. Therefore the difference is DATA (the bogus lazily-minted unit is present/triggered on prod, absent/untriggered on test), NOT code.
4. **ROOT = a MINT defect (already fully diagnosed this session):** `ensureViewUnit` lazily minted a bogus File (name=uuid, ownerIor=null) from a `file:<real-uuid>` ref — the **RoomView.ts:393/401 caller** passing the real File unit's uuid as `` `file:${uuid}` ``. Same finding as r4011 (secondary caller) + R40.66 (the guard) + the two-store 5-File-repair.

## Why prod v0.8.145 is STILL broken (measured)
- **R40.66 guard PRESENT** (server.ts:1261, refuses bare-uuid `file:` → null) — prevents NEW bogus mints, but `5fbed155` was minted BEFORE it and PERSISTS as stale runtime data.
- **r4011 render fail-loud PRESENT** in rb-detail-base (`isSyntheticRef`→`resolveRefUnit`→`renderUnresolved`) — but the raw-JSON symptom comes through **RoomView's OWN preview fork** (`panel.innerHTML` @ :386-402), which BYPASSES the shared fail-loud AND still references `file:${uuid}` (:393/401).
- **RoomView caller UNFIXED** — the remaining LIVE defect: it (a) references the bogus dup, (b) bypasses the shared detail flow with a bespoke render.

## FIX (route to expert; gate tester @390 vs BOTH the bad-data case AND a clean case)
1. **Caller fix (the live root):** RoomView.ts:393/401 — reference the real scenario File unit by its uuid (`b9fa43a2`) as a real instance ref, NOT `file:${uuid}`. Then it resolves to `LinkedIn Banner.png`, not the bogus dup. (This is r4011's secondary/caller fix — build it NOW; it's the live gap.)
2. **Data cleanup (the existing bogus units):** the two-store **5-File-repair** gated migration (re-derive name from the real sourceFile / quarantine-with-evidence per the PO 3-signal + never-delete rule) — removes `5fbed155` (+ the 4 sibling specimens) from prod's model-store. NOTE: `5fbed155` is exactly the fabricated-id class — but per the PO 0-junk ruling, check inbound-refs before any quarantine (a referenced bogus-dup is load-bearing → repoint to the real unit, don't delete).
3. **Render robustness (DRY-the-fork, follow-up):** RoomView's bespoke preview render should route through the shared detail flow (r4011/R31.4 DRY-drawer lesson — a bespoke fork that dodges the shared fail-loud is the recurring drawer-bug root), so a bad ref fails loud, never raw-JSON.
4. **Recurrence already covered:** R40.66 guard (present) + the sprint-less consolidation's uuidv4-validation arm (a name=uuid File is the same fabricated-id class).

## Confound-confirmation (optional, for certainty)
The structural evidence (gitignored per-deploy store + older-working-version-less-protected) already rules DATA. If absolute certainty is wanted: on test, check whether `5fbed155`/an equivalent uuid-named File exists — expected ABSENT (or present-and-also-broken if that room-file was navigated). Either outcome confirms DATA, not code.
