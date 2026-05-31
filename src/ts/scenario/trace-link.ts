/**
 * T134 — TraceLink: traceability links as first-class scenario units.
 * Each link = {ior:class:TraceLink, model:{from, to, relation, ...}, ownerIor}.
 *
 * [impl:uuid:c5134d0a-f41b-4e85-b026-0b3f1ae5b2cd] R17.16
 */
import { type ScenarioUnit, type ClassLoader, iorClass, iorInstance } from './types.js';

export type LinkRelation = 'implements' | 'tests' | 'contains' | 'follows' | 'changes' | 'supersedes' | 'usesClass' | 'hasMethod';

export const RELATION_INVERSE: Record<LinkRelation, string> = {
  implements: 'implementedBy',
  tests: 'testedBy',
  contains: 'containedBy',
  follows: 'followedBy',
  changes: 'changedBy',
  supersedes: 'supersededBy',
  usesClass: 'usedBy',
  hasMethod: 'methodOf',
};

export const TraceLinkLoader: ClassLoader = {
  className: 'TraceLink',
  defaults: () => ({
    uuid: '', from: '', to: '', fromType: '', toType: '',
    relation: '', direction: 'bidirectional', label: '', createdAt: '', createdBy: '',
  }),
  create(unit: ScenarioUnit): ScenarioUnit {
    return { ior: iorClass('TraceLink'), model: { ...TraceLinkLoader.defaults(), ...unit.model }, ownerIor: unit.ownerIor };
  },
};

export function createTraceLink(
  fromUuid: string, fromType: string,
  toUuid: string, toType: string,
  relation: LinkRelation,
  opts?: { label?: string; ownerUuid?: string; createdBy?: string },
): ScenarioUnit {
  return {
    ior: iorClass('TraceLink'),
    model: {
      uuid: crypto.randomUUID(),
      from: iorInstance(fromUuid),
      to: iorInstance(toUuid),
      fromType,
      toType,
      relation,
      direction: 'bidirectional',
      label: opts?.label || `${fromType}:${fromUuid.slice(0, 8)} ${relation} ${toType}:${toUuid.slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      createdBy: opts?.createdBy || 'manual',
    },
    ownerIor: opts?.ownerUuid ? iorInstance(opts.ownerUuid) : null,
  };
}

export function inverseRelation(relation: string): string {
  return RELATION_INVERSE[relation as LinkRelation] || relation;
}
