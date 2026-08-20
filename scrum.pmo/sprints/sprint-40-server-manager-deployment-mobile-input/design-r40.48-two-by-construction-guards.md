# Two by-construction guards — shared-tree sweep (R40.48) + two-source sprint dirs — architect design (2026-08-20)

PO handed both as by-construction problems (reminders have failed). Design-only.

## FINDING 1 — shared-tree contamination (R40.48, 4th instance, self-caught 2edf66a72)
A broad `git add scenario/index` / `-A` in the SHARED working tree sweeps peers' un-verified WIP into the committer's commit. 4 instances (peer-board / planner-units / 0.8.117 / my 2edf66a72). It landed valid only by luck; a fresh unverified re-home would have been laundered into a committed artifact. "explicit paths, never -A" is REMEMBERED, not enforced — so it keeps failing.

### The design constraint
A `pre-commit` hook cannot see *how* files were staged — `git add -A` and explicit adds produce an identical staged set. So the guard cannot be "detect -A"; it must be **"the staged set must equal what the committer EXPLICITLY declared."** Intent must be declared where it exists (at add/commit time), and the hook enforces staged ⊆ declared.

### GUARD (by-construction, two layers)
1. **Sanctioned stage + pre-commit enforcement (ship first):**
   - A tiny `rbadd <explicit-file>…` wrapper that REFUSES a directory arg, `.`, `-A`, `-u`, or a glob that expands to a dir; it stages only named files and appends them to a per-agent manifest `.git/rb-staged`.
   - A **`pre-commit` hook** computes `git diff --cached --name-only` and **REJECTS (exit 1)** if the staged set is NOT ⊆ the `.git/rb-staged` manifest — i.e. **any file staged that the committer did not explicitly name → RED, commit blocked.** Clears the manifest on success.
   - ⇒ `git add scenario/index` (broad) now cannot reach a commit: it stages files absent from the manifest → hook rejects. Explicit-paths becomes **impossible to violate**, not remembered. Registered in the same place as the other CI gates.
   - **stub-must-fail:** stage a file the committer did NOT name (simulate a peer's WIP swept in) → pre-commit goes RED. Proves the guard bites.
2. **★ Ultimate (recommend as the real fix): per-agent git WORKTREES.** Each agent commits in its OWN worktree; a broad add can only touch that agent's own changes — there is NO peer WIP present in the worktree to sweep. This ELIMINATES the family by construction (isolation) rather than guarding each commit. Layer 1 is the interim while worktrees are stood up. (Ref: worktree isolation, [[cp-a-hardlink-writes-through-to-live]].)

## FINDING 2 — two-source sprint DIRS (DRY disease, same family as /trace-vs-/model)
**Root (measured):** two conventions for one sprint's directory —
- **CANONICAL (tracked, git history, everything references it):** `scrum.pmo/sprints/sprint-0N-<slug>/` (e.g. `sprint-05-encrypted-storage/`).
- **STRAY (generated, untracked, 16 of them):** `scrum.pmo/sprints/<slug>/` slug-only (e.g. `encrypted-storage/`), carrying the generated-from-scenario header.
The stray path comes from consumers using the Sprint unit's **slug-only** `model.slug` (or `slugify(name)`) as the dir: `server.ts:1416` `taskMdHref = /md/scrum.pmo/sprints/${sprintSlug}/…` (sprintSlug = `model.slug`), and `check-sprint-slug-dir.ts` (the guard!) resolves `SPRINTS_DIR/<effectiveSlug>` = the slug-only path — so the guard currently BLESSES the stray convention instead of the canonical one. A regen (generate-sprint-md / the R40.50 generator work) then materialises `sprints/<slug>/`.

### GUARD (by-construction — ONE canonical dir resolver, same pattern as R40.50's one comparator)
- **Export ONE `sprintDirOf(sprintUnit): 'sprint-0N-<slug>'`** (next to `sprintNumOf`/`bySprintDisplayOrder` in the sprint-pin-resolver/sprint-label home) that returns the **tracked** `sprint-<zero-padded-number>-<slug>` path — derived from `sprintNumOf` + slug. It is the single source for "which directory is this sprint's."
- **Route EVERY consumer through it:** the MD generator(s), `server.ts:1416` `taskMdHref`, and — critically — `check-sprint-slug-dir.ts` (the guard must verify the **canonical** `sprint-0N-<slug>/` exists, not the slug-only path). The slug-only emission STOPS because no consumer builds `sprints/<model.slug>/` anymore.
- **stub-must-fail (invariant, not value):** a consumer that builds a sprint dir path WITHOUT `sprintDirOf` (e.g. raw `sprints/${model.slug}`) → grep-lint RED. Same invariant-gate lesson as R40.50 (assert the shared source is used, not just that one path renders right).
- **Meanwhile:** nobody commits the 16 stray `sprints/<slug>/` dirs (they are the duplicate); once the resolver lands + regen re-emits to the canonical dir, the strays are deleted (own commit).

## Both findings are the SAME lesson twice
A convention enforced by REMINDER (explicit-paths) or applied at the SURFACE (per-consumer slug) drifts into two sources. The fix each time: make the right thing the ONLY reachable thing — a hook that rejects undeclared stages; a single dir-resolver every consumer inherits. Reminders and per-site copies are what failed.
