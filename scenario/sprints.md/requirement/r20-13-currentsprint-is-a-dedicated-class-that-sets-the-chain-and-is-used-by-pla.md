### R20.13: CurrentSprint is a dedicated class that sets the chain and is used by planner's skill as planning+driving tool.

<details><summary>Tron directive</summary>

> CurrentSprint = a DEDICATED typed CLASS in the trace model (Object.verb pattern). It is MAINTAINED (kept current with the active WIP=1 work). It SETS THE CHAIN = defines the active narrow chain (req→uc→class→method→impl→test) for the current task. The PLANNER'S SKILL uses it as BOTH: (a) a PLANNING tool (define/set which chain is active — planner.setCurrentChain), and (b) a DRIVING tool (drive that chain across roles to delivery — planner.advanceChain). Methods: setChain(req,task), pinCurrent(), advance(), getActiveChain(). The class is a scenario unit (ior:class:CurrentSprint) maintained in the index.

</details>

## Traceability

**Tasks:**
- [🔗 T-current-sprint-planner-skill: planner SKILL maintains + drives the WIP=1 chain via the CurrentSprint class (R20.13)](../task/current-sprint-planner-skill.md)
