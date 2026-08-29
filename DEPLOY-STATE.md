# ⚠️ SERVED-REF DIVERGENCE — READ BEFORE ANY DEPLOY, `git checkout`, OR BRANCH DELETE

**The live prod server (prod.wo-da.de:4444, pane `server:0.2`) is SERVING branch
`hotfix/t40.1-checklist-band` (v0.8.143) — NOT `main`.** This is deliberate and temporary.

## ★ CORRECTED 2026-08-29 late (robbin-expert, per robbin-po + planner flag) — the prior "delete this branch" was a REVOKED-DIRECTIVE landmine
The earlier version of this file (written when the branch held ONLY the cherry-picked band fix
`b00984bab`) said the fix was already on `main` and the branch should be **DELETED**. **That is now
FALSE and DANGEROUS.** MEASURED (`git merge-base --is-ancestor` + `origin/main..HEAD`): the branch
now carries **14 commits UNIQUE to hotfix, NOT on `main`**, including:
- **`3fb338004` — the SHIPPED DEPLOY of the R37.24 live-MVC traceability tree (v0.8.143)** — hotfix-only.
- **`87a3e4134` (+ deploy `52547b90d`) — the RCE owner-credential closure** — hotfix-only.

A fresh agent obeying "DELETE this branch" would **LOSE the deployed live-MVC tree AND the RCE fix.**

## The branch
- Base: v0.8.139 (`6666ebb05`). It has since GAINED the merge of `main`'s R37.24 live-MVC work, the
  v0.8.143 deploy, and the RCE closure — **14 commits `origin/main` does not have.**
- Serves: **v0.8.143.**

## DO NOT
- ❌ Do NOT `git checkout main` + restart/deploy. `main` is **BEHIND** this branch — it lacks the
  v0.8.143 live-MVC deploy AND the RCE closure. Deploying `main` now would **REGRESS prod** (un-ship
  both). (This inverts the old reason: it is no longer "main is ahead with ungated work" — it is
  "main is behind, missing shipped work".)
- ❌ Do NOT DELETE this branch. It holds 14 unique commits of shipped, Tron-facing work.
- ❌ Do NOT merge `hotfix → main` YET — see the sequencing below.

## RETIRE / MERGE PLAN (PO ruling, robbin-po 2026-08-29 late — SUPERSEDES the old delete-trigger)
- Direction is **merge `hotfix/t40.1-checklist-band` INTO `main`** (NOT delete, NOT duplicate — the
  "already on main / would duplicate" note applied only to the old cherry-pick-only state).
- **Merge is PENDING and HELD until the live-MVC tree actually WORKS on Tron's device** (fact-1 +
  fact-2 clear on his real iOS). PO ruling: **repo surgery mid-live-defect blinds a future bisect** —
  keep the branch topology stable while the live-MVC defects are open.
- The old **"delete this branch" retire-trigger is SUPERSEDED** (it would destroy unique shipped work).

## Provenance note (self-correcting record, retained)
The artifact commit `098880909` is titled *"deploy: build artifacts v0.8.139"* but the artifacts
ARE **v0.8.140** — `deploy.mjs` stamped its message from a `committedVersion()` read taken BEFORE
its own build stamped `package.json` (the bump was made via the Config unit only, without a
pre-build). **Content is correct** (verified four-way at the time); only the commit *title* is
mislabeled. History NOT rewritten (immutable); corrected here.

Owner: robbin-expert · Rulings: robbin-po (B, then merge-hold) · 2026-08-29
