# Chain Skills Formalization — skill-expert contribution
*Authored by robbin-skill-expert (chain-tool owner), 2026-06-29. Measured from objectVerb.ts + live `objectVerb list` at HEAD. Builds on [migrate-to-object-verb.md](./migrate-to-object-verb.md).*
*Coordination: architect owns the design/structure decisions; req owns the formal requirements + acceptance criteria. This doc is the skill-expert input to both.*

## (1) CURRENT Object.verb SURFACE — measured, authoritative
Generic dispatcher `scripts/objectVerb.ts` (377 lines): `registry` of 5 objects, `introspect()` reflects method sigs + JSDoc, per-object `complete <verb> <param>` (OOSH c2 contract). Top-level verbs: `list`/`help`, `emitOosh` (generates the taskChain OOSH wrapper w/ per-method completion), `emitDocs` (markdown), `emitClaudeSkills`.

| Object | Verbs (signature) |
|--------|-------------------|
| **Chain** | resolvePrefix `<prefix>` · followUp `<reqUuids> <?sprint>` · listComplete `<?sprint>` · scoreboard `<reqUuids> <?sprint>` · wireImplNode `<methodUuid> <?dryRun>` · wireAllMissing `<?dryRun>` · generateMatrix `<matrixPath> <?sprint>` · updateMatrixRow `<reqUuid> <matrixPath>` · lintMarkers · snapshotComplete `<?dir>` · renameUuid `<oldUuid> <?newUuid>` |
| **Velocity** | compute `<since> <?sprint>` · dashboard `<?since> <?hours> <?sprint>` |
| **Scenario** | captureQuote `<text> <sprintIor> <?taskIor>` · proposeTask `<reqIor> <name> <desc> <sprintIor> <?assigned> <?effort>` · walkChain `<startIor> <?direction> <?maxDepth>` · statusTransition `<taskIor> <verb> <?tronCommitRef>` |
| **Rules** | list · show `<name>` |
| **Audit** | strict · rulePair · sprintMd |

Every object also exposes `complete <verb> <param>` for Tab-completion. **The TS method signature + JSDoc IS the single source of truth** — `introspect()` reads it; all emitters (oosh/docs/skill) derive from it. DRY holds.

## (2) WHAT'S MISSING for a complete skill set — measured gaps
1. **★ Pin/CurrentSprint is NOT in the registry (biggest gap).** The pin verbs I drove all through the S22/S23 crisis — `focus, advance, gate, hop, setChain, setNextBacklog, clearNextBacklog` — live ad-hoc in `scripts/planner-drive.ts`, OUTSIDE Object.verb. They are NOT introspectable, NOT Tab-completable, NOT emitted to OOSH, NOT discoverable via `list`. **Fix: add a `Pin` (or `CurrentSprint`) object to the registry** wrapping CurrentSprint, verbs: `pin`, `focus <taskUuid> <?force>`, `advance`, `hop <hop> <status> <?agent>`, `gate`, `setChain <req> <uc> <class> <method> <impl> <test> <sprint> <task>`, `setNextBacklog <uuid>`, `clearNextBacklog`. Then planner-drive.ts becomes a thin shim (or is retired).
2. **Stale OOSH symlink.** `~/oosh/external/taskChain → /Users/Shared/.../taskChain` (macOS path) — BROKEN on WODA.prod (`which taskChain` fails, not on PATH, not Tab-completable here). Re-link to the real repo path + c2 re-index. (ooshTeam / oosh-expert lane.)
3. **Regeneration discipline (DRY enforcement).** taskChain is hand-triggered via `emitOosh`. Chain's surface is current (has renameUuid/wireAllMissing/snapshotComplete), but nothing GUARANTEES re-emit on every surface change. **Add a gate**: CI/pre-commit check that the committed taskChain == `emitOosh` output (fail if drifted) — makes staleness structurally impossible.
4. **Expert+tester ownership pair per object.** OOSH law: every script owned by an expert+tester pair. Chain/Velocity/Scenario/Rules/Audit/Pin need named owners + a test file each (scenario-unit tests, not just vitest) — currently informal.
5. **Tab-completion not live-verified on WODA.prod** (blocked by #2). The `complete` contract exists but needs real-bash otmux Tab verification once symlinked.
6. **Discoverability index is hand-maintained.** `scrum.pmo/skills/index.md` should be GENERATED from `introspect()` (DRY), not curated, so it never drifts from the surface.

## (3) STRUCTURE for Tab-completion + discoverability — proposal
- **Keep the single source of truth**: typed Class method + JSDoc. Never duplicate signatures into docs/completion — `introspect()` already feeds all three emitters. This is the OOSH DRY win; protect it.
- **One OOSH script per object (recommended), not one umbrella.** OOSH idiom = one script = one class. Generate `chain`, `velocity`, `scenario`, `rules`, `audit`, `pin` as separate Tab-completable scripts via `emitOosh <Object>` → discoverability is `chain<Tab>` / `pin<Tab>` (matches `otmux<Tab>`, `hiveMind<Tab>`). The current single `taskChain` umbrella can stay as an alias.
- **Doc format**: emitOosh already emits the canonical two-hash `script.object.verb() # <args> # desc` (c2 parses both) + per-method `verb.completion.param()` helpers matching param names. This is correct OOSH — preserve it.
- **Completion helpers** route to `complete <verb> <param>` which returns candidates one-per-line (uuids, sprint names, rule names). Verify each emits real candidates (e.g. `chain.show.completion.name` → rule list).
- **Symlink + c2**: each generated script → `~/oosh/external/`, executable, `#!/usr/bin/env bash`, `script.start "$@"` dispatch. c2 auto-indexes. `which chain` → symlink, `chain<Tab>` → verbs.

## Coordination asks
- **→ architect (0.3, design)**: decide (a) Pin/CurrentSprint object shape + whether planner-drive.ts retires or shims; (b) per-object scripts vs umbrella; (c) where the emit-drift gate runs (pre-commit vs CI).
- **→ req (requirements)**: formalize ACs — "every Object.verb command is Tab-completable on WODA.prod", "committed OOSH wrapper == emitOosh output (no drift)", "each object has an expert+tester owner + test", "Pin verbs are Object.verb, not ad-hoc".
- **→ ooshTeam / oosh-expert**: fix the stale symlink + run live c2/otmux Tab verification.
</content>
