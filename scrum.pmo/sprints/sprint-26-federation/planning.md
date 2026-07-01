# Sprint 26 — RawBin Federation — Planning

**Source:** Tron 2026-07-01 + architect design (scrum.pmo/design-notes/federated-scenario-transfer.md (architect 7e940cf81)). **Requirements:** [requirements.md](./requirements.md)

## Sprint Goal

The beginning of inter-server scenario exchange: dragging an item between two RawBin servers TRANSFERS the scenario unit (the receiver recreates it locally with provenance + unitLinks), instead of just making a WebItem pointing at the source URL. Principle throughout: STRUCTURE eager, PAYLOAD lazy, IDENTITY by-reference.

## Use Case Placeholders (architect to refine)

| Anchor | UseCase (Object.verb) | UC placeholder UUID | Covers | Class |
|--------|----------------------|---------------------|--------|-------|
| <a id="uc26-1"></a>UC26.1 | ior.federatedOrigin | 9b4a8c02-a913-45e9-b984-640defa70b33 | R26.1 | IOR / resolver |
| <a id="uc26-2"></a>UC26.2 | dnd.federatedReference | 13ce665c-0f13-4d1e-8d7d-1818f1e80ee1 | R26.2 | DropDispatcher |
| <a id="uc26-3"></a>UC26.3 | federation.scenarioFetchApi | e205f1b0-7e8f-4b52-932c-dc9ae2350ef6 | R26.3 | server |
| <a id="uc26-4"></a>UC26.4 | federation.lazyChildResolve | 67859edd-c0a6-4cb0-8834-4d11c50e7ec1 | R26.4 | Transfer |
| <a id="uc26-5"></a>UC26.5 | federation.conflictReconcile | 1f097e01-7d45-4e8c-b403-5a5ff5f0bfe6 | R26.5 | Transfer |

## Open design decisions (architect — flag before task-build)

- **Inline-vs-lazy threshold** (R26.2/R26.4): what size/type inlines full JSON in the ref vs reference+fetch (URL WebItem inline; File lazy) — pick the boundary.
- **Auth tiers** (R26.3): capability-grant (ad-hoc DnD) vs per-server-keypair+trust-list (standing federation) — both specced; confirm the server-identity keypair extends the existing user/device RSA model.
- **updatedAt/version field** (R26.5): reconcile-if-newer needs a comparable version on units — does one exist, or add it?
- **Reference-rewrite remap** (R26.5): the import remap pass mirrors the company mint-new-on-conflict shape — confirm reuse.
- **R25.7 tie-in** (R26.4): foreign room members stay by-reference; materialize only on connect+consolidate via R25.7 redirectTo — do NOT mint foreign identities (would re-create the R25.7 duplication).

## Coordination

- Architect: refine 5 UC placeholders -> real UseCases (ior.federatedOrigin / dnd.federatedReference / federation.scenarioFetchApi / federation.lazyChildResolve / federation.conflictReconcile) + wire Class->Method->Impl->Test (design-ahead).
- Planner: build T26.1-T26.5 after UC refine (scenario-first pipeline).

## Definition of Done (Strict Verify Bar)

- A drag between two RawBin servers recreates the unit locally with originHost/originIor provenance + intact unitLinks; room members stay federated references (no local mint).
- Server-to-server fetch is auth'd (capability or signature), rate-limited, audit-logged; JSON validated + size-capped, never executed.

---

*Planned by robbin-req 2026-07-01. Sprint 26 — RawBin Federation.*
