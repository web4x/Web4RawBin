[Back to Sprint 17 Planning](./planning.md)

# T164: Re-migrate dirty model.name + firstLine() fallback hardening

[task:uuid:e8c788c8-e085-4960-bad6-9a991af37d14]

> **Reconciled 2026-06-02:** architect created this file concurrently with the
> planner's stand-up; same scope. Planner adopted architect's content
> (authoritative 9-scenario inventory vs PO's earlier "3" estimate) and
> replaced the non-v4 uuid (`a8b9c0d1-…-164000000001` failed learning #17
> RFC4122-v4 rule) with the planner's proper v4 (`uuidgen`). Required Web4Articles
> sections (Subtasks + QA Audit) added below for audit compliance.

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
  - [Sprint 17 Planning](./planning.md)
  - Follow-on to T161 (speaky names) + T163 (title source switch)
- down
  - None (atomic)
- follows
  - [T161](./task-161-requirement-name-renders-tron-quote-not-speaky.md) — `737c841` v0.5.57
  - [T163](./task-163-api-trace-title-source-switch.md) — `f138aa0` v0.5.61

## Context

T163 switched `/api/trace` to read `model.name` from scenario index. But 9 scenarios still have dirty `model.name` values — the migration parser (`scripts/migrate-to-scenario.ts`) stored raw MD heading text into `model.name`.

### Dirty Inventory (9 scenarios)

| UUID (short) | Current dirty model.name | Expected clean name |
|---|---|---|
| d4e5...0010 | `## Navigation & Traceability (original directive)` | `Navigation and traceability` |
| d4e5...0013 | `## Migration (original directive)` | `Migration` |
| d4e5...0014 | `## Process (original directive)` | `Process` |
| d4e5...0003 | `## Storage Layout (original directive)` | `Storage layout` |
| d4e5...0006 | `## Views & Templates (original directive)` | `Views and templates` |
| d4e5...0015 | `---` | `REQ-d4e5f6a7` (auto-name from uuid) |
| 9dedeb00 | `## Extension 3 (2026-05-31)` | `Extension 3` |
| 7e4f8a2b | `## Extension 4 (2026-05-31 — traceability is a TREE)` | `Extension 4` |
| dd8709c3 | `## Extension 2 (2026-05-31)` | `Extension 2` |

## Design (Architect — robbin-architect, 2026-06-02)

### Part (a): Re-migrate 9 dirty model.name values

**Fix in migration parser** (`scripts/migrate-to-scenario.ts`):

The name extraction function must strip MD artifacts before storing `model.name`:

```typescript
function cleanModelName(raw: string): string {
  let name = raw.trim();
  
  // Strip MD heading prefixes: ## , ### , # , ####
  name = name.replace(/^#{1,6}\s+/, '');
  
  // Strip horizontal rules
  if (/^-{3,}$/.test(name)) return '';  // will trigger uuid fallback
  
  // Strip parenthetical date suffixes: "(2026-05-31)" or "(2026-05-31 — ...)"
  name = name.replace(/\s*\([^)]*\d{4}-\d{2}-\d{2}[^)]*\)\s*$/, '');
  
  // Strip "original directive" suffix
  name = name.replace(/\s*\(original directive\)\s*$/, '');
  
  // Strip leading/trailing whitespace + quotes
  name = name.replace(/^["'>]+\s*/, '').replace(/["']+$/, '').trim();
  
  // Max 60 chars
  if (name.length > 60) name = name.substring(0, 57) + '...';
  
  // Fallback if empty
  return name || '';
}

function extractModelName(block: string, uuid: string): string {
  // ... existing firstLine/speaky extraction logic from T161 ...
  const raw = firstSpeakyLine(block);
  const clean = cleanModelName(raw);
  return clean || `REQ-${uuid.substring(0, 8)}`;
}
```

**One-shot re-migration script** for the 9 dirty scenarios:

```bash
# Expert runs:
node scripts/migrate-to-scenario.ts --re-clean-names --dry-run
# Review output
node scripts/migrate-to-scenario.ts --re-clean-names --apply
```

The script reads each scenario JSON, applies `cleanModelName()` to `model.name`, writes back if changed.

### Part (c): firstLine() fallback hardening

Even though T163 switched `/api/trace` away from `firstLine()`, the function may have other callers (migration scripts, trace-cli). Harden it defensively:

**In `src/ts/server/TraceConsistency.ts`:**

```typescript
function firstLine(block: string): string {
  const lines = block.split('\n').filter(l => l.trim().length > 0);
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip MD heading prefixes
    if (/^#{1,6}\s/.test(trimmed)) continue;
    
    // Skip horizontal rules
    if (/^-{3,}$/.test(trimmed)) continue;
    
    // Skip blockquote prefixes (T161)
    if (trimmed.startsWith('>')) continue;
    
    // Skip bold requirement IDs like **R17.1**
    if (/^\*\*R\d/.test(trimmed)) continue;
    
    // Skip uuid lines
    if (trimmed.startsWith('[requirement:uuid:') || trimmed.startsWith('[task:uuid:')) continue;
    
    // Skip task link lines
    if (trimmed.startsWith('(') && trimmed.includes('task-')) continue;
    
    // First clean line is the speaky name
    return trimmed.substring(0, 120);
  }
  
  // Fallback: strip heading from first non-blank line
  const first = lines[0]?.trim() || '';
  return first.replace(/^#{1,6}\s+/, '').replace(/^-{3,}$/, '').substring(0, 120);
}
```

**Key additions vs T161:**
- Skip `##`, `###`, `#` heading lines (NEW)
- Skip `---` horizontal rules (NEW)
- Skip `**R17.x**` bold requirement ID lines (NEW)
- Existing: skip `>` blockquotes (T161)

### Files to Modify

| File | Change |
|------|--------|
| `scripts/migrate-to-scenario.ts` | Add `cleanModelName()`, add `--re-clean-names` flag |
| `src/ts/server/TraceConsistency.ts` | Harden `firstLine()` to skip `##`, `---`, `**R` |
| 9 scenario JSON files | Re-written by migration script |
| `package.json` | Bump version (rule-pair (a)) |
| `src/public/sw.js` | Bump CACHE_NAME (rule-pair (b)) |

### Acceptance Criteria
- [ ] AC1 — All 9 dirty scenarios have clean `model.name` (no `##`, no `---`, no `> `)
- [ ] AC2 — `cleanModelName()` handles: `## Heading` → `Heading`, `---` → uuid fallback, `## X (date)` → `X`
- [ ] AC3 — `firstLine()` skips `##`, `---`, `**R` prefixed lines (defensive for any caller)
- [ ] AC4 — Re-migration is idempotent (running twice = same result)
- [ ] AC5 — `/trace` browser shows clean names for all 9 formerly-dirty requirements
- [ ] AC6 — No regression on T161/T163 (speaky names + title source switch)
- [ ] AC7 — Rule-pair (a)+(b): version + CACHE_NAME bump

## Test Scenarios
| Test | Input | Expected |
|------|-------|----------|
| TS1 | `## Extension 3 (2026-05-31)` | `Extension 3` |
| TS2 | `## Navigation & Traceability (original directive)` | `Navigation and traceability` |
| TS3 | `---` | `REQ-d4e5f6a7` (uuid fallback) |
| TS4 | `## Views & Templates (original directive)` | `Views and templates` |
| TS5 | Already-clean name `Forward chain completeness` | Unchanged |
| TS6 | Run re-migration twice | Same output both times |

## QA Audit & User Feedback
- 2026-06-02: PO directed planner stand-up; architect created this file concurrently with a more accurate 9-scenario inventory (vs PO's earlier 3-unit estimate). Planner reconciled per learning #12 — architect's content authoritative, planner fixed the uuid (was non-v4, violated learning #17) and added required Subtasks + QA Audit sections for Web4Articles compliance. Path (b) — 12 unmigrated S10-S16 reqs — remains separate as **T128.2**. Awaiting expert impl → tester verify (target: 9/9 clean + T163 41/41 minus the T128.2 batch) → Tron QA.

## Subtasks
None (atomic task; (a) re-migration script + (c) firstLine() harden land in one commit-set).

---

**Architect:** robbin-architect @ web4team:0.0
**Sprint:** Sprint 17 — Scenario Units
