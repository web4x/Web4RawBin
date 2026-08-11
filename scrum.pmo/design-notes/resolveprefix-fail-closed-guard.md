# resolvePrefix FAIL-CLOSED unique-or-refuse guard + retro-audit (design)

**By:** robbin-architect 2026-08-11, per PO (the 18 colliding prefix-pairs, mine alone). With S37 at 6 QA-Review awaiting Tron's verdicts, a Test mis-credited onto a foreign chain = Tron approving something never proven — the one defect class we can't afford. Measured; the write-side is already safe (full-uuid fleet rule), the gap is the READ/resolve path.

## ★ THE DEFECT (measured — the smoking gun)
`src/ts/scenario/skill-classes.ts:438`:
```ts
resolvePrefix(prefix: string): string | null {
  return this.idx.list().find(u => u.startsWith(prefix)) || null;   // ← returns the FIRST match; SILENTLY picks one on ambiguity
}
```
`.find(first-match)` **silently resolves an ambiguous prefix to whichever unit sorts first** — never refuses. Callers:
- `:245` `resolveReqSet` — `reqUuids.map(u => this.resolvePrefix(u) || u)`.
- **`:507` `wireImplNode`** — `this.resolvePrefix(methodUuid) || methodUuid`, then **moves Tests onto the resolved unit.** This is the mis-credit vector: an ambiguous prefix → the Tests land on the wrong unit's chain.

## The collision set (measured, 5546 units)
- **8 GENUINE-v4 prefix-collision pairs** — the dangerous ones. Mostly **Method + its Implementation deliberately given a SHARED 8-char prefix** via an `-a1b2`/`-b1c2`/`-c1d2` mnemonic-suffix convention (so the Impl "looks related" to its Method). Examples: `79601135` (RoomView.openFilePreview Method + rb-detail-drawer Impl), `01771d5b` (RbDetailDrawer.dragResize Method + Impl), `76bbedda` (×3), `bfbc0874`, `e4f5b693` (UC + Impl), `e927ecfe`. → `resolvePrefix('79601135…')` matches BOTH the Method AND the Impl = ambiguous.
- **9 synthetic/non-v4 groups** (`a1d2e3f4`×33, `d4e5f6a7`×14, the `18xxxxxx` sequential S18 reqs) — these OVERLAP the fabricated-identifier defect (`[[fabricated-identifier-sweep-guard]]`): hand-minted non-v4 uuids sharing prefixes.

## THE FIX — fail-closed unique-or-refuse (by construction)
```ts
resolvePrefix(prefix: string): string | null {
  const matches = this.idx.list().filter(u => u.startsWith(prefix));
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  throw new Error(`AMBIGUOUS prefix '${prefix}' → ${matches.length} units [${matches.map(m => m.slice(0,13)).join(', ')}] — REFUSE (unique-or-refuse). Use the full 36-char uuid.`);
}
```
`.find` → `.filter`; `>1` = THROW (fail-loud), never silent-pick. An ambiguous prefix can no longer mis-resolve → no mis-credit, by construction. Binding rule unchanged: **full 36-char uuids in every write op** (this closes the resolve/read side).

## PREFIX-EXPANSION BITE (stub-must-fail; family `prefix-collision` / unique-or-refuse)
- (i) plant TWO units sharing an 8-char prefix, call `resolvePrefix(prefix)` → MUST throw (RED if it returns a unit).
- (ii) meta-bite: weaken the `>1`→throw to a silent pick → suite RED.
Folds into `ci:gates` with the guard family.

## RETRO-AUDIT (was anything ALREADY mis-credited?)
For the 8 genuine pairs (Method+Impl shared-prefix): verify each Impl's `ownerIor` → its OWN Method (not the collision partner) and each Test two-keys to the correct Impl — a `wireImplNode` called with an 8-char prefix could have moved Tests onto the Impl-partner instead of via the Method. (Write-side used full uuids per the rule, so expected harm is bounded — but audit, don't assume; this is the T37.2 rigor applied graph-wide.) Fix any found by re-pointing to the correct unit; report the list.

## Overlap + root recommendation
The `-a1b2` shared-prefix convention (Impl uuid = Method-prefix + mnemonic) is itself the ROOT of the genuine pairs — it manufactures collisions on purpose. RECOMMEND retiring it: Impls get independent v4 uuids (not method-prefixed). This overlaps the fabricated-identifier sweep (both are "invented rather than measured identifiers") — schedule together. Ownership: this guard is a NEW distinct Impl on skill-classes.ts's resolvePrefix (do NOT re-credit); the retro-audit is architect-run.
