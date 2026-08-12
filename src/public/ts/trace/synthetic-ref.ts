// inc-3 (unified S37-A3 + R40.37-AC4, architect design-inc3-shared-synthetic-ref-resolver.md) — THE ONE place that
// knows how a ref (real OR synthetic) becomes a real unit. Extracted so DETAIL, ACTION-BAR and NAV all resolve refs
// IDENTICALLY (two agreeing call sites is how nav & detail drifted). refUuid() is ONLY for genuine type:realUuid refs
// and must NEVER touch a synthetic ref — this resolver is the SOLE synthetic-ref parser (enforced by a grep-lint).
import { refUuid } from '../../../ts/shared/TraceModel.js';

// A synthetic view ref carries its meaning in the PREFIX + a path/key that is NOT a real instance uuid.
export const SYNTHETIC_PREFIX = /^(dir:|file:|puml-src:|project:|rawbin:|mof-m1|mof-m2|collection)/;
export const isSyntheticRef = (rawRef: string): boolean => SYNTHETIC_PREFIX.test(rawRef);

export type ResolvedRef = { uuid: string; type: string; kind?: string; unit: Record<string, unknown> };

// resolveRefUnit(rawRef) → the REAL unit for a ref: a synthetic ref goes to /api/ior/<FULL rawRef> (server
// ensureViewUnit lazy-mints it, idempotent via keyToUuid), a real type:uuid ref goes to the instance lookup. Returns
// the FULL unit (model + ior) so callers can read {uuid,type,kind} AND (the coming S37-A DnD serializer) the whole
// unit JSON. `opts` is a forward seam for the cross-instance origin-aware variant (Tron's IOR-origin cluster) — unused
// today, present so a 4th importer doesn't reshape the signature. NEVER apply refUuid to a synthetic ref.
export async function resolveRefUnit(rawRef: string, _opts?: { originHost?: string }): Promise<ResolvedRef | null> {
  let ref = String(rawRef || '');
  if (!ref) return null;
  // inc-3: a synthetic folder/container tree node is emitted DOUBLE-prefixed (mofFolder defaults type='collection' →
  // `collection:rawbin:diagram`, `collection:dir:src/…`). The meaningful ref is the inner synthetic ref → strip the
  // redundant outer `collection:` when the remainder is ITSELF synthetic. A GENUINE room collection (`collection:members-
  // <uuid>` / `collection:files-<uuid>`) has a non-synthetic remainder → left untouched (its own branch handles it).
  // ★ KNOWN-COMPENSATED (architect 0.3): mofFolder's type='collection' default is compensated HERE at the resolver (the
  // single ref-interpretation point), NOT fixed at source — a future tree cleanup could have mofFolder emit the real type; not now.
  if (ref.startsWith('collection:') && isSyntheticRef(ref.slice('collection:'.length))) ref = ref.slice('collection:'.length);
  const iorPath = isSyntheticRef(ref)
    ? `/api/ior/${encodeURIComponent(ref)}`                    // FULL raw ref → ensureViewUnit lazy-mint (the nav-path way)
    : `/api/ior/ior:instance:${refUuid(ref) || ref}`;          // genuine type:realUuid ref → instance lookup
  const j = await fetch(iorPath).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const m = (j?.unit?.model || null) as Record<string, unknown> | null;
  if (!m?.uuid) return null;
  const iorClass = String((j.unit as { ior?: string })?.ior || '');
  return {
    uuid: String(m.uuid),
    type: (iorClass.split(':')[2] || '').toLowerCase(),
    kind: m.kind != null ? String(m.kind) : undefined,
    unit: j.unit as Record<string, unknown>,
  };
}
