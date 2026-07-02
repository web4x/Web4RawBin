# R21.1–R21.9 Marker Completion Checklist
*Authored by robbin-skill-expert (chain tool owner), 2026-06-28, measured from canonical Chain scoreboard + scenario units at HEAD 84161c91f. det-3x: scoreboard 20/285 (R21 all OPEN).*

## ⚠️ Key measured finding — "add marker" is the WRONG framing for half of these
The scoreboard task text says "Add real [impl:uuid:X] in source", but **the markers already exist in source for R21.1/3/5/7**. They still don't credit because the strict Impl scan (`buildStrictImplSet`, skill-classes.ts:121-170) requires each `[impl:uuid:X]` marker to **sit ON or INSIDE a named function whose name matches the marker's label-method**. A marker in an anonymous `/api/*` route arrow, or whose unit name ≠ the Method name, is **not credited**.

Two distinct work-streams below: **EXPERT** (impl units/markers/wiring) and **TESTER** (test markers). A Req credits ONLY when all 6 hops check — every R21 Test hop is currently open, so **none credit until tester also acts**.

---
## EXPERT work

### Group A — Impl unit + marker EXIST, but not crediting (fix placement/name, do NOT re-add marker)
| Req | Method | Impl uuid (full) | Marker is in | Real blocker → action |
|-----|--------|------------------|--------------|----------------------|
| R21.1 | profile.dropVCard | `d1337706-80fa-48ba-a0a0-5b9cc42e2511` | src/public/ts/ProfileEditor.ts | Marker not on a named member matching `dropVCard` (drop/file-input handlers are anon arrows). **Move marker onto a named `dropVCard` function (or rename handler) + label it `dropVCard`.** |
| R21.3 | PhoneIndex.registerSymlink | `97015dcc-58d9-4417-8480-000000210003` | server.ts (/api/phone) + PhoneIndex.ts | **Unit NAME mismatch**: unit is `phone.indexAsSymlink` but Method is `registerSymlink` → strict scan rejects. ALSO Method.implementations[] holds a DUP (`4242f9be-…210003`, also "registerSymlink"). **De-dup to ONE impl, name it `registerSymlink`, place marker on the named `registerSymlink` method (not the anon route), re-mint uuid uuidgen-fresh.** |
| R21.5 | EmailIndex.mintAndLink | `c709147a-5596-43a7-9354-8b936b5ec3ea` | EmailIndex.ts + server.ts | Marker likely in anon `/api/email` route. **Ensure marker sits on the named `EmailIndex.mintAndLink` method; re-mint fabricated uuid fresh.** |
| R21.7 | AddressIndex.mintAndVerifyAsync | `ce2501d3-0c49-4148-8c4a-795d2fbaba24` | AddressIndex.ts + server.ts | Same anon-route pattern. **Marker on named `mintAndVerifyAsync` method; re-mint uuid fresh.** |

### Group B — NO Impl unit on disk (create unit + marker + wire)
| Req | Method | Wanted prefix | Action |
|-----|--------|---------------|--------|
| R21.2 | renderNameOnConnect | `5e9eaeb4` | Create Impl unit + `[impl:uuid:]` on named `renderNameOnConnect` + wire Method.implementations[]→Impl. |
| R21.4 | resolveOrEnroll | `4e203d64` | Create Impl unit + marker on named `resolveOrEnroll` + wire. |
| R21.8 | mintOrReuseShared (CompanyIndex) | `696545ed` | Create Impl unit + marker on named `mintOrReuseShared` + wire. **NOTE: an ORPHAN marker `a62c6e37-…000000210008` already sits in CompanyIndex.ts with NO unit — reconcile/replace it, don't leave both.** |
| R21.9 | renderActionsFirst | `9c21f3b5` | Create Impl unit + marker on named `renderActionsFirst` + wire. |

### Group C — Impl already CREDITS
| Req | Method | Impl uuid | Status |
|-----|--------|-----------|--------|
| R21.6 | PhoneIndex.mintAndLink | `801f53b3-c710-4204-91db-d71bcb773cd9` | ✅ Impl checks (marker on named method = the working pattern to copy). Only Test missing. |

### Cross-cutting expert cleanup (from lintMarkers, det-2x)
- **Re-mint all R21 impl uuids uuidgen-fresh** — current `…-58d9-4417-8480-0000002100xx` are fabricated-pattern and prefix-collide with UseCase uuids (4242f9be, 97015dcc, c59356f7, fab88cb9). Use `Chain.renameUuid` (atomic 3-sweep, count-neutral).
- **1 remaining orphan**: `a62c6e37-…210008` in CompanyIndex.ts (folds into R21.8 above).

---
## TESTER work — ALL R21.1–R21.9 need a Test hop
Every R21 Method/Impl has `tests: []` and there are **no `[test:uuid:]` markers** for R21. For each Req below: create a Test scenario unit (test-defined-first), add `[test:uuid:X]` marker in the test file, wire Impl.tests[]→Test. Do this AFTER the matching Impl credits (Group A/B), EXCEPT R21.6 which is ready now.

- [ ] R21.1 dropVCard — test marker
- [ ] R21.2 renderNameOnConnect — test marker
- [ ] R21.3 registerSymlink — test marker
- [ ] R21.4 resolveOrEnroll — test marker
- [ ] R21.5 mintAndLink (Email) — test marker
- [ ] **R21.6 mintAndLink (Phone) — test marker — READY NOW (Impl already credits)**
- [ ] R21.7 mintAndVerifyAsync — test marker
- [ ] R21.8 mintOrReuseShared — test marker
- [ ] R21.9 renderActionsFirst — test marker

---
## Verification (skill-expert, after expert+tester land)
1. `Chain scoreboard` det-3x — expect R21.1–9 to flip to COMPLETE (target 29/285).
2. `Chain lintMarkers` — expect 0 R21-tagged orphans + 0 R21 prefix-collisions (uuids re-minted).
3. Confirm gate-faithful: no Req credits with any hop still open.
</content>
</invoke>
