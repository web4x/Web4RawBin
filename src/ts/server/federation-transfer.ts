/**
 * T26.4 (R26.4) + T26.5 (R26.5) — Federation Transfer: import a federated scenario unit into the local index.
 *
 * Principle: STRUCTURE eager, PAYLOAD lazy, IDENTITY by-reference (design §4-5).
 *  - resolveChildrenLazily: the primary unit is eager; children stay federated `@host` refs (dereferenced on
 *    demand via the R26.1 loader / R26.3 fetch); File BYTES fetch on first open (contentHash dedup); room
 *    MEMBERS stay identity references — NEVER minted as local profiles (the R25.7 duplication invariant).
 *  - reconcileConflict: same uuid+origin → idempotent (update-if-newer / no-op); same uuid + DIFFERENT origin
 *    → re-mint under a fresh local uuid + provenance; a reference-rewrite pass keeps the chain intact.
 */
import crypto from 'node:crypto';
import { ScenarioIndex } from '../scenario/index.js';
import type { ScenarioUnit } from '../scenario/types.js';
import { federatedIor } from '../scenario/federated-ior.js';

export interface TransferCtx {
  index: ScenarioIndex;
  selfHost?: string;
  hasContentHash?: (hash: string) => boolean; // receiver's content-addressable store check (cross-server dedup)
}

export interface LazyPlan { eager: ScenarioUnit; childRefs: string[]; memberRefs: string[]; lazyBytes: boolean; }
export type ReconcileAction = 'noop' | 'update' | 'mint' | 'remint';
export interface ReconcileResult { action: ReconcileAction; localUuid: string; unit: ScenarioUnit; remapped: boolean; }

export class Transfer {
  constructor(private ctx: TransferCtx) {}

  // [impl:uuid:3b17aad3-0587-48f6-8da6-3eaf54a9a84d] R26.4 Transfer.resolveChildrenLazily
  resolveChildrenLazily(unit: ScenarioUnit, originHost: string): LazyPlan {
    const m = (unit.model || {}) as any;
    // children stay as federated @host IORs — dereferenced on demand, not eagerly imported
    const childRefs = (Array.isArray(m.children) ? m.children : []).map((r: string) =>
      federatedIor(String(r).replace('ior:instance:', '').split('@')[0], originHost, this.ctx.selfHost));
    // R25.7 INVARIANT: room members transfer as federated identity references — NEVER minted as local profiles
    // (a foreign member materializes locally only on later connect+consolidate → redirectTo).
    const memberRefs = (Array.isArray(m.members) ? m.members : []).map((mem: any) =>
      federatedIor(String(mem?.ior || mem).replace('ior:instance:', '').split('@')[0], originHost, this.ctx.selfHost));
    // File bytes are LAZY: fetched on first preview via R26.3 /content, deduped by contentHash — not now.
    const lazyBytes = unit.ior === 'ior:class:File' && !!m.contentHash;
    return { eager: unit, childRefs, memberRefs, lazyBytes };
  }

  /** Cross-server content dedup: the receiver already stores these bytes (by hash) → skip the transfer, relink. */
  contentAlreadyLocal(unit: ScenarioUnit): boolean {
    const h = (unit.model as any)?.contentHash;
    return !!h && !!this.ctx.hasContentHash?.(h);
  }

  // [impl:uuid:8d34ad57-e1ec-4d71-8348-4efa345a07f3] R26.5 Transfer.reconcileConflict
  reconcileConflict(incoming: ScenarioUnit, originHost: string, remap: Map<string, string>): ReconcileResult {
    const m = { ...((incoming.model || {}) as any) };
    const uuid = String(m.uuid);
    const provenance = { originHost, originIor: `ior:instance:${uuid}@${originHost}` };
    const existing = this.ctx.index.get(uuid);
    if (existing) {
      const ex = existing.model as any;
      // same SOURCE = the incoming origin is us (self), or the existing copy came from that same origin.
      // A LOCAL-born unit (no originHost) colliding with a REMOTE incoming of the same uuid is a genuine
      // collision → re-mint (do NOT treat local-born as same-origin).
      const sameSource = (originHost === this.ctx.selfHost) || (!!ex.originHost && ex.originHost === originHost);
      if (sameSource) {
        // same logical unit (a re-drag) → idempotent: update only if the remote is newer, else no-op
        if ((m.updatedAt || 0) > (ex.updatedAt || 0)) return { action: 'update', localUuid: uuid, unit: { ...incoming, model: { ...m, ...provenance } }, remapped: false };
        return { action: 'noop', localUuid: uuid, unit: existing, remapped: false };
      }
      // genuine collision (same uuid, DIFFERENT origin) → re-mint under a fresh local uuid + record provenance + remap
      const fresh = crypto.randomUUID();
      remap.set(uuid, fresh);
      return { action: 'remint', localUuid: fresh, unit: { ...incoming, model: { ...m, uuid: fresh, ...provenance } }, remapped: true };
    }
    // new locally → mint keeping the uuid, stamp provenance
    return { action: 'mint', localUuid: uuid, unit: { ...incoming, model: { ...m, ...provenance } }, remapped: false };
  }

  /**
   * Reference-rewrite pass (R26.5 remap): every forward ref (children[]/parentFolder) — a target IN this
   * transfer → its new local uuid; a target that stays remote → a federated `@host` IOR (lazy resolve);
   * already-local → relink. Keeps the traceability chain intact across the federation boundary.
   */
  rewriteForwardRefs(unit: ScenarioUnit, originHost: string, remap: Map<string, string>): ScenarioUnit {
    const m = { ...((unit.model || {}) as any) };
    const rewrite = (ref: string): string => {
      const bare = String(ref).replace('ior:instance:', '').split('@')[0];
      if (remap.has(bare)) return `ior:instance:${remap.get(bare)}`;   // remapped in this transfer → new local uuid
      if (this.ctx.index.get(bare)) return `ior:instance:${bare}`;      // already local → relink
      return federatedIor(bare, originHost, this.ctx.selfHost);         // stays remote → federated @host (lazy)
    };
    if (Array.isArray(m.children)) m.children = m.children.map(rewrite);
    if (m.parentFolder) m.parentFolder = rewrite(String(m.parentFolder));
    return { ...unit, model: m };
  }
}
