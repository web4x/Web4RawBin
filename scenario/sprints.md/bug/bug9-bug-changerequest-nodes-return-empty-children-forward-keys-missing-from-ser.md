### BUG9: Bug/ChangeRequest nodes return empty children — forward keys missing from server

<details><summary>Tron directive</summary>

> server.ts SCENARIO_FWD + TRACE_FWD + EXPECTED_CHILD_TYPE have no Bug/ChangeRequest entries. /api/trace/children returns children:[] for Bug-type units even though useCases[] is populated. Fix: add Bug/ChangeRequest entries identical to Requirement.

</details>

## Traceability

**UseCases:**
- [🔗 traceChildren.bugForwardKeys](../usecase/tracechildren-bugforwardkeys.md)
