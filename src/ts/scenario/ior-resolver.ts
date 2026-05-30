/**
 * T127.2 — IOR universal-reference resolver.
 * Resolves any IOR to: filePath, class (if scenario unit), view (html+md).
 *
 * [impl:uuid:b66fdf54-04f4-4609-9ded-04c835348b32] R17.12
 */
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

export class IORResolver {
  constructor(
    private index: ScenarioIndex,
    private registry: ViewTemplateRegistry,
    private projectRoot: string,
  ) {}

  resolve(ior: string): IORResolution {
    const parsed = parseIor(ior);
    if (!parsed) return { ior, type: 'unknown' };

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
