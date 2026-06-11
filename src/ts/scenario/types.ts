/**
 * T125.1 — Scenario-unit type definitions + IOR primitives.
 *
 * [impl:uuid:8c72876c-05a5-467d-a1da-2b14a4a7b40d] R17.1+R17.2
 */

export interface ScenarioUnit {
  ior: string;
  model: Record<string, unknown>;
  ownerIor: string | null;
}

export type IORType = 'class' | 'instance' | 'file';

export function parseIor(ior: string): { type: IORType; value: string } | null {
  const m = ior.match(/^ior:(class|instance|file):(.+)$/);
  if (!m) return null;
  return { type: m[1] as IORType, value: m[2] };
}

export function iorClass(name: string): string { return `ior:class:${name}`; }
export function iorInstance(uuid: string): string { return `ior:instance:${uuid}`; }
export function iorFile(path: string): string { return `ior:file:${path}`; }

export interface ClassLoader {
  readonly className: string;
  create(unit: ScenarioUnit): ScenarioUnit;
  defaults(): Record<string, unknown>;
}
