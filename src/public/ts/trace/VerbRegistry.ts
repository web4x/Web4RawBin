/**
 * T103 — VerbRegistry: maps `<type>.<verb>` → handler. Verbs (show/list/edit/link/unlink)
 * are the addressable surface (Object.verb = OOSH-CLI command = route). Keeping verbs here,
 * OUT of the pure TraceModel, is why the shared model stays DOM- and behavior-free.
 *
 * [impl:uuid:103c2d3e-4f50-4162-8839-c03030303103] AC1 verb addressable as route
 */
import type { TraceGraph, TraceObject } from '../../../ts/shared/TraceModel.js';

/** Minimal navigation surface a handler may call — structural, to avoid a TraceRouter import cycle. */
export interface Navigator {
  navigate(type: string, verb?: string, params?: Record<string, string>): void;
}

export interface VerbContext {
  graph: TraceGraph;
  obj?: TraceObject;                 // resolved target (present for instance verbs like show/edit)
  params: Record<string, string>;
  mount: HTMLElement;
  router: Navigator;
}

export type VerbHandler = (ctx: VerbContext) => void;

export class VerbRegistry {
  private handlers = new Map<string, VerbHandler>();

  register(type: string, verb: string, handler: VerbHandler): this {
    this.handlers.set(`${type}.${verb}`, handler);
    return this;
  }

  resolve(type: string, verb: string): VerbHandler | undefined {
    return this.handlers.get(`${type}.${verb}`);
  }

  has(type: string, verb: string): boolean {
    return this.handlers.has(`${type}.${verb}`);
  }

  /** Rendered when no type.verb handler matches — never throw to the user. */
  notFound(mount: HTMLElement, _type?: string, _verb?: string): void {
    mount.innerHTML = '';
  }
}
