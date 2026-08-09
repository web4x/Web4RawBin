// R32.1 MDA identity gate (architect build spec 124f9955d §B; req chain e0279b81→cdcc4988→4d0883ad, UC 2b3d6307).
// The federated-IOR pin: identity IS the uuid; representations reference it; the gate makes drift IMPOSSIBLE
// (correct-by-construction, like versionGuard / the camelCase gate). Runs over every ior:class:ModelElement unit
// ON DISK (the seed's output). Pure + framework-free; NO device code. Empty result = PASS.

export interface ModelViolation { assertion: string; uuid?: string; detail: string; }

// Duck-typed index (ScenarioIndex-compatible) so this stays dependency-light (no cross-dir import).
export interface UnitIndex {
  list(): string[];
  get(uuid: string): { ior?: string; model?: Record<string, unknown> } | null;
}

type MetaLevel = 'M3' | 'M2' | 'M1';
const RANK: Record<MetaLevel, number> = { M3: 3, M2: 2, M1: 1 };
const stripRef = (r: string): string => r.replace(/^ior:instance:/, '').replace(/^modelelement:/, '');

interface Elem { uuid: string; metaLevel: MetaLevel; kind: string; name: string; instanceOf: string[] }

export class ModelValidator {
  // [impl:uuid:4d0883ad-d3a6-4663-97ce-ea8defb207e0] ModelValidator.validate (Method cdcc4988, Class e0279b81, off UC 2b3d6307)
  // The 5 R32.1 identity assertions over all on-disk ModelElement units. 1-3 are structural (exercised by the seed);
  // 4-5 guard serialization/representation — for the R32.1 FOUNDATION we assert the marker CONVENTION + bindByUuid
  // exist (Layers 3/4 exercise them live). Returns [] when the model is identity-clean.
  validate(index: UnitIndex): ModelViolation[] {
    const elems: Elem[] = [];
    for (const uuid of index.list()) {
      const s = index.get(uuid);
      if (!s || s.ior !== 'ior:class:ModelElement') continue;
      const m = (s.model || {}) as Record<string, unknown>;
      elems.push({
        uuid: String(m.uuid || uuid),
        metaLevel: m.metaLevel as MetaLevel,
        kind: String(m.kind || ''),
        name: String(m.name || ''),
        instanceOf: (Array.isArray(m.instanceOf) ? (m.instanceOf as string[]) : []).map(stripRef),
      });
    }
    const byUuid = new Map(elems.map((e) => [e.uuid, e]));
    const V: ModelViolation[] = [];

    // 1. AC-uuid-unique — no uuid appears twice on disk (TraceGraph.register also throws on load-dup).
    const seen = new Set<string>();
    for (const e of elems) {
      if (seen.has(e.uuid)) V.push({ assertion: 'uuid-unique', uuid: e.uuid, detail: 'uuid present in more than one unit' });
      seen.add(e.uuid);
    }

    for (const e of elems) {
      // 3. AC-instanceof-nonempty — every M2/M1 has ≥1 instanceOf (M3 self-types).
      if (e.metaLevel !== 'M3' && e.instanceOf.length === 0) {
        V.push({ assertion: 'instanceof-nonempty', uuid: e.uuid, detail: `${e.metaLevel} '${e.name}' has empty instanceOf` });
      }
      // 2. AC-level-integrity — each instanceOf resolves EXACTLY one level up (M1→M2, M2→M3); M3 reflexive (→M3).
      for (const ref of e.instanceOf) {
        const meta = byUuid.get(ref);
        if (!meta) { V.push({ assertion: 'level-integrity', uuid: e.uuid, detail: `instanceOf '${ref}' does not resolve to a ModelElement` }); continue; }
        if (e.metaLevel === 'M3') {
          if (meta.metaLevel !== 'M3') V.push({ assertion: 'level-integrity', uuid: e.uuid, detail: `M3 '${e.name}' instanceOf ${meta.metaLevel} '${meta.name}' (M3 is reflexive/self-typed)` });
        } else if (RANK[meta.metaLevel] !== RANK[e.metaLevel] + 1) {
          V.push({ assertion: 'level-integrity', uuid: e.uuid, detail: `${e.metaLevel} '${e.name}' instanceOf ${meta.metaLevel} '${meta.name}' (not exactly one level up)` });
        }
      }
    }
    return V;
  }

  // Assertion 4/5 support (Layers 3/4 exercise live): re-bind a uuid embedded in a .puml/.ts artifact to the
  // EXISTING unit — never re-mint. This is the no-duplication law rooted in the identity.
  bindByUuid(index: UnitIndex, embeddedUuid: string): { ior?: string; model?: Record<string, unknown> } | null {
    const s = index.get(embeddedUuid);
    return s && s.ior === 'ior:class:ModelElement' ? s : null;
  }

  // The canonical identity marker a serialization MUST embed (mirrors [impl:uuid:]) so a round-trip re-binds to X.
  static modelMarker(uuid: string): string { return `[model:uuid:${uuid}]`; }

  // Assertion 4 — a .puml/.ts emission of X must embed X's marker (fed real artifacts in R32.7/8).
  assertSerializationEmbedsUuid(serialized: string, uuid: string): ModelViolation[] {
    return serialized.includes(ModelValidator.modelMarker(uuid)) || serialized.includes(`uuid:${uuid}`)
      ? [] : [{ assertion: 'serialization-embeds-uuid', uuid, detail: 'serialization does not embed the element uuid' }];
  }

  // Assertion 5 — an element in ≥2 representations shows the IDENTICAL uuid in each.
  assertSameUuidCrossRepresentation(name: string, reps: Record<string, string>): ModelViolation[] {
    const present = Object.values(reps).filter(Boolean);
    if (present.length < 2) return [];
    return present.every((u) => u === present[0]) ? []
      : [{ assertion: 'same-uuid-cross-representation', detail: `'${name}' divergent uuids across representations: ${JSON.stringify(reps)}` }];
  }
}
