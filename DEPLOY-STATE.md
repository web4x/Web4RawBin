# ⚠️ SERVED-REF DIVERGENCE — READ BEFORE ANY DEPLOY OR `git checkout`

**The live prod server (prod.wo-da.de:4444, pane `server:0.2`) is SERVING branch
`hotfix/t40.1-checklist-band` (v0.8.140) — NOT `main`.** This is deliberate and temporary.

## Why (PO ruling B, robbin-po, 2026-08-29)
Ship Tron's **T40.1 checklist-band fix ALONE**, isolated from `main`. `main` is 30+ commits
ahead of the served base (v0.8.139, tag `6666ebb05`) and carries UNDEPLOYED, TESTER-GATED
work — notably **R37.24 inc-2** (detail-drawer elimination, DoD 4-6 not cleared). Deploying
`main` now would ship R37.24 **ungated onto Tron's primary surface** (the detail drawer).

## The branch
- Base: v0.8.139 (`6666ebb05`). Delta vs base = EXACTLY the checklist-band fix
  (`src/ts/scenario/task-policy.ts` + `src/ts/server/server.ts`) + the version bump. Nothing else.
- Serves: **v0.8.140**.

## DO NOT
- ❌ Do NOT `git checkout main` + restart/deploy until **R37.24 clears DoD 4-6**. That deploys ungated R37.24.
- ❌ Do NOT merge this branch back into `main` — the fix is ALREADY on `main` (commit `dc514665b`;
  cherry-picked here as `b00984bab`). A merge would DUPLICATE it.

## RETIRE TRIGGER
When R37.24 inc-2 clears DoD 4-6 (tester): deploy `main` (which already contains this fix) and
**DELETE this branch** (`git branch -D hotfix/t40.1-checklist-band`). The divergence ends there.

## Provenance note (self-correcting record)
The artifact commit `098880909` is titled *"deploy: build artifacts v0.8.139"* but the artifacts
ARE **v0.8.140** — `deploy.mjs` stamped its message from a `committedVersion()` read taken BEFORE
its own build stamped `package.json` (the bump was made via the Config unit only, without a
pre-build). **Content is correct** (v0.8.140 across config unit / package.json / sw.js / served,
verified four-way); only the commit *title* is mislabeled. History NOT rewritten (immutable);
corrected here and in the following commit message.

Owner: robbin-expert · Ruling: robbin-po (B) · 2026-08-29
