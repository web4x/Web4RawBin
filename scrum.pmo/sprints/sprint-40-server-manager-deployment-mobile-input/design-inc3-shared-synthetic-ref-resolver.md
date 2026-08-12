# inc-3 (unified A3 + AC4) — ONE shared synthetic-ref resolver (architect, 2026-08-12)

PO-approved unification: R40.37 **AC4** (diagrams container kind never resolves) and S37 **A3** (all /model tree selections show empty detail) have ONE root and collapse into ONE fix. HARD CONSTRAINT: extract ONE shared resolver, three importers, grep-lint no second parse — do NOT patch the detail path to match the nav path (two agreeing call sites is how they drifted).

## The class (name it)
**Synthetic refs (`prefix:pathKey`) that do not survive an assumption of `type:realUuid`.** A synthetic view ref carries its meaning in the PREFIX + a path/key that is NOT a real instance uuid (`dir:public/ts`, `file:src/…/X.ts`, `puml-src:…`, `project:RawBin`, `rawbin:diagram`, `mof-m1/m2`, `collection`…). Three places assumed `type:realUuid` and mangled it:
1. **DETAIL** — `renderDetailForRef` (rb-detail-drawer.ts:235-237) splits at first colon → `type` + bareKey; `resolveDetailUnit:300` fetches `/api/ior/ior:instance:${bareKey}` → 404 for a path-key → empty detail = **A3**.
2. **ACTION-BAR** — `refUuid('rawbin:diagram')` → `'diagram'` (strips the prefix) → wrong graph-obj → misses the kind = **AC4**.
3. (**NAV** — rb-detail-drawer.ts:100 — is the ONLY one that got it RIGHT: synthetic-prefix regex → `/api/ior/${FULL rawRef}` → ensureViewUnit lazy-mint.)

Two-source bug INSIDE ONE FILE (nav vs detail), plus a third consumer (action-bar). "One truth read twice/thrice."

### ★ PROXIMATE A3 mechanism (sharpened via the S37 map — the collection-branch mis-fire)
`mofFolder` (server.ts:1114) DEFAULTS `type='collection'` for synthetic folder/container nodes, and synthetic uuids embed their own prefix — so a folder tree node becomes itemRef `collection:dir:src/ts/server` (DOUBLE-prefixed) and the diagrams container becomes `collection:rawbin:diagram`. The drawer splits at the first colon → `type='collection'`, then the **collection-branch (rb-detail-drawer.ts:240-257)** — built ONLY for room `members-<roomUuid>`/`files-<roomUuid>` collections — runs `roomUuid = uuid.split('-').slice(1).join('-'); if(!roomUuid) return;`. A synthetic `dir:…`/`rawbin:…` uuid has no `-`-delimited roomUuid → **early `return` → empty detail, BEFORE resolveDetailUnit is ever reached.** So the fix is not only "resolve synthetic refs right" — it is: the collection-branch must fire ONLY for genuine room collections; synthetic folder/container refs route through the shared resolver to their real lazy-minted Folder unit. (This also converges with S37-B: room members-/files- become real Folder units too, so the collection-branch ultimately RETIRES — every folder/collection is a real Folder unit resolved by the one resolver.)

## The fix — ONE resolver, THREE importers
Extract a single shared resolver (in `src/ts/shared/` or `src/public/ts/trace/synthetic-ref.ts`, importable by client trace + model bundles):
```ts
// The ONE place that knows how a ref (real OR synthetic) becomes a real unit.
export const SYNTHETIC_PREFIX = /^(dir:|file:|puml-src:|project:|rawbin:|mof-m1|mof-m2|collection)/;
export async function resolveRefUnit(rawRef: string): Promise<{ uuid: string; type: string; kind?: string; unit: any } | null> {
  const iorPath = SYNTHETIC_PREFIX.test(rawRef)
    ? `/api/ior/${encodeURIComponent(rawRef)}`          // FULL raw ref → ensureViewUnit lazy-mint (the nav-path way)
    : `/api/ior/ior:instance:${refUuid(rawRef) || rawRef}`; // real type:uuid ref → instance lookup
  const j = await fetch(iorPath).then(r => r.ok ? r.json() : null).catch(() => null);
  const m = j?.unit?.model; if (!m?.uuid) return null;
  return { uuid: String(m.uuid), type: String(j.unit.ior?.split(':')[2] || '').toLowerCase(), kind: m.kind ? String(m.kind) : undefined, unit: j.unit };
}
```
**Three importers, each DELETING its local parse:**
1. **DETAIL** `renderDetailForRef`/`resolveDetailUnit`: replace the split-at-colon + `ior:instance:${bareKey}` with `resolveRefUnit(rawRef)` → use the returned `{uuid,type,kind}` to pick the tag + build the detail graph (kind included, R40.37:305). Fixes A3.
2. **ACTION-BAR** kind lookup (where `refUuid('rawbin:diagram')` feeds `applicableActionsFor`): get `kind` from `resolveRefUnit(rawRef).kind`, never `refUuid`+graph.get. Fixes AC4 (add-diagram matches `kinds:['diagrams']` on the real resolved kind).
3. **NAV** (rb-detail-drawer.ts:100): replace the inline synthetic-regex+fetch with `resolveRefUnit` (it already did the right thing — now it does it via the shared path so it can't drift from detail).
- ★ `refUuid()` stays ONLY for genuine `type:realUuid` refs; it must NEVER be applied to a synthetic ref. The resolver is the sole synthetic-ref parser.

## Grep-lint (no second parse survives — same shape as APPROVE_STATUSES / FROZEN_LEGACY_MAX / statusSymbol)
A check-gate asserting the synthetic-ref parse exists in EXACTLY ONE place: grep for `ior:instance:${` split-parses, the `SYNTHETIC_PREFIX` regex literal, and `refUuid(` applied to a rawRef that can be synthetic — outside `synthetic-ref.ts` → RED. So a fourth consumer can't hand-roll a fourth parse. Report-only→strict if it finds pre-existing ones (finishability), but for these 3 the target is 0-outside-the-resolver immediately (we're deleting all three local parses).

## Gate (BITE + stub-must-fail)
- **A3:** for EACH /model tree ref type (dir/file/puml-src/project/rawbin/collection/real-uuid) → detail renders CONTENT, not empty. @390 real-WebKit for the device cell (Tron).
- **AC4:** `rawbin:diagram` resolves → kind='diagrams' → add-diagram OFFERED only on the diagrams container; folder/task → ABSENT.
- **Idempotent lazy-mint:** resolve a synthetic ref TWICE → exactly ONE unit (deterministic keyToUuid).
- **stub-must-fail ON THE CHECK:** (a) reintroduce a split-at-colon synthetic parse anywhere → grep-lint RED; (b) point the resolver at `ior:instance:${bareKey}` for a synthetic ref → A3 cell RED (404/empty). A gate that can't catch the regression certifies nothing.

## Sequencing
inc-1+inc-2 deploy GO (already ruled). This unified inc-3 lands the shared resolver + the 3 importers + grep-lint, closing R40.37-AC4 AND S37-A3 together. It is the FIRST S37 item because it's already fully measured and it's the same ensureViewUnit invariant family.
