# R37.11 slice-1 — DECIDED routing list (expert classification, architect-CONFIRMED 034109f51)

FOUNDATION IN (committed): seam 3c15eabd0 (create()+_write) · apply default-merge 075273c97 (ruling A, guarded, INTERNAL-only) · lint b5c0e35d8 (check-mutation-seam.ts, report-only). This file = the decided per-site plan for the ROUTING (the expensive part). Marker **e3729f51** lands only when routing+lint are coherent. Per-site **INV-T byte-diff==0**.

## ★ RE-DERIVE LINE NUMBERS FIRST — they SHIFT
The lint's line#s go stale (server.ts moved between runs). Before editing: `npm run check:mutation-seam` for the CURRENT bypasser list, then match by the surrounding CODE (`idx.put(CU,…)`), not the number.

## STEP 0 — server publish wiring (prereq for every server route)
Add in server.ts: `const publishUnitChanged = (ior, uuid) => wsClients.forEach(c => { if (c.ws.readyState === 1) c.ws.send(JSON.stringify({ type: 'unit-changed', ior, uuid })); });` (generalize the EXISTING ad-hoc CurrentSprint broadcast). `import { UnitController } from '../scenario/unit-controller.js'`. Pass `{ publish: publishUnitChanged }` to every routed call. (Client receive→ViewBus.emit is SLICE-2, not here.)

## ROUTE-THROUGH ≈16 (get?apply:create; mutate→apply(intent) / new→create(unit); {publish})
1. ★ **CurrentSprint FIRST (Tron's named pin defect)** — the RUNTIME pin-update handler in server.ts (`idx.put(CU, {ior:'ior:class:CurrentSprint', model:m …})` + its ad-hoc `unit-changed` broadcast → REPLACE the broadcast with the routed emit). Architect verified these persist INPUT/designation only (derived current/next are recompute-on-read) → L1-clean. Also CurrentSprint.ts persist()/×3 (139/394/397) if reached at runtime (thread publish or route at the server caller).
2. server.ts profile upserts (was 281/296/355/375) — get?apply:create.
3. server.ts federation-import (was 530) — create (imported unit) or apply if reconcile-existing.
4. server.ts task (was 1400/1415) — apply (Task has FSM policy) ; ChangeRequest (was 1411) — create (new randomUUID).
5. agent-message.ts (54 new / 63 task-update / 88 new) — create/apply.
6. WebItem.ts:117 · file-unit.ts:100 · message-unit.ts:34,41 — create (new units, must appear live).
7. ★ *-Index PRIMARY sides — SPLIT each: the profile/company-side put (e.g. EmailIndex profile-put, server.ts mintOrReuseShared) = PRIMARY mutate → ROUTE; the index-unit-side put = EXEMPT (below).

## DECLARED EXCEPTIONS ≈27 (allow-list in check-mutation-seam.ts, per-site REASON; architect audits honesty)
- **Derived-index UNIT-side puts** (Address/Company/Phone/Email *-Index, the index-unit put only): reason = **MEASURED no view subscribes to any *-Index unit** (grep of trace+public views EMPTY) → an index write can never stale a view. NOT "primary always emits". Split per site — only the index-unit put is exempt.
- **Mint/generator** (skills.ts, skill-classes.ts, class-mint.ts, classes.ts RawBin-system-user seed): reason = **MEASURED CLI/generate-only** — imported ONLY by scripts/ (trace-req, migrate, objectVerb, chain-wire, repair, team-velocity, po-chain-follow-up), NOT by server.ts. RESIDUAL: a future runtime skill endpoint MUST route (tripwire b).
- index-store.ts / unit-controller.ts: exempt BY DEFINITION (the primitive + the seam).

## LINT TRIPWIRES (architect) to add before --strict
(a) an exempt site with NO declared reason → RED; (b) an exempt mint/index module ever imported by a server request-handler → re-audit flag. Burden of proof on the exception; anything unjustifiable → route-through by default.

## FINISH
Route all ≈16 → declare the ≈27 exceptions with reasons → re-run lint (0 un-allowed) → flip to **--strict** + wire into ci:gates → place **e3729f51** adjacent-above the routing/lint decl (full-uuid, strict-AST next-named) → ping req (strict-AST-flip + bypass-lint Test) → INV-T byte-diff==0 verified per site. Architect mints a create Method+Impl for UnitController.create.
