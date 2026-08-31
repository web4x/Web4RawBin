# PII History Scrub — DESIGN (architect, 2026-08-31, Tron-ruled privacy INCIDENT)

Tron ruled: scrub the remote history. Sequences BEFORE the reconcile (a reconcile would weave the PII through a merged history). Design-only; **nothing executes without PO go; pushes are FROZEN fleet-wide.** Authorized defensive/privacy work.

## ★ SCOPE CORRECTED (PO held approval; I re-measured on origin/main by FIELD NAME — my 15 was one shape, missed two) — THREE PII field-shapes, ~180+ units
My first pass scoped ONLY the contact shape (and undercounted it on hotfix). Re-measured on **origin/main** (the pushed/exposed reality) by field name (never values):
| Shape | ior:class | count | PII fields | note |
|---|---|---|---|---|
| **contacts** | Profile | **20** | phones / emails / addresses | my hotfix scan found 15 (non-empty); origin/main has 20 by field-key (5 more main-only) |
| **★ chat messages** | Message | **107** | senderName + **text (body)** + timestamp | THE BULK — private communication CONTENT, the largest class, entirely missed |
| **room membership** | Room | **13** (+ up to 59 `members`-units) | senderName + **members** + files | who was in which room = personal association |
- The `className:Message` grep returns **0** while field-shape returns **107** — the IDENTICAL false-clean that hid the Profiles. Field-shape is the only valid scope.
- The **400 `text` units are NOT all PII** — only the 107 on Messages (senderName present) are; the other ~293 are legit unit text (AC/checklist descriptions). ⇒ redaction MUST be UNIT-AWARE (redact `text` only within Message units), never a blind text-value regex.
- **ALL are REFERENCED** (contacts up to 31 inbound; Messages/Rooms are chain/room data). ⇒ **REDACT VALUES IN PLACE, keep uuids/structure — NOT delete** (deletion = the fail-closed-pin P0 we just fixed). This was the catch; it now applies to all three shapes.

