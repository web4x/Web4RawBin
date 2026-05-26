/**
 * T101 — Typed traceability Object model (Tron's Object.verb model).
 *
 * Object = noun/class; verb = method; references between objects are stored route-like
 * ([impl:uuid:b8c9...] -> "implementation:b8c9..."), serializable as FLAT JSON. The
 * TraceGraph is the registry that rejects duplicate UUIDs and resolves references into a
 * navigable typed object graph (the req -> task -> useCase -> class -> method -> impl/test chain).
 *
 * [impl:uuid:101a0b1c-2d3e-4f50-8617-a01010101101] R15.1 typed object model
 */

export type ObjectType =
  | 'requirement' | 'task' | 'usecase' | 'class' | 'method' | 'implementation' | 'test';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(s: string): boolean {
  return typeof s === 'string' && UUID_V4.test(s);
}

/** Route-like reference to another object: `${type}:${uuid}` (per Tron's flat-JSON model). */
export type ObjectRef = string;
export function toRef(type: ObjectType, uuid: string): ObjectRef { return `${type}:${uuid}`; }
export function refUuid(ref: ObjectRef): string { return ref.slice(ref.indexOf(':') + 1); }

/** Flat, JSON-serializable form of an object: scalars + links as arrays of route refs. */
export interface FlatObject {
  type: ObjectType;
  uuid: string;
  title: string;
  links: Record<string, ObjectRef[]>;
}

/**
 * Registry + navigable graph. Owns object identity (rejects duplicate UUIDs) and resolves
 * references. Objects must belong to a graph to be linked or traversed.
 */
export class TraceGraph {
  private byUuid = new Map<string, TraceObject>();

  register(obj: TraceObject): void {
    if (this.byUuid.has(obj.uuid)) {
      throw new Error(`Duplicate UUID rejected: ${obj.uuid} (${obj.type})`);
    }
    this.byUuid.set(obj.uuid, obj);
  }

  has(uuid: string): boolean { return this.byUuid.has(uuid); }
  get(uuid: string): TraceObject | undefined { return this.byUuid.get(uuid); }
  all(): TraceObject[] { return [...this.byUuid.values()]; }
  ofType(type: ObjectType): TraceObject[] { return this.all().filter(o => o.type === type); }
  get size(): number { return this.byUuid.size; }

  /** Add a bidirectional typed link: a.<relation> += b, b.<inverse> += a. */
  link(a: TraceObject, relation: string, b: TraceObject, inverse: string): void {
    a.addRef(relation, b.uuid);
    b.addRef(inverse, a.uuid);
  }

  /** Resolve a relation's refs on an object into typed instances of the expected type. */
  resolve<T extends TraceObject>(obj: TraceObject, relation: string, type: ObjectType): T[] {
    const out: T[] = [];
    for (const uuid of obj.refs(relation)) {
      const target = this.byUuid.get(uuid);
      if (target && target.type === type) out.push(target as T);
    }
    return out;
  }

  /** Whole-graph flat JSON (Tron: "serialized object state as flat json with references"). */
  toJSON(): FlatObject[] {
    return this.all().map(o => o.toJSON());
  }

  /** Rebuild a graph from flat JSON. Each object's own link side is restored verbatim. */
  static fromJSON(records: FlatObject[]): TraceGraph {
    const graph = new TraceGraph();
    for (const r of records) {
      const obj = makeObject(graph, r.type, r.uuid, r.title);
      for (const [relation, refs] of Object.entries(r.links || {})) {
        for (const ref of refs) obj.addRef(relation, refUuid(ref));
      }
    }
    return graph;
  }
}

/** Base for every traceability object. Carries a validated v4 UUID and route-like links. */
export abstract class TraceObject {
  abstract readonly type: ObjectType;
  readonly uuid: string;
  title: string;
  protected readonly graph: TraceGraph;
  private readonly _links = new Map<string, Set<string>>();

  constructor(graph: TraceGraph, uuid: string, title: string) {
    if (!isUuidV4(uuid)) throw new Error(`Invalid v4 UUID on construction: ${uuid}`);
    this.uuid = uuid;
    this.title = title;
    this.graph = graph;
    graph.register(this); // rejects duplicates (AC4)
  }

  /** UUIDs linked under a relation (own side only). */
  refs(relation: string): string[] {
    return [...(this._links.get(relation) ?? [])];
  }

  /** Internal: append a ref under a relation (used by TraceGraph.link / fromJSON). */
  addRef(relation: string, uuid: string): void {
    let set = this._links.get(relation);
    if (!set) { set = new Set(); this._links.set(relation, set); }
    set.add(uuid);
  }

  ref(): ObjectRef { return toRef(this.type, this.uuid); }

