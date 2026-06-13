# Skill/Tooling Improvements Backlog

*Owner: robbin-skill-expert · logged during S20 shadow*

## T-TOOL-1: followUp auto-mark superseded reqs orphanByDesign

**Priority**: HIGH — inflates canonical count now
**Status**: ORDERED
**Found**: R20.6 shadow (2026-06-13)

When a Requirement has `supersededBy` set (pointing to a canonical), followUp should
auto-classify it as orphanByDesign (excluded from denominator). Currently requires
manual `orphanByDesign: true` on each superseded unit.

**Implementation**:
In `Chain.isOrphanByDesign(uuid)` (skill-classes.ts), add:
```
const m = this.model(uuid);
if (m?.supersededBy) return true;
```
One line. All superseded reqs auto-exclude from the count.

**Verified impact**: R18.24 (c9de63d7) and R19.58 (af607390) are both superseded by
R20.5 (7734f4e1) but currently counted as separate complete chains → +2 inflation.

## T-TOOL-2: lintMarkers catch parallel chains across superseded pairs

**Priority**: HIGH — catches dedup that didn't actually reduce debt
**Status**: ORDERED
**Found**: R20.6 shadow (2026-06-13)

When req A supersedes req B, and BOTH A and B have complete chains (UC→...→Test),
lintMarkers should emit a `parallel-chain` finding: the dedup was declared but the
old chain was never retired. The superseded req's chain objects (UC, Method, Impl, Test)
should either be re-pointed to the canonical OR orphanByDesign'd.

**Verified**: R20.5 supersedes [R18.24, R19.58]. All 3 have independent complete chains:
- R18.24 → classMethodScope → Impl 9f495b68 → Test 5edd2404
- R19.58 → unifiedTraceability → Impl 21f689fb → Test aa4b7cf3
- R20.5 → singularChain → Impl b4f6b903 → Test 1a22ed27
3 chains for 1 logical requirement = 2 inflated.

**Implementation**:
In `Chain.lintMarkers()`, after existing checks, add:
```
for (const uuid of this.idx.list()) {
  if (this.unitType(uuid) !== 'Requirement') continue;
  const m = this.model(uuid);
  const supersedes = (m?.supersedes as string[]) || [];
  for (const supIor of supersedes) {
    const supUuid = ior(supIor);
    const supM = this.model(supUuid);
    if (!supM?.supersededBy) continue;
    // check if superseded req still has a live chain
    const supRows = this.walkReq(supUuid, hasRealImpl, hasRealTest, implRefs);
    if (supRows.some(r => r.complete)) {
      findings.push({ kind: 'parallel-chain', uuid: supUuid,
        detail: `superseded by ${short(uuid)} but still has a complete chain — retire or orphanByDesign` });
    }
  }
}
```
