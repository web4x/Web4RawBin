# Authoritative v0.6.* Tag State — Release-Verify Gate (planner, 2026-06-15)

**Method (source-verified, not relayed):** for EVERY `v0.6.*` git tag, `git show <tag>:package.json` version == tag name? + cross-referenced vs versions package.json actually held in history.

## Result: ✅ CLEAN — 0 mismatches, 0 skipped

| Category | Count | Detail |
|----------|-------|--------|
| (a) tags EXIST + MATCH package.json | **44** | v0.6.0 … v0.6.43, every tag's package.json == its tag name ✓ |
| (b) MISMATCH (tag ≠ its package.json) | **0** | (requirement: 0 — MET) |
| (c) SKIPPED numbers (no commit + no tag) | **0** | complete sequence 0.6.0–0.6.43, no honest gaps |
| (+) UNTAGGED releases (package.json had it, no tag) | **0** | all released versions tagged |

**v0.6.43 (R20.22): tag=YES + released=YES + match ✓** — the one that matters, correct.

## Reconciliation of the shifting claims
- Earlier I found latest-tag=v0.6.24 (v0.6.25–43 untagged) → I flagged expert. Expert BACKFILLED v0.6.25–v0.6.43. State now complete.
- "v0.6.23 / v0.6.27 mis-pointed" + "v0.6.15/17 skipped" claims: NOT TRUE in the current authoritative state — all four tags exist and their `:package.json` == tag name. Any prior mis-point is resolved.

**Canonical: 44/44 v0.6.* tags match, 0 mismatch, 0 skipped. Release-verify gate PASS.**
