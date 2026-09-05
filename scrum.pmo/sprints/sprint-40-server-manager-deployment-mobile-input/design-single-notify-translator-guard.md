# Guard: exactly ONE unit-changed→notify translator (architect design, 2026-09-05)

PO-queued after 0.8.178. Converts the R40.84-B 4-round hunt into a **cannot-recur** defect. Scenario-first: req mints the req+UC; I design the guard; tester gates + self-stubs; trainer canonizes. Same shape as the R31.7 no-flush guard + my children-single-owner guard (`9ef91a551`) / R40.88.

## Root it kills
R40.84-B took 4 rounds because a SECOND unit-changed→notify translator (RawBinClient:113) had DRIFTED from the canonical one (live-bridge `notifyUnitChanged`): it keyed a synthetic ref with the OBJECT form `viewBusKey({type,uuid})` = `folder:roomcoll:<id>:files` while the tree subscribes STRING form `roomcoll:<id>:files` → notify hit no subscriber. Duplicate impl that drifted = a traceability defect (Tron's law: the graph exists to make ONE canonical thing). FIX-1 deleted the duplicate; this guard makes a THIRD one impossible.

## The HAZARD (scan the hazard, not the actors) — precisely scoped
The dangerous OPERATION is **translating an incoming `unit-changed` WS frame into a ViewBus notify key**. That is the drift-prone site, and it must have EXACTLY ONE owner: `notifyUnitChanged` (live-bridge.ts).

**NOT the hazard (must NOT be flagged):** the many legitimate `ViewBus.notify(viewBusKey(...))` sites that are LOCAL emits after a known local action or graph mutation — `universal-actions.ts` acting-tab emits (:199/224/246/276/308), `trace/index.ts` graph-mutation (:100-101), `ViewBus.ts:22`. These do not read a WS `unit-changed` frame; they use the canonical builder correctly for a local re-render. The hazard is specifically the WS-frame→key translation.

**Self-naming signature:** a site that matches the WS message-type literal `'unit-changed'` (i.e. `msg.type === 'unit-changed'`) AND builds a notify key INLINE (calls `viewBusKey(...)` / `ViewBus.notify(...)` in that branch) instead of DELEGATING to `notifyUnitChanged`. The literal `'unit-changed'` names the hazard; no discovery mechanism needed. (RawBinClient:115 now MATCHES `'unit-changed'` but DELEGATES `notifyUnitChanged(msg)` → compliant by construction.)

## The check — `check:one-unit-changed-translator` (glob-discovery, R40.82/R40.88 shape)
Walk `src/public/ts` (glob, dist excluded). For each site matching the WS-frame test `=== 'unit-changed'` (or `msg.type === "unit-changed"`):
- **OWNER** = `notifyUnitChanged` in `live-bridge.ts` (marked, e.g. `unit-changed-translator-owner`). Exactly ONE.
- A matching site is COMPLIANT iff it is the owner OR its body DELEGATES to `notifyUnitChanged(` (does not itself call `viewBusKey`/`ViewBus.notify` on the frame).
- **VIOLATION** = a site matching `'unit-changed'` that builds the key inline (`viewBusKey`/`ViewBus.notify` in the same handler, not via `notifyUnitChanged`).
**NAMED MEASURED COUNTS (PO req-2 — "zero" must be a measured number, not a vibe), the check PRINTS and ASSERTS all three:**
- `translatorOwnerCount === 1` — exactly ONE owner (`notifyUnitChanged` in live-bridge.ts). 0 = the owner was renamed/deleted (RED, fail-closed, never vacuous-green); ≥2 = two owners (RED).
- `inlineNonOwnerTranslators === 0` — sites matching `'unit-changed'` that build the key inline instead of delegating. This is the R40.84-B hazard count.
- `unitChangedMatchSites` (informational) — total sites matching the WS-frame literal; each must be owner-or-delegate. Reported so the number is auditable, not asserted.
GREEN iff `translatorOwnerCount === 1 && inlineNonOwnerTranslators === 0`, reached by ROUTING (delegate), never by exempting.

**Guard-on-the-guard (carry R40.82):** 0 by ROUTING not exempting; architect-only EXEMPT list (reason+approvedBy), reported as a SEPARATE number, never folded into 0. The owner is exactly ONE file/function; two owners = RED.

## Failability (stub-must-fail) — PO req-1: prove RED by a REAL violation + SELF-BITES EACH RUN
- **★ BUILT-IN PER-RUN SELFTEST (not just "passes today"):** the check has a `--selftest` mode (run in `ci:gates` before/with the real scan, same pattern as `check-boot-currency.ts` SELFTEST): it takes the real source in memory, INJECTS a synthetic violation (an inline `if (m.type === 'unit-changed') ViewBus.notify(viewBusKey({type:'x',uuid:m.uuid}))` string appended to a scratch copy), runs the detector, and ASSERTS the detector reports `inlineNonOwnerTranslators >= 1` (RED). If the seeded violation is NOT caught → the SELFTEST fails the build. This proves EACH RUN that the guard can still fail — a guard that silently stopped detecting (regex rot, refactor) fails its own selftest, so it can never degrade to a green rubber-stamp.
- **Manual stub (tester acceptance):** add a real 2nd inline translator in a scratch file → RED; remove → GREEN.
- **Proven-catches-the-original:** against the pre-FIX-1 tree (RawBinClient:113 inline object-form) → RED (`inlineNonOwnerTranslators===1`); against HEAD 0.8.178 (RawBinClient delegates) → GREEN (`ownerCount===1, inline===0`). It would have caught R40.84-B day-one.

## Why this is the right guard (not a key-equality assert)
The bug was NOT "a wrong key" per se — it was TWO builders of the same key that drifted. Asserting key-equality at runtime can't catch a compile-time duplicate. The by-construction cure is STRUCTURAL: one translation site. Any second site is the hazard, regardless of whether its key currently happens to match. (Same reasoning as R31.7: guard the single-owner construction, not a downstream value.)

## Handoff
req mints req + UC `notifyTranslator.singleOwner` (Object.verb). I wire UC→Class (e.g. `TransportBusBridge`)→Method→Impl (`scripts/check-one-unit-changed-translator.ts`) + add to `ci:gates`. Tester gates + self-stub GREEN. Trainer canonizes. Marker-sanctioned, filename-independent. No chokepoint.
