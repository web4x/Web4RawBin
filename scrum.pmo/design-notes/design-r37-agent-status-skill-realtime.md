# Agent-facing realtime task-status SKILL — design (robbin-skill-expert, 2026-08-17)

**Tron (verbatim):** "we need SKILLS that the AGENTS USE IN THEIR ROLES to IN REALTIME switch the TASK STATUS and the CURRENT AND NEXT TASK in the view MVC" + "if they use it via the skill it still needs to notify the BROWSER via WEBSOCKETS to update the views."

**Acceptance (Tron-facing, pixel @390, NOT file-visible):** an AGENT runs the skill FROM ITS PANE while a browser sits open @390 → the ITEM view + DETAIL view + CURRENT/NEXT pin visibly change with **NO reload**. Proof = pixel screenshot, never a DOM count, never "the file changed."

## The one hard truth that decides the implementation
A skill runs in an AGENT PANE = a **separate process** from the server. The WS emit (`UNIT_CHANGED`, server.ts:1791) lives in the **running server process**. Therefore **a filesystem/index write in the skill's own process can NEVER notify a browser** — that is exactly why "agents edit files + commit" left the board stale. A direct-writing skill = bypassing write-site #16.

⇒ **The skill MUST NOT write the store in its own process. It goes THROUGH THE SERVER.**

```
agent pane → skill (CLI/otmux) → HTTP POST to running server
  → UnitController.apply  (validate → apply → persist → EMIT)   [unit-controller.ts:32]
  → emit publish = viewBus.emitUnitChanged → wsClients UNIT_CHANGED broadcast
  → browser: item view + detail view + current/next pin RE-RENDER (R37.12 subscribeOnRender), no reload
```
One write path, no second writer → satisfies the slice-1 no-write-outside-the-seam lint (MvcBoundaryGuard.assertControllerDominates) **BY CONSTRUCTION**. No allow-list exception requested.

## Seam facts (measured)
- `UnitController.apply(idx, ior, uuid, intent, {actor, publish})` = the SOLE mutation entry (unit-controller.ts:32). `statusNext(idx, taskUuid, {actor, target, publish})` = thin Task façade (task-policy.ts:72).
- `TaskPolicy` (Policy #1): status is **derived** from `statusChecklist` via `deriveStatusEnum`; `apply` ticks the next box. Legal advance = cur→cur+1 ONLY. Evidence-gated: In Progress→QA Review needs `implementing`; **QA Review→Done needs `testing` AND `approvedBy` (Tron's R40.10 verdict).** ⇒ **a skill structurally CANNOT reach Done** (correct-by-construction: Done stays Tron's act).
- CURRENT/NEXT = **R40.18 derivation**, recompute-on-read (`CurrentSprint.getThreeSlots`/`slotsFrom(resolveSprintPin)`). A QA-Review flip drops the task out of *current* and next advances **BY DERIVATION**. ⇒ the skill sets **STATUS ONLY**; it **never writes a pin** (pin-write = the two-source disease).

## Endpoint (NEW — coordinate with expert's slice-1; land ON the seam, no parallel path)
`POST /api/task/<uuid>/status`  body `{ "target": "In Progress" | "QA Review" | "Planned" }` (or `/advance` = next-legal).
- Handler = `statusNext(idx, uuid, { actor, target, publish: emitUnitChanged })` — routes through UnitController.apply. TaskPolicy enforces legal+evidence; Done is unreachable here (cap target to non-Done + policy refuses).
- Emits `UNIT_CHANGED` for the Task uuid (rides the EXISTING wsClients transport, exactly as R40.10:1791 / R40.17:1793 already do — no new transport).
- **Pin re-render coverage (coordination flag):** the pin is derived from task statuses, so the client's pin/trace view must re-derive on this `UNIT_CHANGED`. Confirm R37.12 `subscribeOnRender` scope re-fetches the pin (or emit an additional `CurrentSprint` UNIT_CHANGED). Needed so current/next VISIBLY change — architect/expert to confirm the subscribe scope.
- Sibling to R40.10 (`/api/task/<uuid>/{approve,decline}`, server.ts:1734) — same family, different auth (below).

## ★ Auth path for an agent-side caller (the distinguishing problem)
R40.10 + R40.17 are **owner-gated** (`requireOwnerHttp`, only Tron). Status-advance (Planned/In-Progress/QA-Review) is **agent role-work**, NOT an owner act → must NOT be owner-gated, but must NOT be open to any browser either.
- **Proposal:** `X-Agent-Token` header, checked against a secret in `chmod-600 /var/dev/security-local/` (per the no-secret-values rule: the skill READS the token from that file, NEVER embeds/logs/commits it), + localhost-origin binding (agents run on the same host as the server on WODA.prod) as defense-in-depth.
- Distinct from owner auth (Tron's Done verdict / pin designation stay owner-only). Agent-token = "a fleet role agent doing its own status work."
- Open question for architect: single shared fleet-agent token vs per-agent identity (actor attribution). Recommend start = single shared token in security-local (simplest, satisfies acceptance), add per-agent actor header later for attribution.

## The SKILL (role-facing, my OOSH lane — Object.verb, Tab-completable)
OOSH external script `taskStatus` (canonical dispatch, per-method completion):
- `taskStatus advance <taskUuid>` — advance to next legal state.
- `taskStatus set <taskUuid> <status>` — set named target (validated legal-next; never Done).
- Impl = `curl` POST to `http://localhost:<PORT>/api/task/<uuid>/status` with `X-Agent-Token` (read from security-local) + `{target}`; parse JSON; report new status + derived current/next from the response. **Never touches the index** → lint-clean by construction.

## Dependencies / coordination (scenario-first — do NOT front-run)
- **Planner:** minting the S37 TASK unit for this now — I design against the chain, coordinate, don't front-run.
- **Expert:** owns slice-1 (the seam / mvc.applyMutation). The status ENDPOINT lands ON that seam (route through UnitController.apply). Coordinate: expert adds it, or I add it on their seam — no parallel path.
- **Architect:** wires/backstops; confirms MvcBoundaryGuard lint covers my writer + the pin-re-render subscribe scope + the agent-auth ruling.
- **Me (skill-expert):** the role-facing OOSH skill + the endpoint (on the seam) + agent-auth wiring, gated by pixel-@390 acceptance.
