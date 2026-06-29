# Sprint 24 — Traceability Skills — Planning

**Source:** PO main-goal 2026-06-29. **Requirements:** [requirements.md](./requirements.md)

## Sprint Goal

Formalize the existing scattered traceability + MD-planning TypeScript tools as ONE coherent Object.verb SKILL set (OOSH-for-TS per how-to-write-skills.md): pin management, chain scoring, sprint planning, and traceability audit - each a typed skill class whose signature generates CLI/help/completion/OOSH-wrapper/docs/Claude-SKILL.md, no hand-written flags.

## Use Case Placeholders

| Anchor | UseCase (Object.verb) | UC placeholder UUID | Covers |
|--------|----------------------|---------------------|--------|
| <a id="uc-sk1"></a>UC-SK.1 | skill.object-verb-skill | b77a3494-6b43-4956-bc7e-72485470a6d4 | R24.1 |
| <a id="uc-sk2"></a>UC-SK.2 | skill.pin-management-skill | 90f9bfe3-6d57-4003-be77-6ce8ade76058 | R24.2 |
| <a id="uc-sk3"></a>UC-SK.3 | skill.chain-scoring-skill | 4b66c336-c740-4cbf-b9b4-4cbee596fee1 | R24.3 |
| <a id="uc-sk4"></a>UC-SK.4 | skill.sprint-planning-skill | 4a606188-2812-42ef-9e13-f44e652ab4b0 | R24.4 |
| <a id="uc-sk5"></a>UC-SK.5 | skill.traceability-audit-skill | 099aa3ed-9e0b-44af-9333-938927f24b6f | R24.5 |

The architect refines these into real UseCase units on the skill classes (objectVerb / CurrentSprint / Chain / generate-sprint-md / trace-cli) and wires Class -> Method -> Implementation -> Test against the EXISTING code.

## Coordination

- **Planner** (robbinTeam2:0.6): drives planner-drive + generate-sprint-md every cycle - briefs per-tool behaviour; builds task units (S23 pipeline: mint->wire->generate->--check->commit).
- **Architect** (robbinTeam2:0.3): UC/Class/Method design + chain wiring against existing impl.
- **Skill-expert**: owns the chain tools (objectVerb / skill-classes Chain).

## Notes

- These tools EXIST; Sprint 24 is FORMALIZATION + chain-wiring, not greenfield build. ACs assert the Object.verb skill shape over the existing impl.
- markdown = VIEW (law #100); flags forbidden as skill surface (oosh-po rule).

## Definition of Done (Strict Verify Bar)

- Each skill class introspects cleanly via objectVerb (help/completion/OOSH/docs/Claude-SKILL generated).
- check:sprint-md + trace:audit:strict GREEN in ci:gates.

---

*Planned by robbin-req 2026-06-29. Sprint 24 — Traceability Skills.*
