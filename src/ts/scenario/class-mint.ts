/**
 * R27.2 AC-canonical (architect 06ad07c35) — mint-or-REUSE a Class scenario unit BY CODE-CLASS NAME.
 * The single choke-point for creating Class units: look up an existing Class by model.name and REUSE it
 * (unioning any new methods, deduped by method name); mint a fresh unit ONLY when none exists. This makes
 * "exactly one Class unit per code-class name" true by construction — never a 2nd (the 55-dup root cause).
 * Every Class-mint call-site MUST route through here; the trace:audit:strict duplicate-Class check backstops it.
 */
import crypto from 'node:crypto';
import { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';

export interface MintOrReuseResult { classUuid: string; methodUuids: string[]; reused: boolean; }

// [impl:uuid:61f24d2c-7d30-49dd-89bc-1ff089c9a48e] R27.2 mintOrReuseClass (reuse-canonical-class by name)
export function mintOrReuseClass(idx: ScenarioIndex, className: string, ownerIor: string, sourceFile: string, methodNames: string[]): MintOrReuseResult {
  const existing = [...idx.list()].map(u => idx.get(u)).find(u => !!u && u.ior === 'ior:class:Class' && String((u.model as any).name) === className);
  const classUuid = existing ? String((existing.model as any).uuid) : crypto.randomUUID();
  const existingMethodIors: string[] = existing ? (((existing.model as any).methods) || []) : [];
  const existingNames = new Set(existingMethodIors.map(mi => { const mu = idx.get(String(mi).replace('ior:instance:', '')); return String((mu?.model as any)?.methodName || ''); }));
  const methodIors: string[] = [...existingMethodIors];
  const methodUuids: string[] = [];
  for (const mName of methodNames) {
    if (!mName || existingNames.has(mName)) continue; // reuse the existing method for this name — no duplicate Method
    const mUuid = crypto.randomUUID();
    idx.put(mUuid, { ior: 'ior:class:Method', model: { uuid: mUuid, name: `${className}.${mName}`, className, methodName: mName }, ownerIor: `ior:instance:${classUuid}` });
    methodIors.push(`ior:instance:${mUuid}`); methodUuids.push(mUuid);
  }
  const unit: ScenarioUnit = existing
    ? { ...existing, model: { ...(existing.model as any), methods: methodIors } }               // REUSE: union methods onto the existing Class
    : { ior: 'ior:class:Class', model: { uuid: classUuid, name: className, file: sourceFile, methods: methodIors, useCases: [] }, ownerIor };
  idx.put(classUuid, unit);
  return { classUuid, methodUuids, reused: !!existing };
}
