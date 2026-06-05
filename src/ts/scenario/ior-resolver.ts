/**
 * T127.2 — IOR universal-reference resolver.
 * Resolves any IOR to: filePath, class (if scenario unit), view (html+md).
 *
 * [impl:uuid:b66fdf54-04f4-4609-9ded-04c835348b32] R17.12
 */
// [impl:uuid:9b96ae64-dfbc-4cdf-b62c-4394b647c6b9] IORResolver.resolve(ior): ScenarioUnit | ClassLoader
import fs from 'node:fs';
import path from 'node:path';
import { parseIor, type ScenarioUnit } from './types.js';
import { ScenarioIndex } from './index-store.js';
import { type ViewTemplateRegistry } from './templates.js';

export interface IORResolution {
  ior: string;
  type: string;
  filePath?: string;
  className?: string;
  unit?: ScenarioUnit;
  html?: string;
  md?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class IORResolver {
  constructor(
    private index: ScenarioIndex,
    private registry: ViewTemplateRegistry,
    private projectRoot: string,
  ) {}

  private normalize(ior: string): string {
    const trimmed = ior.trim();
    if (trimmed.startsWith('ior:')) return trimmed;
    if (UUID_RE.test(trimmed)) return `ior:instance:${trimmed}`;
    const stripped = trimmed.replace(/\.scenario\.json$/, '');
    if (UUID_RE.test(stripped)) return `ior:instance:${stripped}`;
    return trimmed;
  }

  resolve(ior: string): IORResolution {
    const normalized = this.normalize(ior);
    const parsed = parseIor(normalized);
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
