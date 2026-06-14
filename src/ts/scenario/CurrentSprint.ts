/**
 * R20.13 — CurrentSprint: singleton tracking the active chain hop.
 * Persisted to scenario/index as ior:class:CurrentSprint.
 * Dispatches 'current-sprint-changed' on document when state changes.
 */
import { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';

export interface ChainHop {
  type: string;
  uuid: string;
  name: string;
  status: 'done' | 'active' | 'pending';
}

export interface ChainRefs {
  req: string;
  uc: string;
  class: string;
  method: string;
  impl: string;
  test: string;
}

export interface PinData {
  sprintName: string;
  taskName: string;
  chainDepth: number;
  wipStatus: string;
}

const CHAIN_ORDER: (keyof ChainRefs)[] = ['req', 'uc', 'class', 'method', 'impl', 'test'];
const CURRENT_UUID = 'current-sprint-singleton-0000-000000000001';

export class CurrentSprint {
  private static instance: CurrentSprint | null = null;
  private index: ScenarioIndex;
  private chain: ChainRefs | null = null;
  private activeHop = 0;
  private sprintName = '';
  private taskName = '';

  private constructor(index: ScenarioIndex) {
    this.index = index;
    this.load();
  }

  static getInstance(index: ScenarioIndex): CurrentSprint {
    if (!CurrentSprint.instance) CurrentSprint.instance = new CurrentSprint(index);
    return CurrentSprint.instance;
  }

  private load(): void {
    const unit = this.index.get(CURRENT_UUID);
    if (unit?.model) {
      const m = unit.model as Record<string, unknown>;
      this.chain = m.chain as ChainRefs || null;
      this.activeHop = (m.activeHop as number) || 0;
      this.sprintName = (m.sprintName as string) || '';
      this.taskName = (m.taskName as string) || '';
    }
  }

  private persist(): void {
    const unit: ScenarioUnit = {
      ior: 'ior:class:CurrentSprint',
      model: {
        uuid: CURRENT_UUID,
        name: `Current: ${this.taskName || 'none'}`,
        chain: this.chain,
        activeHop: this.activeHop,
        sprintName: this.sprintName,
        taskName: this.taskName,
      },
      ownerIor: null,
    };
    this.index.put(CURRENT_UUID, unit);
  }

  private emit(): void {
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('current-sprint-changed', {
        detail: { chain: this.chain, activeHop: this.activeHop, sprintName: this.sprintName, taskName: this.taskName },
      }));
    }
  }

  // [impl:uuid:e8bd1984-30c1-4591-991c-fcdc28a9164f] R20.13 setChain
  setChain(refs: ChainRefs, sprintName?: string, taskName?: string): boolean {
    for (const key of CHAIN_ORDER) {
      if (!refs[key]) return false;
    }
    this.chain = { ...refs };
    this.activeHop = 0;
    if (sprintName) this.sprintName = sprintName;
    if (taskName) this.taskName = taskName;
    this.persist();
    this.emit();
    return true;
  }

  // [impl:uuid:63d2c341-6f57-486b-a246-bda5c8ce4ca2] R20.13 pinCurrent
  pinCurrent(): PinData {
    return {
      sprintName: this.sprintName,
      taskName: this.taskName,
      chainDepth: this.activeHop,
      wipStatus: this.chain ? CHAIN_ORDER[this.activeHop] || 'done' : 'none',
    };
  }

  // [impl:uuid:2011ae78-3e09-4e85-b98f-f3423dd32500] R20.13 advance
  advance(): void {
    if (!this.chain) return;
    if (this.activeHop < CHAIN_ORDER.length - 1) {
      this.activeHop++;
      this.persist();
      this.emit();
    }
  }

  // [impl:uuid:f44ae205-6b80-4f53-9d38-54050d3059f5] R20.13 getActiveChain
  getActiveChain(): ChainHop[] {
    if (!this.chain) return [];
    return CHAIN_ORDER.map((key, i) => ({
      type: key,
      uuid: this.chain![key],
      name: key,
      status: i < this.activeHop ? 'done' as const : i === this.activeHop ? 'active' as const : 'pending' as const,
    }));
  }

  /** Set focus on a task (WIP=1 enforced: clears all other task.focus first). */
  setFocus(taskUuid: string): boolean {
    const taskUnit = this.index.get(taskUuid);
    if (!taskUnit || taskUnit.ior !== 'ior:class:Task') return false;
    for (const uuid of this.index.list()) {
      const u = this.index.get(uuid);
      if (!u || u.ior !== 'ior:class:Task') continue;
      const m = u.model as Record<string, unknown>;
      if (m.focus) { delete m.focus; this.index.put(uuid, u); }
    }
    (taskUnit.model as Record<string, unknown>).focus = true;
    this.index.put(taskUuid, taskUnit);
    return this.autoFollow();
  }

  /** Auto-derive the pin from the focused task's chain. Returns true if chain set. */
  autoFollow(): boolean {
    for (const uuid of this.index.list()) {
      const unit = this.index.get(uuid);
      if (!unit || unit.ior !== 'ior:class:Task') continue;
      const m = unit.model as Record<string, unknown>;
      if (!m.focus) continue;
      const reqIors = (m.coveredRequirements as string[]) || [];
      const taskIors = (m.useCases as string[]) || [];
      const reqUuid = reqIors.length > 0 ? ior(reqIors[0]) : '';
      if (!reqUuid) continue;
      const reqUnit = this.index.get(reqUuid);
      if (!reqUnit) continue;
      const reqM = reqUnit.model as Record<string, unknown>;
      let ucIors = (reqM.useCases as string[]) || [];
      if (ucIors.length === 0) ucIors = taskIors;
      const ucUuid = ucIors.length > 0 ? ior(ucIors[0]) : '';
      if (!ucUuid) continue;
      const ucUnit = this.index.get(ucUuid);
      if (!ucUnit) continue;
      const ucM = ucUnit.model as Record<string, unknown>;
      const clsUuid = ior(((ucM.classes as string[]) || [])[0] || '');
      const methUuid = ior(String(ucM.method || ''));
      const methUnit = methUuid ? this.index.get(methUuid) : null;
      const methM = methUnit?.model as Record<string, unknown> | undefined;
      const implUuid = ior(((methM?.implementations as string[]) || [])[0] || '');
      const implUnit = implUuid ? this.index.get(implUuid) : null;
      const implM = implUnit?.model as Record<string, unknown> | undefined;
      const testUuid = ior(((implM?.tests as string[]) || [])[0] || '');
      const refs: ChainRefs = { req: reqUuid, uc: ucUuid, class: clsUuid, method: methUuid, impl: implUuid, test: testUuid };
      const complete = CHAIN_ORDER.every(k => !!refs[k]);
      if (complete) {
        return this.setChain(refs, String(m.sprint || ''), String(m.name || ''));
      }
      this.chain = refs;
      this.activeHop = CHAIN_ORDER.findIndex(k => !refs[k]);
      if (this.activeHop < 0) this.activeHop = 0;
      this.sprintName = String(m.sprint || this.sprintName);
      this.taskName = String(m.name || this.taskName);
      this.persist();
      this.emit();
      return true;
    }
    return false;
  }
}

function ior(s: string): string { return String(s || '').replace('ior:instance:', '').replace('ior:file:', ''); }
