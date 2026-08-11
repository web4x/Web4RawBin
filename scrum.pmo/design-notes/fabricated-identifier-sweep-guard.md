# Fabricated-Identifier — retroactive sweep + guard (CAPTURE, hand to req)

**By:** robbin-architect 2026-08-11, per PO (from the ViewBus T145 bonus find). **CAPTURE ONLY — do NOT drive tonight; hand to req to mint scenario-first when it has room.** Recorded, scoped, not half-driven.

## The defect class
A marker (`[impl:uuid:…]`) or unit `model.uuid` whose value is not a valid *measured* v4 uuid — non-hex characters, wrong segment lengths, or an invented suffix — was FABRICATED, not measured. **A fabricated identifier can never resolve, so any chain hanging off it is silently broken while looking wired** — the same illusion family as tonight's cross-credit and prose-mention (`[[marker-attach-full-uuid-chain-vs-task]]`, `[[chain-complete-verify-test-units-on-disk]]`). req applies valid-v4 discipline at MINT time; the gap is RETROACTIVE — nothing sweeps identifiers ALREADY on disk.

## Scope (my read-only scan — honest about false positives)
`598` code markers + `5534` unit uuids scanned against strict v4 (`^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`):
- **CONFIRMED malformed MARKERS (non-hex → cannot resolve — HIGH severity):**
  - `src/public/ts/ViewBus.ts` `[impl] e5145c01-f502-4g03-ah04-b05f06c07d13` — `g`/`h` non-hex. (Being retired with the FILE 1 → canonical ViewBus merge — bonus removal.)
  - `src/ts/server/server.ts:1942` `[impl:uuid:dnd01001-a1b2-4c3d-8e4f-000000000001] DropDispatcher.upload R19.14` — `dnd…` (`n` non-hex): a hand-crafted mnemonic SENTINEL. Verify its Impl unit resolves; if the unit's own uuid matches it's self-consistent-but-invalid; if not, the DropDispatcher.upload chain is silently broken.
- **35 non-v4 unit `model.uuid` (LOWER severity — self-consistent, non-standard):** all `ior:class:Requirement`, a deterministic sequential scheme (`18xxxxxx-…-0000000180NN`, version nibble ≠ 4). Likely a batch-minted Sprint-18 req set. They RESOLVE if their references use the same strings (internally consistent) — but violate v4-only, and a fresh minter/importer expecting v4 could mis-handle them.
- **EXCLUDE — false positives (~10, do NOT flag):** regex/template SOURCE in the marker-tooling itself (`impl-marker-attach.ts`, `skill-classes.ts`, `test-marker-attach.ts`, `TraceConsistency.ts` — literals like `([0-9a-f-]`, `${short(implUuid)}`, `${uuid}`). The guard must match RESOLVED markers/uuids, NOT literal regex/template in generator source.
- **EXCLUDE — markerPending placeholders:** `unit-controller.ts` `[impl] b5f72641` / `6b03b619` are intentional SHORT placeholders pending req's amended C4 mint (flipped to full uuids on mint) — not fabricated.

## The fix (req mints when it has room)
1. **Retroactive SWEEP:** scan all on-disk markers + unit uuids; classify malformed-marker (can't resolve, HIGH) vs non-v4-unit (self-consistent, LOWER). For malformed markers: re-point to the real unit uuid (measure it) or, if the unit is gone, flag the broken chain. For non-v4 unit uuids: decide re-mint-to-v4 (uuid change = ref rewrite, R27.2 remap shape) vs accept-as-legacy with a documented exception.
2. **GUARD `fabricated-identifier` (folds into the guard family — same shape as `status-string-writer` / `one-view-bus`):** every marker/unit uuid MUST be valid v4 (hex, segment lengths, version+variant nibbles); a fabricated one → RED. **Stub-must-fail:** plant `[impl:uuid:zzzz…]` / a non-v4 unit → suite RED (+ lint-runs meta-bite). **Scope carefully:** match RESOLVED markers (that should point at a unit), NOT the marker-generator's own regex/template source. Family name: `fabricated-identifier`.
3. Complements req's mint-time valid-v4 discipline: mint-time prevents NEW; this sweep+guard closes the RETROACTIVE gap so a fabricated id can neither persist nor recur.

**Priority:** malformed MARKERS first (silently-broken chains), non-v4 unit uuids second (self-consistent, cosmetic-to-risky). Not tonight — hand to req.
