# State-file currency lint extension — context.md/learnings.md, shadow + rot-evident (architect, 2026-08-29)

Trainer-requested (PO-routed; I design, trainer propagates the marker convention, req mints the AC). Activates the deferred **context-anchor-currency debt (PO D5)** + the trainer's shadow-hazard finding (a deprecated bare `<role>/context.md` nearly false-flagged ARON). Same blind-side as check:pin-single-source: the boot-currency lint globs `boot.md` ONLY → a stale STATE file outside the scan walks past.

## Principle (settled in the boot-currency arc, reused)
BOOTS get **removal** (timeless, rot-PROOF). STATE files (context.md/learnings.md) MUST carry state — they can only be rot-**EVIDENT**, not rot-proof. So the lint does NOT demand freshness; it asserts the properties that (a) make a stale state file self-evidently a starting-point, and (b) stop a stale file being READ AS CURRENT.

## Hazard (scan-the-hazard, not actors)
A state file that a LIVE boot READS is STALE / SHADOWED / unmarked → a fresh agent boots a dead world. NOT "every old file is bad" (a dormant agent's old context.md that nobody reads is not a live hazard).

## Structural scope — no governance needed (follow the boot pointer)
A boot.md carries a `Context:`/`Deep files:` pointer to its state files (measured: `Read context.md … + learnings.md`). ⇒ the **ACTIVE/read set = every state file a boot.md points at** — structurally derivable, no "which agent is running" judgment. Gate those RED. **Dormant orphans** (a state file NO boot points at — the ~60 Feb-May set) = **WARN-latent** (surfaced for cleanup, never CI-RED — delta-vs-absolute; respects "catch generically" without false-blocking on files nobody reads).

## THREE gates
1. **SHADOW single-source** (the sharp hazard): a role with BOTH `<role>/context.md` AND `<role>@<host>/context.md` = TWO sources for one agent (measured pairs: agent-trainer, oosh-architect, oosh-expert, oosh-po, oosh-tester). The boot defaults toward the bare name. The bare-name file MUST be: absent, OR a DEPRECATED-pointer to the live one, OR itself current. A **stale-unmarked bare shadow a boot defaults to ⇒ RED.** (Two-source-of-truth disease; cure = retire/deprecate the second, never keep two live.)
2. **Rot-evident shape** (PO D5, now enforced): a boot-pointed ACTIVE state file MUST carry the verify-don't-trust anchor preface (the "⚠ DO NOT TRUST — re-derive via `git … + otmux pane.self`" head). Missing it = the file asserts itself as current-truth = the rot hazard ⇒ RED. Makes every active state file rot-EVIDENT.
3. **Deprecation marker** (trainer's convention, propagated): a superseded/shadowed state file carries `> ⛔ DEPRECATED <YYYY-MM-DD> → <successor path>` (demonstrated on agent-trainer/context.md). The lint asserts a shadowed/dormant file carries it; **fail-closed on unparseable date** (a marker with no parseable date ⇒ RED, never skip-as-ok).

## Divergence — enumerate-not-universal (my own law, applied to file-KIND)
Discover ALL agent state files by GLOB: `session/agents/*/context.md`, `*/learnings.md`, AND per-host `*@*/…`. A state file present on disk but NOT in the lint's evaluated set ⇒ RED — a NEW file-kind or a new `@host` shadow CANNOT hide by being unlisted. (The oosh-* shadows are oosh-PO's team → route through the EXISTING `/^oosh-/` EXCLUDED predicate from check-boot-currency: WARN-loud, coordinate, never our CI-RED — reuse, don't rebuild.)

## Failable (stub-must-fail, on the REAL shapes)
- A boot-pointed BARE `<role>/context.md` STALE while `<role>@<host>/context.md` is live, NO deprecated marker ⇒ RED (the ARON near-miss shape).
- A boot-pointed active state file WITHOUT the verify-don't-trust preface ⇒ RED.
- A deprecated marker with an UNPARSEABLE date ⇒ RED (fail-closed).
- A NEW state-file kind present-but-unevaluated ⇒ RED (divergence).
Each is the gate's RED baseline; a gate never RED on these proves nothing.

## Handoff
- **Trainer PROPAGATES** the marker convention (`⛔ DEPRECATED <date> → successor`) onto every shadowed/dormant state file + the verify-don't-trust preface onto every active one (never me — I design).
- **req MINTS the AC** (each gateRef + stub-must-fail): shadow-single-source / rot-evident-shape / deprecation-marker-fail-closed / glob-divergence. Ride the boot-currency family (this IS the D5 context-anchor extension).
- I RE-INSPECT after propagation (the discovered set covers new shadows; the 4 stubs RED).
