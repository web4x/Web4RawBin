# bootstrapSeed boot-blocking — architect ruling (code-reasoned, independent of the empirical test)

robbin-architect 2026-08-17, PO-requested 2nd angle (I reason from code; expert measures empirically). **Design/ruling only — nothing built.** Do-not-deploy 0.8.97 stands.

## Q1 — Can bootstrapSeed BLOCK the event loop ~45s by construction? **YES, unambiguously.**
Measured code (`src/ts/server/FeatureManager.ts:60-79`, `src/ts/scenario/index-store.ts:64-86`):
- `static bootstrapSeed(): void` is **fully synchronous — zero `await`, zero yield.**
- `ScenarioIndex.get()` (index-store.ts:71) = `selfHealOnRead(JSON.parse(fs.readFileSync(fp,'utf-8')))` — a **synchronous `readFileSync` + `JSON.parse` per call, no cache** (each `get` re-reads its file).
- `bootstrapSeed` loops **`for (const uuid of idx.list())`** and calls **`idx.get(uuid)` for EVERY uuid** (line 67) purely to filter for `ior:class:Feature`. That is **~5677 synchronous file-reads + JSON.parses on the boot path, in one un-yielding synchronous call.** Features then get a SECOND read (`readFeature`) + a `writeFileSync` if changed.

Node's loop is single-threaded; a synchronous run of thousands of `readFileSync`+`JSON.parse` holds it start-to-finish → **`/api/config` cannot be answered until the whole corpus is scanned.** At ~5677 units, 45s ≈ 8ms/unit — entirely plausible for read+parse+selfHeal on a loaded disk. **This is not contention-dependent: it is a pure synchronous O(corpus) stall present even solo.** ⇒ **Converges with the expert's empirical "O(ALL 5677 units) synchronously on the boot path" — two angles, same mechanism, real answer.**

The 99.9% waste: only a handful of units are Features, yet EVERY unit is read to discover that.

## Q2 — Finite / idempotent under concurrent reader-writer? Livelock/tear?
- **Finite:** `idx.list()` is a one-shot snapshot (cached `_listCache`); the loop is bounded by the boot-time uuid count. **No retry, no re-entry → no livelock.**
- **Idempotent in effect:** additive only (`seedOwnerInto` + push-missing-pids, never removes) and writes only when `au.length !== before` → a 2nd run is a no-op-write. ✓
- **BUT a real corruption surface under concurrent boot:** each Feature write is a **non-atomic read-modify-write of the WHOLE file** (`fs.writeFileSync(f.file, JSON.stringify(...))`). Two instances booting together can lost-update or tear a Feature JSON (A reads, B reads, A writes, B overwrites; or interleaved partial write). **So contention does NOT cause the 45s hang** (the hang is the solo sync scan) **— but contention IS a distinct latent corruption hazard**, the same whole-file read-modify-write class flagged for the token-reembed trap.

## Q3 — Does 0.8.96-boots-fine exclude the defect? **NO — it is latent and monotonic.**
Same O(corpus) sync scan lives on the boot path; 0.8.96 simply booted **below the patience/timeout threshold** (smaller corpus and/or warm cache, nothing contending). The corpus grows every day ⇒ **boot time degrades MONOTONICALLY**; one future day it crosses the threshold = **a self-inflicted outage with NO code change at all.** A 90-second pass is a pass with a time-bomb.

★ **Reframing tonight (my reasoning, offered as hypothesis):** the old code threw `TypeError` (object-not-iterable) at the FIRST Feature → boot **crashed FAST**. The 0.8.97 fix (iterate `pi.ids`) lets the loop **run to completion** → the full O(corpus) scan + per-Feature writes now actually execute = the 45s hang. **The fix UNMASKED the latent O(corpus) cost.** Tonight's 8-min outage and the new 45s hang are TWO symptoms of ONE bad boot shape, not two bugs. (Empirically checkable: the fast-crash vs slow-hang transition.)

## THE BY-CONSTRUCTION SHAPE — boot must be READ-MOSTLY and O(1)-ish, NEVER O(corpus)
The requirement bootstrapSeed actually serves = "every Feature's `allowedUsers` contains the trusted protected identities." Re-deriving that by scanning ALL units on EVERY boot is the wrong shape twice over (O(corpus) scan AND O(features) boot-write). Ruled shape, preferred order:
1. **Seed-if-absent, LAZILY at point-of-use (preferred).** The auth/membership path already loads a Feature's `allowedUsers` when it's actually used — make "ensure trusted ids present" an **invariant there** (seed-if-absent, amortized, touched only for Features actually accessed). **Boot does zero corpus work.**
2. **Boot = read-only ASSERT + EXPLICIT repair path.** If a boot-time guarantee is wanted, boot performs at most a cheap read-only check; the full re-seed/repair is invoked **deliberately** (an admin/repair action), NEVER on the boot path.
3. **If a boot write is truly unavoidable:** index Features by type so boot touches **O(features)** (a handful) not O(corpus) — a Feature-type index, not a full `idx.get`-every-unit scan — AND a **single atomic guarded write** (write-temp+rename, not whole-file read-modify-write), AND yield the loop (`setImmediate`/`await` between chunks) so it can never block. This is the fallback; (1)/(2) are cleaner.

Whichever: **the O(corpus) `idx.get`-every-unit scan is deleted.** Boot cost must be independent of corpus size.

## Q3b — Own next-phase requirement? **YES.**
Latent scaling outage that bites regardless of inc-3; exactly the class minted outside the campaign. Proposed:
- **AC-boot-bounded:** boot work (unit reads/writes on the startup path before `/api/config` answers) is **independent of corpus size** — O(1) or O(features-via-index), never O(all-units).
- **Gate (must be able to FAIL):** instrument `ScenarioIndex.get` call-count (or file-read count) on the boot path; **FAIL if it scales with corpus / touches every unit.** Complement with a boot **completion-time budget** measured on a representative corpus (a pass that takes seconds-scaling-with-N is a FAIL, not a pass). stub-must-fail: a seeded O(corpus) boot path trips the gate red.
- **Also in scope:** replace the non-atomic whole-file read-modify-write with an atomic write / single-writer, closing the concurrent-boot tear surface.

## Inc-3 tonight
The RED boot-check is CORRECT — a real by-construction defect, not a flake. **Do NOT deploy 0.8.97 via a monitored-restart (option A):** a red boot-check overridden by belief is a by-construction claim merely asserted, at the exact locus that already cost 8 minutes with Tron connected. PO's isolated sole-instance (B) is right; report COMPLETION TIME, not pass/fail. If inc-3's shippable value is separable from bootstrapSeed, ship that separately; the boot-shape fix is its own requirement, designed here, built later.
