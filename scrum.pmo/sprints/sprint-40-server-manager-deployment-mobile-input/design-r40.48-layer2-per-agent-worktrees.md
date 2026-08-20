# R40.48 Layer-2 — per-agent git worktrees (full design, DESIGN-NOT-SHIP) — architect, 2026-08-20

PO ruling: design fully, do NOT ship until Tron-awareness (it changes how every agent works). This is the ULTIMATE fix for the shared-tree family — Layer-1 (rbadd + pre-commit subset check) guards each commit; Layer-2 removes the shared surface so the failure is not possible.

## What it eliminates (the whole R40.48 family, by construction)
- **(i-iv) file-sweep:** a broad add sweeps peers' WIP — GONE: an agent's worktree contains ONLY its own changes; there is no peer WIP present to sweep.
- **(v) index-race (the one that bit me today — dropped 2 commits entirely):** two agents' `git add`/`commit` race on the ONE shared `.git` index — GONE: each worktree has its OWN index. Layer-1 cannot catch (v) (a lost commit leaves nothing to lint); only isolation does.

## Model
- **One bare/main repo + N per-agent worktrees.** `git worktree add ../wt-<agent> -b agent/<name>` — each agent's cwd is its own worktree on its own branch `agent/<name>`. Worktrees SHARE the `.git` object store (history is not duplicated → cheap); each has its OWN working files AND its OWN index (the two race surfaces removed).
- **Branch-per-agent is forced** (git refuses to check out the same branch in two worktrees) — which is exactly the property we want: no two agents share a working state.

## Commit + integration flow
- **Commit:** the agent commits to `agent/<name>` in its own worktree — only its own files, its own index. No peer interference possible.
- **Integrate to main (the new, CONTROLLED point):** agent commits reach `main` (what the server reads) via a merge/fast-forward step. Two viable policies:
  - **(a) self-integrate-when-clean:** after committing, the agent rebases `agent/<name>` onto `main` and fast-forwards `main` iff there is NO conflict; a conflict STOPS and surfaces (explicit resolve). Most scenario/index edits are disjoint (different unit uuids) → clean FF; the R40.50-useCases-style same-unit race becomes an explicit merge conflict (visible + resolvable) instead of a silent sweep or a lost commit.
  - **(b) coordinator-integrate:** a single integrator (SM/orchestrator) merges agent branches → main on a cadence. Serialises integration (no main-index contention) at the cost of latency.
  - Recommend **(a)** with **(b) as fallback** for conflict-heavy periods.
- **Server reads `main`.** DATA (scenario units) is read fresh → live once merged to main (no restart). CODE → merge to main + restart. So "commit → live" gains a merge-to-main hop — a CONTROLLED, VISIBLE integration point, vs today's commit-straight-into-shared-main immediacy.

## Conflicts become a FEATURE
Today, two agents touching one unit = a silent sweep (last-writer-wins, no signal) or a lost commit (index race). Under worktrees, that same case is an explicit **merge conflict** — surfaced, attributed, resolved. The failure mode changes from "silent data loss" to "visible conflict," which is the fail-loud property we want everywhere.

## Costs / tradeoffs (name them honestly for the Tron decision)
1. **Commit→live gains an integration step** — an agent's change is live only after merge-to-main. Slower than today's immediacy; the trade is zero silent-loss.
2. **Every agent's working model changes** — own worktree + branch; the `cwd` and the commit target move. A migration + a doc update for every role.
3. **Integration ownership** — who/what runs the merge-to-main (self-integrate vs coordinator) and resolves conflicts. New responsibility.
4. **Disk** — N working trees of scenario/index (~large); mitigated by the shared object store (history not duplicated). Real but bounded.
5. **The live prod server** must read the `main` worktree specifically; the restart/deploy path pins to main.

## Migration (incremental, reversible)
Stand up worktrees one agent at a time; `main` stays the integration + server-read target throughout. An agent not yet migrated keeps committing to main (Layer-1 guards it) until its worktree is up. No big-bang; roll back an agent to shared-main if needed.

## ★ TRON-AWARENESS ITEMS (PO raises these before ship)
The switch changes the FLEET's working model, so Tron must okay: (1) commit→live now has a merge-to-main hop (immediacy trade for zero silent-loss); (2) conflicts SURFACE as explicit merges (a visible behavior change); (3) an integration owner exists; (4) the migration touches every role's boot/cwd. Layer-1 ships NOW regardless (it needs no fleet change); Layer-2 waits on this okay. Recommendation: ship Layer-1, run it, and authorize Layer-2 once the residual Layer-1-uncatchable cases (the index-race sub-mode v) prove worth the workflow change — which today's dropped-commit already evidences.
