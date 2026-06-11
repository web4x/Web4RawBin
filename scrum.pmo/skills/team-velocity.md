# team.velocity

**UUID:** `e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8901`
**Roles:** robbin-po, robbin-scrum-master
**Requirement:** CMM4 team measurement

## Description

Deterministic team velocity dashboard. Sources chain-completion from `po.chainFollowUp` (trusted denominator), throughput from `git log`, session duration from commit timestamps. ONE clean artifact — PO and SM get identical output on independent runs.

## Invocation

```bash
npx tsx scripts/team-velocity.ts                    # current session
npx tsx scripts/team-velocity.ts --since 2026-06-10 # specific date
npx tsx scripts/team-velocity.ts --hours 5          # last N hours
npx tsx scripts/team-velocity.ts --sprint S19       # scope to sprint
```

## Metrics

### 1. VELOCITY (chain completion rate)
- Source: `po.chainFollowUp --all` canonical denominator
- Formula: `complete / total` (excluding orphanByDesign)
- Delta: `complete_now - complete_at_session_start` (if baseline provided via --baseline)
- Rate: `delta / hours_elapsed`

### 2. THROUGHPUT
- `commits/hr`: total commits in period / hours
- `version-bumps/hr`: commits matching `v0.5.NNN` / hours
- Source: `git log --oneline --since=<start>`

### 3. SESSION DURATION
- First commit → last commit in the period
- Hours elapsed (decimal)
- Active ratio: commits spread across hours (not clustered)

### 4. PROJECTION (labeled ESTIMATE)
- At current velocity (complete/hr), ETA to `total` chains complete
- `remaining / velocity = hours_remaining`
- **CLEARLY LABELED**: "Estimate based on current rate — not a commitment"

## Output Format

```
# Team Velocity Dashboard
Period: 2026-06-10T08:00Z → 2026-06-10T18:00Z (10.0h)

## Chain Completion (po.chainFollowUp canonical)
  Complete: 10/136 (7.4%) — excluded: 40 orphanByDesign
  
## Throughput
  Commits: 156 (15.6/hr)
  Version bumps: 46 (4.6/hr)

## Projection (ESTIMATE)
  Remaining: 126 chains
  At current rate: ~N hours to 136/136
  ⚠ Estimate based on current rate — not a commitment
```

## Determinism guarantee

- All inputs are deterministic: git log (immutable), scenario index (on-disk state)
- No random/time-dependent logic in the output
- Validated: 3 consecutive runs produce identical output
