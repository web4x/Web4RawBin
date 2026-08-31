# PII History Scrub — DESIGN (architect, 2026-08-31, Tron-ruled privacy INCIDENT)

Tron ruled: scrub the remote history. Sequences BEFORE the reconcile (a reconcile would weave the PII through a merged history). Design-only; **nothing executes without PO go; pushes are FROZEN fleet-wide.** Authorized defensive/privacy work.

## Measured footprint (field-shape, NOT className — values never printed, [[never-write-secret-values]])
15 contact-shaped units on the hotfix tree (PO measured 20 on origin/main — the delta is main-only/history; the FIELD-SHAPE verification across all history is the authority, never a hand-count). ALL are `Profile` units carrying `phones`/`emails`/`addresses`, ALL with **`className:(none)`** (a Profile-class grep returns 0 = the PO's point). ≥1 confirmed real (`3effa1fc`, phones+emails, real consumer domain); 19 unclear = treated as real (PO rule).
**★ ALL 15 are REFERENCED (inbound 1–31; e.g. `8f74dfba`=31, `41ad88c4`=21, `05e58f81`=19 = the owner-auth profile).** ⇒ **DELETING the unit files would create dangling refs = the fail-closed-pin P0 we just fixed.** The scrub MUST **REDACT the PII VALUES in place, NOT delete the files.**

## (a) TOOL + SCOPE — REDACT (not delete), both branches + tags + all refs
- **`git filter-repo --replace-text`** (redacts blob content across ALL history; rewrites every ref/branch/tag by default). NOT `--path`-delete (would dangle 15 referenced units).
- **Redact by FIELD-SHAPE regex**, not by enumerating real values (avoids reading/handling PII): patterns for phone (`\+?\d[\d\s().-]{6,}`), email (`[\w.+-]+@[\w-]+\.[\w.-]+`), address lines — → `[REDACTED-PHONE]`/`[REDACTED-EMAIL]`/`[REDACTED-ADDR]`. **SCOPED to the PII field context** (values inside `phones`/`emails`/`addresses` arrays in scenario JSON) to avoid clobbering legit strings — proven by the dry-run diff touching ONLY those fields.
- **TWO redaction targets:** (1) the Profile unit files (field values); (2) DOCS carrying raw PII (e.g. the classification reports `216c962ad` `dirty-tree-classification-2026-08-31.md` — a raw phone in prose). The field-shape scan discovers both.
- SCOPE covers BOTH `main` and `hotfix` + ALL tags + ALL refs (filter-repo default). The units keep their uuids + structure → refs still resolve → NO dangling-ref cascade.

## (b) BACKUP FIRST, verifiable (a rewrite has no undo; ~37 files live peer WIP)
- **Sealed forensic backup:** `git clone --mirror origin` + `git bundle create pre-scrub-ALL.bundle --all`, stored OFF the rewrite path, ACCESS-CONTROLLED (it CONTAINS the PII — a privacy incident may need the original for audit, so keep it, secured, not on any working path, not pushed).
- **RESTORE TEST:** clone from the bundle → verify it reproduces the exact pre-scrub HEADs (both branches) before trusting it.
- **Peer WIP:** uncommitted WIP is NOT in history → filter-repo doesn't touch it; but the fleet re-sync (e) must preserve it — each agent bundles WIP FIRST (see e).

## (c) DRY-RUN on a scratch clone — prove clean + builds + serves before origin (Phase-A pattern)
On a SCRATCH clone (not origin, not any live tree): run filter-repo → then verify ALL of: (d) PII field-shape scan across all history = 0; `npm run build` GREEN (redact-not-delete → no structural break); boot the server → `/trace`+`/model` render; **R37.29 referential-integrity = 0 dangling** (units survived redacted, refs resolve); the 15 uuids still RESOLVE. NOTHING touches origin until all green.

## (d) VERIFICATION not self-referential (class-keyed would be wrong)
- **FIELD-SHAPE scan across ALL history:** `git rev-list --all | git cat-file` every blob → 0 phone/email/address-shape matches (NOT a className grep — `className:None` defeats it, as it defeated the planner's classification). This is the same scan-the-hazard-not-the-actors law.
- Confirm the specific confirmed-real value(s) (`3effa1fc`) absent from ALL history.
- Confirm the 15+ uuids still RESOLVE in the rewritten history (redacted, not dangling).

## (e) FORCE-PUSH + FLEET RE-SYNC — WIP MUST survive
1. PO freeze in effect. Force-push rewritten `main`+`hotfix`+tags to origin (after PO go, post-dry-run-green).
2. **Per agent, in order (least-loaded/idle FIRST, recovery-drivers LAST — the Layer-2 ordering; SERIAL round-trip: each verifies before the next, catch one broken not ten):**
   a. **BUNDLE uncommitted WIP FIRST** — `git stash` or a throwaway WIP commit + `git bundle` off-path (WIP survives the reset because it's captured before it).
   b. `git fetch origin` → `git reset --hard origin/<branch>` (adopt the clean rewritten history).
   c. **Re-apply WIP** — `git stash pop` / cherry-pick the WIP commit onto the new base; resolve any conflict against the redacted content (the only diff is [REDACTED] where a PII value was — trivial).
3. WIP SURVIVAL is guaranteed by step-a-before-b: no agent resets without its WIP bundled. **I will not trade the privacy fix for lost work** (PO) — the bundle is the guarantee.

## (f) PREVENTION in the same operation (so it is not repeated in a month)
- **Relocate PII out of git-tracked scenario units:** contact-PII (phones/emails/addresses on Profiles) must live in a **gitignored runtime store** (like `data/model-store` already is), NOT `scenario/index` (git-tracked). The unit keeps a reference; the PII value lives runtime-only.
- **FIELD-SHAPE pre-commit + ci:gate:** RED on a phone/email/address field-shape in a git-tracked scenario unit / doc (discovered-not-hand-listed, field-shape NOT className, comment/prose aware). A PII value can never be committed again. Stub-must-fail: stage a unit with a phone value → RED.
- This makes the scrub ONE-TIME.

## Sequence
PO go → (b) backup+restore-test → (c) scratch dry-run + full verify → PO go on the result → (e) force-push + serial fleet re-sync (WIP-bundled-first) → (d) post-push verification on origin → (f) prevention guard + relocation land → THEN the reconcile (now on clean history). I backstop each gate; nothing to origin until the scratch is green.
