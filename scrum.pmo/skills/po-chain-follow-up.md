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

### Canonical denominator

The scoreboard reports `COMPLETE / TOTAL (excluded: N orphanByDesign)` where:
- **One row per Requirement** (not per method). Each Req gets ONE summary row showing its first break point or its best complete chain.
- **EXCLUDED**: Requirements tagged `orphanByDesign` (not expected to have chains).
- **Deterministic**: Requirements sorted by altId/name (numeric sort). Same input → same TOTAL on every run.
- **Consistent across modes**: `--all`, `--sprint S19`, and bare UUIDs all use the same row-per-requirement logic.

### Impl-node MANDATORY rule

The Implementation node is **NOT optional**. A complete champagne chain MUST have all 6 distinct nodes linked end-to-end:

```
Req → UC → Class → Method → **Impl** → Test
```

**Method→Test direct (Method.tests[], implementations[]=empty) is INCOMPLETE.** The Impl unit must:
1. **EXIST** as a distinct `ior:class:Implementation` scenario unit
2. Be **REFERENCED** by `Method.implementations[]` (forward link)
3. **REFERENCE** the Test via `Impl.tests[]` (forward link)
4. Have a **REAL** `[impl:uuid:<uuid>]` marker in source code (not a stub/bridge)

If a Test appears to be wired but the Impl node is missing or Method.implementations[] is empty, the chain is INCOMPLETE — the skill flags Impl as `open expert`.

### Chain DONE rule

A chain is DONE **only** when ALL 6 cells show `check`:
- Req `check` + UC `check` + Class `check` + Method `<name>` + Impl `check <impl-uuid>` + Test `check <test-uuid>`
- The Impl cell requires a real `[impl:uuid:]` marker in source AND the Implementation scenario unit wired in `Method.implementations[]`
- The Test cell requires a real `[test:uuid:]` marker in test AND the Test scenario unit wired in `Impl.tests[]`
- Any missing Impl = chain INCOMPLETE even if the Test exists

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
| Implementation missing/stub | expert | See fix-guidance below |
| Test missing/stub | tester | Add `[test:uuid:]` marker in test + create Test unit + wire Impl.tests[] |

### Fix-guidance: Implementation node (expert)

When the Impl cell shows `open expert <method-uuid-short>`:

1. **Find the source file** for the Method (the Class's sourceFile or the file containing the method)
2. **Add `[impl:uuid:<new-v4>]`** comment marker on/near the method in source code
3. **Create** an `ior:class:Implementation` scenario unit: `{ ior: "ior:class:Implementation", model: { uuid: "<new-v4>", name: "<method-name>", sourceFile: "ior:file:<path>", tests: [] }, ownerIor: null }`
4. **Wire forward**: add `ior:instance:<impl-uuid>` to `Method.implementations[]` in the Method's scenario unit
5. **Hand to tester**: tester then creates the Test unit + adds `[test:uuid:]` marker + wires `Impl.tests[]`

**Do NOT skip the Impl node** by wiring Test directly to Method. The 6-step chain requires all 6 nodes.

## Examples

```bash
# Single requirement
npx tsx scripts/po-chain-follow-up.ts cb93f0db-0e42-4795-b41f-2e125120f259

# All S19 requirements
npx tsx scripts/po-chain-follow-up.ts --sprint S19

# Full audit
npx tsx scripts/po-chain-follow-up.ts --all
```
