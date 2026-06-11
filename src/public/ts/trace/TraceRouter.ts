/**
 * T103 — TraceRouter (Controller): location.hash ⇄ Object.verb route.
 *
 *   #<type>.<verb>?<param>=<value>&…   e.g.  #requirement.show?uuid=15a1b2c3-…
 *   method = anchor verb; args = query params; default verb = show; ref params reuse type:uuid.
 *
 * parse → resolve target from TraceGraph → dispatch to VerbRegistry[type.verb] → render View.
 * Bookmarkable/shareable OOSH-CLI-like URLs. Unknown route → registry.notFound (never throws).
 *
 * [impl:uuid:9ce0b153-0c3d-4749-aa57-954b359b797d] AC1 route resolution
 */
import type { TraceGraph } from '../../../ts/shared/TraceModel.js';
import { VerbRegistry, type Navigator } from './VerbRegistry.js';
import { setActiveRouter } from './nav.js';

export interface TraceRoute {
  type: string;
  verb: string;
  params: Record<string, string>;
}

export function parseHash(hash: string): TraceRoute | null {
  const h = (hash || '').replace(/^#/, '').trim();
  if (!h) return null;
  const qi = h.indexOf('?');
  const path = qi === -1 ? h : h.slice(0, qi);
  const query = qi === -1 ? '' : h.slice(qi + 1);
  const dot = path.indexOf('.');
  const type = dot === -1 ? path : path.slice(0, dot);
  const verb = dot === -1 ? 'show' : path.slice(dot + 1) || 'show';
  const params: Record<string, string> = {};
  for (const kv of query.split('&')) {
    if (!kv) continue;
    const eq = kv.indexOf('=');
    const k = eq === -1 ? kv : kv.slice(0, eq);
    const v = eq === -1 ? '' : kv.slice(eq + 1);
    params[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return { type, verb, params };
}

export function buildHash(type: string, verb = 'show', params: Record<string, string> = {}): string {
  const q = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `#${type}.${verb}${q ? '?' + q : ''}`;
}

export class TraceRouter implements Navigator {
  constructor(
    private graph: TraceGraph,
    private registry: VerbRegistry,
    private mount: HTMLElement,
  ) {}

  start(): void {
    setActiveRouter(this); // Views (rb-object-item) navigate through the active router
    window.addEventListener('hashchange', () => this.route());
    this.route();
  }

  /** Route the current hash (or an explicit one) — pure dispatch, returns the matched route. */
  route(hash: string = (typeof location !== 'undefined' ? location.hash : '')): TraceRoute | null {
    const r = parseHash(hash);
    if (!r) { this.registry.notFound(this.mount); return null; }
    const handler = this.registry.resolve(r.type, r.verb);
    if (!handler) { this.registry.notFound(this.mount, r.type, r.verb); return r; }
    const obj = r.params.uuid ? this.graph.get(r.params.uuid) : undefined;
    handler({ graph: this.graph, obj, params: r.params, mount: this.mount, router: this });
    return r;
  }

  navigate(type: string, verb = 'show', params: Record<string, string> = {}): void {
    const hash = buildHash(type, verb, params);
    if (typeof location !== 'undefined') location.hash = hash;
    else this.route(hash); // headless fallback (tests)
  }
}
