### R20.13.A: Always-visible realtime view of the current task's full chain — status + assignee per hop, live-updated by planner skill.

<details><summary>Tron directive</summary>

> The app MUST show an ALWAYS-VISIBLE, ALWAYS-EXPANDED tree-chain of the CURRENT TASK — the SAME task-tree-chain renderer already used in /trace (Sprint→Task→Req→UC→Class→Method→Impl→Test), REUSED (DRY, not a new widget), driven by CurrentSprint.getActiveChain(). Always-expanded: the pinned current-task shows its FULL chain tree (not collapsed). Realtime: current-sprint-changed event → re-render the tree. Per-hop status (done/active/pending) + assignee (role). Actualized by planner skill (setChain/advance/reassign update the data, tree reflects live). NOT a new component — the same rb-trace-tree task-chain rendering, always for the current task.

</details>