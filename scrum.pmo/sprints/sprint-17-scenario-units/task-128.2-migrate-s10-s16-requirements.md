[Back to Sprint 17 Planning](./planning.md) | [Back to T128](./task-128-migration.md)

# T128.2: Migrate S10-S16 Requirements to Scenario Index
[subtask:uuid:b94d2681-54f0-47e3-a431-128200000001]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (architect design — this document)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [T128: Migration](./task-128-migration.md)
- follows
  - T128.1 — exemplar (Sprint 1, Tron-approved template)
  - T160 — validates forward-ref repopulation is back-ref free
  - T161/T163 — validates `model.name` is clean
  - T164 — validates `cleanModelName()` handles edge cases

## Context

T128.1 established the exemplar migration pattern on Sprint 1. T160/T161/T163/T164 fixed the data quality pipeline. T128.2 now runs the migration on S10-S16 requirements using the current (fixed) parser.

S10-S16 are active sprints with `requirements.md` files that contain requirement entries. These need to become scenario-unit JSONs in `scenario/index/` with:
- Clean `model.name` (T161/T164 parser)
- Forward `model.tasks[]` populated from `requirements.md` task-link bullets (T160 pattern)
- No back-references (T159/B18 compliant)

## Design (Architect — robbin-architect, 2026-06-02)

### Migration Strategy

Use existing `scripts/migrate-to-scenario.ts` with the T161+T164 fixes applied. The parser already:
1. Extracts `[requirement:uuid:...]` from `requirements.md` lines
2. Calls `cleanModelName()` (T164) for `model.name`
3. Extracts `model.description` from Tron quote blocks
4. Parses forward `([task-N](path))` links for `model.tasks[]` (T160)
5. Writes to `scenario/index/<5-char-prefix>/<uuid>.scenario.json`
6. Creates symlink tree under `scenario/sprints.json/`

### Sprint Scope

| Sprint | requirements.md | Req count (est) | Status |
|--------|----------------|-----------------|--------|
| S10 | `scrum.pmo/sprints/sprint-10/requirements.md` | TBD — expert counts on dry-run | Active |
| S11 | `scrum.pmo/sprints/sprint-11/requirements.md` | TBD | Active |
| S12 | `scrum.pmo/sprints/sprint-12/requirements.md` | TBD | Active |
| S13 | `scrum.pmo/sprints/sprint-13/requirements.md` | TBD | Active |
| S14 | `scrum.pmo/sprints/sprint-14/requirements.md` | TBD | Active |
| S15 | `scrum.pmo/sprints/sprint-15/requirements.md` | TBD | Active |
| S16 | `scrum.pmo/sprints/sprint-16/requirements.md` | TBD | Active |

### Execution

```bash
# Step 1: Dry-run — see what would be created
for sprint in 10 11 12 13 14 15 16; do
  node scripts/migrate-to-scenario.ts \
    --sprint "sprint-$sprint" \
    --type requirement \
    --dry-run
done

# Step 2: Review dry-run output — verify:
#   - model.name is clean (no ##, no >, no ---)
#   - model.tasks[] populated from forward bullets
#   - No model.requirements[] or model.links.up (back-ref free)

# Step 3: Apply
for sprint in 10 11 12 13 14 15 16; do
  node scripts/migrate-to-scenario.ts \
    --sprint "sprint-$sprint" \
    --type requirement \
    --apply
done

# Step 4: Verify
npm run trace:check
```

### Validation Gates (per-sprint)

Before applying each sprint, expert verifies:

1. **Name quality:** Every `model.name` is speaky ≤60 chars, no MD artifacts
2. **Forward tasks:** `model.tasks[]` count matches forward `([task-N](path))` bullets in `requirements.md`
3. **No back-refs:** Zero `model.links.up`, zero `model.requirements[]` fields
4. **Idempotent:** Running twice produces identical JSON
5. **trace:check clean:** `npm run trace:check` reports no orphans or broken links

### Files Created (per requirement)

```
scenario/index/<a>/<b>/<c>/<d>/<e>/<uuid>.scenario.json   # primary
scenario/sprints.json/sprint-N/requirement/<uuid>.json      # symlink
```

### T160 Compatibility

T160 established that `/api/trace` reads from scenario index. New S10-S16 requirement scenarios appear in `/api/trace` automatically — no endpoint change needed. T163 reads `model.name` from the same scenarios — clean names surface automatically.

### Acceptance Criteria
- [ ] AC1 — All S10-S16 `requirements.md` entries migrated to scenario index
- [ ] AC2 — Every migrated `model.name` is clean (T164 `cleanModelName()` applied)
- [ ] AC3 — Every migrated `model.tasks[]` populated from forward bullets (T160 pattern)
- [ ] AC4 — Zero back-references on any migrated scenario (T159 invariant)
- [ ] AC5 — `npm run trace:check` clean after migration
- [ ] AC6 — `/trace` browser shows S10-S16 requirements with clean names and populated task chains
- [ ] AC7 — Dry-run output reviewed before apply (per-sprint gate)
- [ ] AC8 — Rule-pair (a)+(b): version + CACHE_NAME bump

### Test Scenarios
| Test | Action | Expected |
|------|--------|----------|
| TS1 | Dry-run on S10 | Lists requirement scenarios with clean names, no `##` |
| TS2 | Apply on S10 + inspect scenario JSON | `model.name` clean, `model.tasks[]` populated, no back-refs |
| TS3 | `/trace` browser after S10 migration | S10 requirements visible with forward task chains |
| TS4 | `npm run trace:check` after full S10-S16 migration | Clean (0 orphans, 0 broken links) |
| TS5 | Run migration twice on S10 | Identical JSON output (idempotent) |

## QA Audit & User Feedback
- 2026-06-02: Created concurrent with T164 close-out — handles path (b) of T163 residue (12 unmigrated S10-S16 reqs to the scenario index). Planner added required Web4Articles Subtasks + QA Audit sections for audit compliance (learning #12: planner owns structure). Architect content authoritative. Awaiting expert impl + tester verify → completes T163's full 41/41 close (in concert with T164's 9 in-scope units).

## Subtasks
None (atomic migration batch; one commit-set with rule-pair (a)+(b)).

---

**Architect:** robbin-architect @ web4team:0.0
**Sprint:** Sprint 17 — Scenario Units
**Parent:** T128 Migration
