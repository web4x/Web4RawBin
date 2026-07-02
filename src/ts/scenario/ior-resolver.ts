/**
 * T127.2 — IOR universal-reference resolver.
 * Resolves any IOR to: filePath, class (if scenario unit), view (html+md).
 *
// [impl:uuid:bcbfa945-633a-4f62-950c-7d8d39b0dd15] R17.12 (split for IORResolver.resolveInstance(ior): Scenario
// [impl:uuid:4b13fc8b-cc5d-40c9-a6a7-7cf061b92cca] R17.12 (split for IORResolver.resolveInstance(ior): Scenario
// [impl:uuid:4a74b1c1-78cf-44ba-88e1-8b3fb6f6df9a] R17.12 (split for IORResolver.resolveClass(ior): ClassLoader
// [impl:uuid:c3c95f15-db0e-4690-bc20-380f82b9fc48] R17.12 (split for IORResolver.resolveClass(ior): ClassLoader
 * [impl:uuid:664314f1-1503-4f48-9cd3-231afd198570] R17.12
 */
// [impl:uuid:0e05da50-8dae-48fe-b4b2-361525a398c4] IORResolver.resolve(ior): ScenarioUnit | ClassLoader (split
import fs from 'node:fs';
import path from 'node:path';
import { parseIor, type ScenarioUnit } from './types.js';
import { ScenarioIndex } from './index-store.js';
import { type ViewTemplateRegistry } from './templates.js';
import { parseFederatedIor, isLocalOrigin } from './federated-ior.js'; // T26.1: federated @originHost

export interface IORResolution {
  ior: string;
  type: string;
  filePath?: string;
  className?: string;
  unit?: ScenarioUnit;
  html?: string;
  md?: string;
  federated?: boolean;   // T26.1: a remote @originHost IOR — dereference lazily via the federated loader
  originHost?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class IORResolver {
  constructor(
    private index: ScenarioIndex,
    private registry: ViewTemplateRegistry,
    private projectRoot: string,
    private selfHost?: string, // T26.1: this server's canonical https:// origin (for @self / same-origin resolution)
  ) {}

  private normalize(ior: string): string {
    const trimmed = ior.trim();
    if (trimmed.startsWith('ior:')) return trimmed;
    if (UUID_RE.test(trimmed)) return `ior:instance:${trimmed}`;
    const stripped = trimmed.replace(/\.scenario\.json$/, '');
    if (UUID_RE.test(stripped)) return `ior:instance:${stripped}`;
    return trimmed;
  }

  // [impl:uuid:9b96ae64-dfbc-4cdf-b62c-4394b647c6b9] IORResolver.resolve — + T26.1 federated @originHost dispatch
  resolve(ior: string): IORResolution {
    const normalized = this.normalize(ior);
    // T26.1: split off an optional @originHost. A REMOTE origin → federated (resolved lazily via the
    // federated loader, R26.3), not synchronously here. A local/@self origin → resolve the bare uuid below.
    const fed = parseFederatedIor(normalized);
    if (fed.originHost && !isLocalOrigin(fed.originHost, this.selfHost)) {
      return { ior, type: 'instance', className: 'federated', federated: true, originHost: fed.originHost };
    }
    const parsed = parseIor(fed.originHost ? `ior:instance:${fed.uuid}` : normalized);
    if (!parsed) return { ior, type: 'unknown' };
    // use normalized for all downstream, keep original in response

    switch (parsed.type) {
      case 'class':
        return { ior, type: 'class', className: parsed.value };

      case 'instance': {
        const uuid = parsed.value;
        const unit = this.index.get(uuid);
        if (!unit) return { ior, type: 'instance', filePath: this.index.filePath(uuid) };
        const className = unit.ior.replace('ior:class:', '');
        return {
          ior, type: 'instance', className,
          filePath: this.index.filePath(uuid),
          unit,
          html: this.registry.renderHtml(unit),
          md: this.registry.renderMd(unit),
        };
      }

      case 'file': {
        const filePath = path.resolve(this.projectRoot, parsed.value);
        const exists = fs.existsSync(filePath);
        return { ior, type: 'file', filePath: exists ? filePath : undefined };
      }

      default:
        return { ior, type: 'unknown' };
    }
  }
}
