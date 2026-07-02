/**
 * T26.1 (R26.1) — Federated IOR: cross-server provenance + pluggable, lazy resolution.
 *
 * An IOR gains an OPTIONAL host suffix: `ior:instance:<uuid>@<originHost>`. A local IOR omits `@host`
 * (implicit self) → 100% back-compatible with every existing `ior:instance:<uuid>`. An imported unit
 * records provenance in `model.originHost` + `model.originIor`. Resolution is polymorphic via a loader
 * registry: no-`@host`/`@self` → local `ScenarioIndex.get`; `@remote` → a registered federated loader
 * (fetches via R26.3), so a federated IOR dereferences lazily anywhere it appears (ISR-style).
 *
 * Design: scrum.pmo/design-notes/federated-scenario-transfer.md §1.
 */
import type { ScenarioUnit } from './types.js';

export interface FederatedRef {
  uuid: string;
  originHost: string | null; // null = local (implicit self / @self)
  raw: string;
}

/** Parse the optional `@originHost` suffix. Local IORs (no `@host` / `@self`) yield originHost=null. */
export function parseFederatedIor(ior: string): FederatedRef {
  const raw = String(ior || '').trim();
  const body = raw.replace(/^ior:instance:/, '');
  const at = body.indexOf('@');
  if (at < 0) return { uuid: body, originHost: null, raw };
  const host = body.slice(at + 1).trim();
  return { uuid: body.slice(0, at), originHost: (host === '' || host === 'self') ? null : host, raw };
}

/** Is this reference resolvable locally? (no origin, @self, or origin === this server's canonical host) */
export function isLocalOrigin(originHost: string | null, selfHost?: string): boolean {
  return !originHost || originHost === 'self' || (!!selfHost && originHost === selfHost);
}

/** Build an IOR string — appends `@originHost` ONLY when remote (local stays bare, back-compatible). */
export function federatedIor(uuid: string, originHost?: string | null, selfHost?: string): string {
  return isLocalOrigin(originHost ?? null, selfHost) ? `ior:instance:${uuid}` : `ior:instance:${uuid}@${originHost}`;
}

/** Provenance stamp for an IMPORTED unit (local-born units omit both). originHost = canonical https:// origin. */
export function federatedProvenance(originHost: string, originIor: string): { originHost: string; originIor: string } {
  return { originHost, originIor };
}

export type LocalLoader = (uuid: string) => ScenarioUnit | null | undefined;
export type FederatedLoader = (uuid: string, originHost: string) => Promise<ScenarioUnit | null>;

// Pluggable loader registry (parallels the local FileLoader registration). R26.3 registers the fetch loader.
let _federatedLoader: FederatedLoader | null = null;
export function registerFederatedLoader(loader: FederatedLoader | null): void { _federatedLoader = loader; }
export function hasFederatedLoader(): boolean { return !!_federatedLoader; }

/**
 * [impl:uuid:d2cde3fc-a97f-4b12-9746-25c201d8e901] R26.1 IORResolver.resolveFederated — polymorphic loader:
 * local → ScenarioIndex.get; remote → the registered federated loader (fetch). Lazily dereferences anywhere.
 */
export async function resolveFederated(ior: string, localGet: LocalLoader, selfHost?: string): Promise<ScenarioUnit | null> {
  const ref = parseFederatedIor(ior);
  if (isLocalOrigin(ref.originHost, selfHost)) return localGet(ref.uuid) || null;
  if (!_federatedLoader) return null; // no federated loader yet (R26.3) → stays lazily unresolved, never throws
  return _federatedLoader(ref.uuid, ref.originHost!);
}
