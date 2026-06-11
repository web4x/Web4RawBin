# po.chainFollowUp

**UUID:** `bf29a301-c4d5-4e6f-9a7b-8c0d1e2f3a4b`
**Roles:** robbin-po
**Requirement:** R17.13, R-E (6-step chain closure)

## Description

Given one or more Requirement IORs, walk the 6-step champagne chain (Req→UC→Class→Method→Impl→Test) node-by-node and produce a scoreboard table. Each cell is `check` (done) or `open <owner> <IOR>` (gap). The PO dispatches each open node to its owner. A chain is DONE only when its Test cell is a real green `[test:uuid:]` marker.

Distinguishes REAL `[impl:uuid:]`/`[test:uuid:]` source markers from stubs/file-pointers (bridge units without markers in actual source code).

## Invocation

```bash
npx tsx scripts/po-chain-follow-up.ts <req-uuid> [<req-uuid> ...]
npx tsx scripts/po-chain-follow-up.ts --all
npx tsx scripts/po-chain-follow-up.ts --sprint S19
```

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `reqUuids` | `uuid[]` | ✓ (or --all/--sprint) | Requirement UUIDs to audit |
| `--all` | `flag` | | Audit ALL requirements in scenario index |
| `--sprint` | `string` | | Filter to requirements mentioning this sprint |

## Canonical Output Format

One row per chain, one column per champagne node:

```
| Chain | Req | UC | Class | Method | Impl | Test |
|-------|-----|-----|-------|--------|------|------|
| R19.36 DnD file-upload | check | check | check | uploadFile | check 9905fbfa | check 1e763397 |
| R19.38 Message units | check | check | check | createMessageUnit | open expert 7a983076 | open |
```

### Cell format rules

| Cell | Done | Open |
|------|------|------|
| Req | `check` | `open` (should never happen — input is a req) |
| UC | `check` | `open architect` |
| Class | `check` | `open architect` |
| Method | `<method-name>` (always the speaking name) | `open architect` |
| Impl | `check <impl-uuid-short>` (real `[impl:uuid:]` in source) | `open expert <method-uuid-short>` |
| Test | `check <test-uuid-short>` (real `[test:uuid:]` in test) | `open tester` |

### Chain DONE rule

A chain is DONE **only** when its Test cell shows `check <uuid>` — meaning a real `[test:uuid:]` marker exists in a test file AND the Test scenario unit is wired to an Implementation that has a real `[impl:uuid:]` marker.

## Steps

1. Load Requirement unit(s) from scenario index
2. Walk chain: `req.useCases[]` → `uc.classes[]` → `class.methods[]` → `method.implementations[]` → `impl.tests[]`
3. For each Implementation: scan source files for real `[impl:uuid:<uuid>]` — distinguish from stubs
4. For each Test: scan test files for real `[test:uuid:<uuid>]` — distinguish from stubs
5. Emit scoreboard table with `check`/`open` cells + method names + marker UUIDs
6. Emit dispatch list: numbered open nodes with owner + action

## Owner Assignment Rules

| Gap Type | Owner | Action |
|----------|-------|--------|
| UseCase missing | architect | Create UC + wire to Req.useCases[] |
| Class missing | architect | Create Class + wire to UC.classes[] |
| Method missing | architect | Create Method + wire to Class.methods[] |
| Implementation missing/stub | expert | Add `[impl:uuid:]` marker in source + create/wire Impl unit |
| Test missing/stub | tester | Add `[test:uuid:]` marker in test + create/wire Test unit |

## Examples

```bash
# Single requirement
npx tsx scripts/po-chain-follow-up.ts cb93f0db-0e42-4795-b41f-2e125120f259

# All S19 requirements
npx tsx scripts/po-chain-follow-up.ts --sprint S19

# Full audit
npx tsx scripts/po-chain-follow-up.ts --all
```