## (a) TOOL + SCOPE — UNIT-AWARE blob-callback redaction (not value-regex, not delete), both branches + tags + all refs
- **`git filter-repo --blob-callback`** — NOT `--replace-text` value-regex. Why: a Message `text` body is free-form and has NO distinguishing value-shape (can't regex "a chat body" vs "an AC description"). So the redactor must be UNIT-AWARE: parse each `scenario/index/**/*.scenario.json` blob, and redact BY FIELD NAME within the PII-bearing shapes:
  - `Profile` → redact `phones`/`emails`/`addresses` values → `[REDACTED]`
  - `Message` → redact `senderName`/`text`(body)/`timestamp` → `[REDACTED]`
  - `Room` → redact `senderName`/`members` → `[REDACTED]`
  - Discriminate by the unit's `ior:class` + field-presence (field-shape), so the ~293 legit `text` units (AC/checklist) are UNTOUCHED. Keep uuids + all structural fields → refs resolve → NO dangling cascade.
- The callback is a small pure function (blob-in → redacted-blob-out); it never PRINTS a value, only replaces PII field contents. It runs across ALL history, rewriting every ref/branch/tag (filter-repo default) — `main` + `hotfix` + tags.
- **PLUS docs with raw PII** (prose, not JSON): the classification reports (`216c962ad` `dirty-tree-classification-2026-08-31.md`) — redact by field-shape regex (phone/email pattern) in those markdown paths. Discovered by the field-shape scan (d).

## (b) BACKUP FIRST, verifiable (a rewrite has no undo; ~37 files live peer WIP)
- **Sealed forensic backup:** `git clone --mirror origin` + `git bundle create pre-scrub-ALL.bundle --all`, stored OFF the rewrite path, ACCESS-CONTROLLED (it CONTAINS the PII — a privacy incident may need the original for audit, so keep it, secured, not on any working path, not pushed).
- **RESTORE TEST:** clone from the bundle → verify it reproduces the exact pre-scrub HEADs (both branches) before trusting it.
- **Peer WIP:** uncommitted WIP is NOT in history → filter-repo doesn't touch it; but the fleet re-sync (e) must preserve it — each agent bundles WIP FIRST (see e).

## (c) DRY-RUN on a scratch clone — prove clean + builds + serves before origin (Phase-A pattern)
On a SCRATCH clone (not origin, not any live tree): run filter-repo → then verify ALL of: (d) PII field-shape scan across all history = 0; `npm run build` GREEN (redact-not-delete → no structural break); boot the server → `/trace`+`/model` render; **R37.29 referential-integrity = 0 dangling** (units survived redacted, refs resolve); the 15 uuids still RESOLVE. NOTHING touches origin until all green.

## (d) VERIFICATION not self-referential (class-keyed would be wrong)
- **FIELD-SHAPE scan across ALL history for ALL THREE shapes:** `git rev-list --all` → every blob → 0 unredacted PII in: Profile phones/emails/addresses, Message senderName/text/timestamp, Room senderName/members (by field-name + value-pattern where applicable). NOT a className grep (`className:None`/`ior:Message` mismatch defeats it — the very false-clean that hid all three).
- Confirm the confirmed-real value(s) (`3effa1fc`) + a sampled Message body are absent from ALL history.
- Confirm the ~180 uuids (20 Profile + 107 Message + Rooms) still RESOLVE in the rewritten history (redacted, not dangling) → R37.29 = 0.

## (e) FORCE-PUSH + FLEET RE-SYNC — WIP MUST survive
1. PO freeze in effect. Force-push rewritten `main`+`hotfix`+tags to origin (after PO go, post-dry-run-green).
2. **Per agent, in order (least-loaded/idle FIRST, recovery-drivers LAST — the Layer-2 ordering; SERIAL round-trip: each verifies before the next, catch one broken not ten):**
   a. **BUNDLE uncommitted WIP FIRST** — `git stash` or a throwaway WIP commit + `git bundle` off-path (WIP survives the reset because it's captured before it).
   b. `git fetch origin` → `git reset --hard origin/<branch>` (adopt the clean rewritten history).
   c. **Re-apply WIP** — `git stash pop` / cherry-pick the WIP commit onto the new base; resolve any conflict against the redacted content (the only diff is [REDACTED] where a PII value was — trivial).
3. WIP SURVIVAL is guaranteed by step-a-before-b: no agent resets without its WIP bundled. **I will not trade the privacy fix for lost work** (PO) — the bundle is the guarantee.

## (f) PREVENTION in the same operation (so it is not repeated in a month)
- **Relocate PII out of git-tracked scenario units (all three shapes):** contact-PII (Profile phones/emails/addresses), chat CONTENT (Message senderName/text/timestamp), and membership (Room senderName/members) must live in a **gitignored runtime store** (like `data/model-store`), NOT `scenario/index` (git-tracked). The unit keeps its uuid + a reference; the PII/content lives runtime-only. (Messages/Rooms are arguably runtime data that never belonged in the versioned index at all.)
- **FIELD-SHAPE pre-commit + ci:gate (all three shapes):** RED on a git-tracked unit carrying a Profile-contact / Message-content / Room-membership field with a value (discovered-not-hand-listed, field-shape NOT className, prose-aware). Stub-must-fail: stage a Message with a `text` body → RED. A PII value can never be committed again.
- This makes the scrub ONE force-push / ONE fleet re-sync (all three shapes in the single pass — a second scrub would be a second re-sync, i.e. a habit; scoping all three now avoids it, per the PO).

## Sequence
PO go → (b) backup+restore-test → (c) scratch dry-run + full verify → PO go on the result → (e) force-push + serial fleet re-sync (WIP-bundled-first) → (d) post-push verification on origin → (f) prevention guard + relocation land → THEN the reconcile (now on clean history). I backstop each gate; nothing to origin until the scratch is green.
