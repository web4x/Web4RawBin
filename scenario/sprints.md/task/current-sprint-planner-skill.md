# T-current-sprint-planner-skill: planner SKILL maintains + drives the WIP=1 chain via the CurrentSprint class (R20.13)
[task:uuid:15aeb43d-83da-4a02-bfcf-35ec59b3b070]

## Status

[object Object]

## Traceability

**UseCases:**
- [🔗 currentSprint.setChain](../usecase/currentsprint-setchain.md)
- [🔗 currentSprint.pinCurrent](../usecase/currentsprint-pincurrent.md)
- [🔗 currentSprint.advance](../usecase/currentsprint-advance.md)
- [🔗 currentSprint.getActiveChain](../usecase/currentsprint-getactivechain.md)


## Task Description

R20.13 (Tron directive): the current sprint is a DEDICATED, MAINTAINED CurrentSprint class (architect 43d570be: setChain/pinCurrent/advance/getActiveChain) that SETS THE CHAIN, consumed by the PLANNER's SKILL as the core planning + driving instrument (replaces ad-hoc planning-doc driving). Planner skill layers driveNext (derive each role's next-action from the OPEN node) + status (board state) + a champagne det-3x gate before advance, ON TOP of the class API. setChain populates the WIP=1 req->UC->Class->Method->Impl->Test chain; getActiveChain reads it (ordered Req->Test array); advance drives focus to the next hop after genuine-champagne + Tron-QA; pinCurrent feeds the R20.12 /trace pin-row. WIP=1 becomes class-enforced, not convention. The 6-item queue migrates into CurrentSprint advance-order. Event 'current-sprint-changed' on document.

## Subtasks


