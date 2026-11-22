# Deploy state — READ BEFORE ANY DEPLOY, `git checkout`, OR BRANCH DELETE

## Since 2026-11-22 (Sprint 42, T42.2, TRON's decision): `main` IS the prod line
- `main` was moved to the head of `hotfix/t40.1-checklist-band` (471f0d5ee, all Sprint 42 PRs #2–#8 merged).
  The two branches point at the same commit. **New work branches from `main` and is merged into `main` by PR.**
- The old orphan `main` (root c7924287f, snapshot of v0.8.139 + 49 planning-only commits) is kept as
  `archive/main-orphan`. Do not merge it anywhere.
- CI (`.github/workflows/ci.yml`) runs build, unit and e2e on every PR and on pushes to `main`.

## Prod
- prod.wo-da.de:4444 still serves the checkout of `hotfix/t40.1-checklist-band` at **v0.8.247** (older than
  `main`'s head: the Sprint 42 merges are not deployed).
- Switching prod to `main` is a deploy step for TRON / the robbinTeam: on the prod box, `git fetch` then
  `git checkout main` (it contains every commit of the hotfix line) and run the normal deploy.

## DO NOT
- ❌ Do NOT delete `hotfix/t40.1-checklist-band` until prod has been switched to `main`.
- ❌ Do NOT push to `hotfix/t40.1-checklist-band` any more; it would split the line again.
- ❌ Do NOT force-push `main` (needs TRON's explicit go). Branch protection for `main` (PR + CI required,
  no force-push) still has to be enabled by a repo admin.

## History (kept)
Until 2026-11-22 prod served the hotfix branch while `main` was a re-rooted orphan without the shipped work
(live-MVC tree v0.8.143, RCE owner-credential closure 87a3e4134). The robbin-po ruling of 2026-08-29 was
"merge hotfix INTO main, never delete it"; T42.2 completed that by making `main` the hotfix line itself.
The artifact commit `098880909` is titled "deploy: build artifacts v0.8.139" but contains v0.8.140 (stamp
read before the build bumped package.json); content correct, history not rewritten.