  toJSON(): FlatObject {
    const links: Record<string, ObjectRef[]> = {};
    for (const [relation, uuids] of this._links) {
      links[relation] = [...uuids].map(u => {
        const t = this.graph.get(u);
        return toRef(t ? t.type : ('requirement' as ObjectType), u);
      });
    }
    return { type: this.type, uuid: this.uuid, title: this.title, links };
  }
}

// ── Chain objects ───────────────────────────────────────────────────────────
// Relationship names are paired (forward/inverse) so links stay bidirectional and typed.

export class Requirement extends TraceObject {
  readonly type = 'requirement' as const;
  addTask(t: Task): this { this.graph.link(this, 'tasks', t, 'requirements'); return this; }
  addTest(t: Test): this { this.graph.link(this, 'tests', t, 'requirements'); return this; }
  addImplementation(i: Implementation): this { this.graph.link(this, 'implementations', i, 'requirements'); return this; }
  get tasks(): Task[] { return this.graph.resolve<Task>(this, 'tasks', 'task'); }
  get tests(): Test[] { return this.graph.resolve<Test>(this, 'tests', 'test'); }
  get implementations(): Implementation[] { return this.graph.resolve<Implementation>(this, 'implementations', 'implementation'); }
}

export class Task extends TraceObject {
  readonly type = 'task' as const;
  addUseCase(u: UseCase): this { this.graph.link(this, 'useCases', u, 'tasks'); return this; }
  get requirements(): Requirement[] { return this.graph.resolve<Requirement>(this, 'requirements', 'requirement'); }
  get useCases(): UseCase[] { return this.graph.resolve<UseCase>(this, 'useCases', 'usecase'); }
}

export class UseCase extends TraceObject {
  readonly type = 'usecase' as const;
  addClass(c: TraceClass): this { this.graph.link(this, 'classes', c, 'useCases'); return this; }
  get tasks(): Task[] { return this.graph.resolve<Task>(this, 'tasks', 'task'); }
  get classes(): TraceClass[] { return this.graph.resolve<TraceClass>(this, 'classes', 'class'); }
}

export class TraceClass extends TraceObject {
  readonly type = 'class' as const;
  addMethod(m: Method): this { this.graph.link(this, 'methods', m, 'classes'); return this; }
  get useCases(): UseCase[] { return this.graph.resolve<UseCase>(this, 'useCases', 'usecase'); }
  get methods(): Method[] { return this.graph.resolve<Method>(this, 'methods', 'method'); }
}

export class Method extends TraceObject {
  readonly type = 'method' as const;
  addImplementation(i: Implementation): this { this.graph.link(this, 'implementations', i, 'methods'); return this; }
  addTest(t: Test): this { this.graph.link(this, 'tests', t, 'methods'); return this; }
  get classes(): TraceClass[] { return this.graph.resolve<TraceClass>(this, 'classes', 'class'); }
  get implementations(): Implementation[] { return this.graph.resolve<Implementation>(this, 'implementations', 'implementation'); }
  get tests(): Test[] { return this.graph.resolve<Test>(this, 'tests', 'test'); }
}

export class Implementation extends TraceObject {
  readonly type = 'implementation' as const;
  addTest(t: Test): this { this.graph.link(this, 'tests', t, 'implementations'); return this; }
  get requirements(): Requirement[] { return this.graph.resolve<Requirement>(this, 'requirements', 'requirement'); }
  get methods(): Method[] { return this.graph.resolve<Method>(this, 'methods', 'method'); }
  get tests(): Test[] { return this.graph.resolve<Test>(this, 'tests', 'test'); }
}

export class Test extends TraceObject {
  readonly type = 'test' as const;
  get requirements(): Requirement[] { return this.graph.resolve<Requirement>(this, 'requirements', 'requirement'); }
  get methods(): Method[] { return this.graph.resolve<Method>(this, 'methods', 'method'); }
  get implementations(): Implementation[] { return this.graph.resolve<Implementation>(this, 'implementations', 'implementation'); }
}

/** Factory used by TraceGraph.fromJSON to rebuild typed instances from flat records. */
export function makeObject(graph: TraceGraph, type: ObjectType, uuid: string, title: string): TraceObject {
  switch (type) {
    case 'requirement': return new Requirement(graph, uuid, title);
    case 'task': return new Task(graph, uuid, title);
    case 'usecase': return new UseCase(graph, uuid, title);
    case 'class': return new TraceClass(graph, uuid, title);
    case 'method': return new Method(graph, uuid, title);
    case 'implementation': return new Implementation(graph, uuid, title);
    case 'test': return new Test(graph, uuid, title);
    default: throw new Error(`Unknown object type: ${type}`);
  }
}
