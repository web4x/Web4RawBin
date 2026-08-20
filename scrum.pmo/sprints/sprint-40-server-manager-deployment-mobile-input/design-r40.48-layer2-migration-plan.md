# R40.48 Layer-2 — worktree MIGRATION PLAN (execute-ready, hold until live-MVC defects close) — architect, 2026-08-20

Tron AUTHORIZED Layer-2 with sequencing: **Layer-1 ships now; fleet migrates to Layer-2 AFTER his live-MVC defects close.** Do NOT migrate while the duplicated drawer / stale icon are on his screen (changing every agent's boot+cwd mid-fix is the churn that would cost the fix). This plan is prepared NOW, executed the moment the defects close. **PO integration-owner ruling (open item 3): agents self-integrate when clean; a CONFLICT escalates to the PO** (a conflict = two agents touched one unit = a scope/ownership DELIVERY call, not a mechanical merge — NO standing merge-bot, which would re-hide the visible conflict).

## Scope — TWO shared trees, both affected
- **Primary: Web4RawBin** `/var/dev/Workspaces/web4x/Web4RawBin` (scenario/index + code) — where the contamination occurred.
- **Also: the session repo** `/var/dev/Workspaces/AI/Claude` (session/agents context) — same shared-tree/index race (agents commit context.md concurrently). Same fix; migrate it in the same pass per agent.

## (a) Per-agent boot/cwd changes — the FULL family (every committing agent, not a sample)
Committers to Web4RawBin = the **7 robbinTeam2 agents** + the recovery drivers. Each migrates identically:
| agent | pane | current cwd (shared) | after: worktree + branch |
|---|---|---|---|
| robbin-skill-expert | robbinTeam2:0.2 | Web4RawBin (shared) | wt-skill-expert / `agent/skill-expert` |
| robbin-req | 0.4 | shared | wt-req / `agent/req` |
| robbin-planner | 0.6 | shared | wt-planner / `agent/planner` |
| robbin-tester | 0.5 | shared | wt-tester / `agent/tester` |
| robbin-architect (me) | 0.3 | shared | wt-architect / `agent/architect` |
| robbin-expert | 0.1 | shared | wt-expert / `agent/expert` |
| robbin-po | 0.0 | shared | wt-po / `agent/po` |
| scrum-master | baseTeam:0.1 | shared | wt-sm / `agent/sm` |
| agent-trainer | baseTeam:0.0 | shared | wt-trainer / `agent/trainer` |
| ARON | Temple:0.0 | shared | wt-aron / `agent/aron` |
**Per-agent change set (uniform):** (1) `git worktree add /var/dev/Workspaces/web4x/wt-<agent> -b agent/<name>` (+ the analogous session-repo worktree); (2) the agent's boot.md + SKILL repo-path references updated from the shared path → its worktree path; (3) the agent's shell cwd re-pointed to its worktree. Out of scope: ooshTeam (different repo /root/oosh), server:0.3 (not a committer).

## (b) Integration flow (written down)
- Agent commits to `agent/<name>` in its own worktree (own index — no shared-index race).
- **Self-FF-when-clean:** the agent rebases `agent/<name>` onto `main` and fast-forwards `main` iff there is NO conflict. Clean (disjoint unit uuids — the common case) → main updates, server reads it live (data) / on restart (code).
- **Conflict STOPS and surfaces → escalate to PO** (PO ruling). The agent does NOT auto-resolve; it reports the conflicting unit + both sides to robbin-po, who makes the ownership/scope call. The conflict is VISIBLE by design.

## (c) ROLLBACK path — TESTED, not assumed
Rollback must return an agent to the shared tree WITHOUT losing committed OR uncommitted work:
- Committed work is in the shared `.git` object store (worktrees share it) → safe by construction; rollback = merge `agent/<name>` → `main`, then `git worktree remove wt-<agent>`, then re-point the agent cwd + boot to the shared `main` checkout.
- Uncommitted work in the worktree files → commit-or-stash it to `agent/<name>` BEFORE removing the worktree (never `worktree remove --force` with dirty files).
- **★ REHEARSAL (the "tested" requirement): the FIRST migrated agent is a round-trip proof** — migrate robbin-skill-expert (least-loaded), have it commit in its worktree, THEN roll it back to the shared tree, and VERIFY its commit survived on main + no file lost. Only after that round-trip passes do the rest migrate. Rollback is proven on a live agent, not assumed.

## (d) Migration ORDER — recovery drivers LAST
Least-loaded first (low risk + serves as the rehearsal); the recovery drivers LAST (they must stay able to DRIVE recovery while others migrate — if a driver breaks mid-migration, no one can recover the fleet):
1. **robbin-skill-expert** (least-loaded) — the migrate+rollback REHEARSAL.
2. robbin-req → robbin-planner → robbin-tester → robbin-architect → robbin-expert (the workers).
3. **robbin-po** (near-last — a driver but the migration coordinator).
4. **scrum-master → agent-trainer → ARON** (LAST — the recovery drivers; they stay on the shared tree, fully able to drive, until every worker is safely migrated and proven).
Each agent: migrate → commit-once in its worktree → verify self-FF to main works → then the next. Stop-the-line on any failure; the drivers (still on shared) recover it.

## Execution gate
Do NOT start until: (i) Tron's live-MVC defects are CLOSED (his screen clean), (ii) Layer-1 (rbadd + pre-commit) is shipped + running (the interim guard holds during migration), (iii) the skill-expert round-trip rehearsal (migrate+rollback) has PASSED. Then migrate in the (d) order, drivers last.
