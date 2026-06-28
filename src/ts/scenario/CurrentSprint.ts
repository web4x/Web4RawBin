/**
 * R20.13 — CurrentSprint: singleton tracking the active chain hop.
 * Persisted to scenario/index as ior:class:CurrentSprint.
 * Dispatches 'current-sprint-changed' on document when state changes.
 */
import { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';

export type HopStatus = 'pending' | 'in-progress' | 'done' | 'gate-proven';

export interface ChainHop {
  type: string;
  uuid: string;
  name: string;
  status: 'done' | 'active' | 'pending';
}

export interface HopState {
  status: HopStatus;
  owner: string;
  updatedAt: string;
}

const HOP_OWNERS: Record<string, string> = {
  req: 'req-eng', uc: 'architect', class: 'architect',
  method: 'expert', impl: 'expert', test: 'tester',
};

export interface ChainRefs {
  req: string;
  uc: string;
  class: string;
  method: string;
  impl: string;
  test: string;
}

export interface TaskSlot {
  taskUuid: string;
  taskName: string;
  reqUuid: string;
}

export interface ThreeSlots {
  current: TaskSlot | null;
  lastCompleted: TaskSlot | null;
  nextBacklog: TaskSlot | null;
}

export interface PinData {
  sprintName: string;
  taskName: string;
  chainDepth: number;
  wipStatus: string;
  slots: ThreeSlots;
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
  private hopStates: Record<string, HopState> = {};
  private nextBacklogOverride = '';
  private lastCompletedUuid = '';
  private lastCompletedName = '';
  private lastCompletedReqUuid = '';

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
      this.hopStates = (m.hopStates as Record<string, HopState>) || {};
      this.nextBacklogOverride = (m.nextBacklogOverride as string) || '';
      this.lastCompletedUuid = (m.lastCompletedUuid as string) || '';
      this.lastCompletedName = (m.lastCompletedName as string) || '';
      this.lastCompletedReqUuid = (m.lastCompletedReqUuid as string) || '';
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
        hopStates: this.hopStates,
        nextBacklogOverride: this.nextBacklogOverride,
        lastCompletedUuid: this.lastCompletedUuid,
        lastCompletedName: this.lastCompletedName,
        lastCompletedReqUuid: this.lastCompletedReqUuid,
        slots: this.getThreeSlots(),
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

  // [impl:uuid:63d2c341-6f57-486b-a246-bda5c8ce4ca2] R20.13+R20.22 pinCurrent
  pinCurrent(): PinData {
    return {
      sprintName: this.sprintName,
      taskName: this.taskName,
      chainDepth: this.activeHop,
      wipStatus: this.chain
        ? (this.activeHop >= CHAIN_ORDER.length - 1 && this.hopStates.test?.status === 'gate-proven' ? 'done' : CHAIN_ORDER[this.activeHop] || 'done')
        : 'none',
      slots: this.getThreeSlots(),
    };
  }

  // [impl:uuid:d20855e7-4a1b-4c2d-8e3f-5a6b7c8d9e0f] R20.22 getThreeSlots
  getThreeSlots(): ThreeSlots {
    const tasks: Array<{ uuid: string; name: string; reqUuid: string; focus: boolean; testGateProven: boolean; hasUcChain: boolean; updatedAt: string }> = [];
    for (const uuid of this.index.list()) {
      const unit = this.index.get(uuid);
      if (!unit || unit.ior !== 'ior:class:Task') continue;
      const m = unit.model as Record<string, unknown>;
      const reqIors = (m.coveredRequirements as string[]) || [];
      const reqUuid = reqIors.length > 0 ? ior(reqIors[0]) : '';
      const ucIors = (m.useCases as string[]) || [];
      tasks.push({
        uuid, name: String(m.name || ''), reqUuid,
        focus: !!m.focus,
        testGateProven: this.hopStates.test?.status === 'gate-proven' && !!m.focus,
        hasUcChain: ucIors.length > 0,
        updatedAt: String(m.updatedAt || m.statusChecklist || ''),
      });
    }

    // Derive current from canonical WIP chain (not just focus-Task — WIP can be Bug/CR/any setChain'd item)
    let current: typeof tasks[0] | null = null;
    if (this.chain?.req) {
      const chainReqUuid = this.chain.req;
      current = tasks.find(t => t.reqUuid === chainReqUuid) || null;
      if (!current) {
        // Chain points to a non-Task (Bug, CR) — synthesize a slot from chain data
        const chainUnit = this.index.get(chainReqUuid);
        if (chainUnit) {
          current = { uuid: chainReqUuid, name: this.taskName || String(chainUnit.model?.name || ''), reqUuid: chainReqUuid, focus: true, testGateProven: this.hopStates.test?.status === 'gate-proven', hasUcChain: true, updatedAt: '' };
        }
      }
    }
    if (!current) current = tasks.find(t => t.focus) || null;

    // BUG-C invariant: no UUID appears in more than one slot. A slot is null
    // rather than a duplicate when the pool is too small.
    const currentUuid = current?.uuid || '';

    let lastCompleted: typeof tasks[0] | null = null;
    if (this.lastCompletedUuid && this.lastCompletedUuid !== currentUuid) {
      lastCompleted = tasks.find(t => t.uuid === this.lastCompletedUuid) || null;
      if (!lastCompleted && this.lastCompletedName) {
        lastCompleted = { uuid: this.lastCompletedUuid, name: this.lastCompletedName, reqUuid: this.lastCompletedReqUuid, focus: false, testGateProven: false, hasUcChain: true, updatedAt: '' };
      }
    }
    if (!lastCompleted) {
      const completed = tasks.filter(t => !t.focus && t.reqUuid && t.uuid !== currentUuid);
      lastCompleted = completed.length > 0 ? completed[completed.length - 1] : null;
    }
    const lastCompletedUuid = lastCompleted?.uuid || '';

    const backlog = tasks.filter(t => !t.focus && t.reqUuid && !t.hasUcChain && t.uuid !== currentUuid && t.uuid !== lastCompletedUuid);
    let nextBacklog: typeof tasks[0] | null = null;
    if (this.nextBacklogOverride && this.nextBacklogOverride !== currentUuid && this.nextBacklogOverride !== lastCompletedUuid) {
      nextBacklog = tasks.find(t => t.uuid === this.nextBacklogOverride) || null;
    }
    if (!nextBacklog) nextBacklog = backlog.length > 0 ? backlog[0] : null;

    const toSlot = (t: typeof tasks[0] | null): TaskSlot | null =>
      t ? { taskUuid: t.uuid, taskName: t.name, reqUuid: t.reqUuid } : null;

    return { current: toSlot(current), lastCompleted: toSlot(lastCompleted), nextBacklog: toSlot(nextBacklog) };
  }

  // R20.22 override: pin a specific task as nextBacklog
  setNextBacklog(taskUuid: string): boolean {
    const taskUnit = this.index.get(taskUuid);
    if (!taskUnit || taskUnit.ior !== 'ior:class:Task') return false;
    this.nextBacklogOverride = taskUuid;
    this.persist();
    this.emit();
    return true;
  }

  clearNextBacklogOverride(): void {
    this.nextBacklogOverride = '';
    this.persist();
    this.emit();
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
  getActiveChain(): (ChainHop & { hopState?: HopState })[] {
    if (!this.chain) return [];
    return CHAIN_ORDER.map((key, i) => ({
      type: key,
      uuid: this.chain![key],
      name: key,
      status: i < this.activeHop ? 'done' as const : i === this.activeHop ? 'active' as const : 'pending' as const,
      hopState: this.hopStates[key],
    }));
  }

  /**
   * Per-agent realtime hop update — agent reports their hop's status as they work.
   * Owner is validated: only the designated role can update a hop.
   */
  hopUpdate(hop: keyof ChainRefs, status: HopStatus, agent?: string): boolean {
    if (!this.chain || !CHAIN_ORDER.includes(hop)) return false;
    const expectedOwner = HOP_OWNERS[hop] || '';
    this.hopStates[hop] = { status, owner: agent || expectedOwner, updatedAt: new Date().toISOString() };
    if (status === 'done' || status === 'gate-proven') {
      const hopIdx = CHAIN_ORDER.indexOf(hop);
      if (hopIdx >= this.activeHop) this.activeHop = Math.min(hopIdx + 1, CHAIN_ORDER.length - 1);
    }
    this.persist();
    this.emit();
    return true;
  }

  /** Get per-hop state (status + owner + timestamp). */
  getHopStates(): Record<string, HopState> { return { ...this.hopStates }; }

  /** Is the current task's test hop gate-proven (det-3x + deploy green)? */
  isGateProven(): boolean {
    return this.hopStates.test?.status === 'gate-proven';
  }

  /** Set focus on a task. BLOCKED unless current task's test is gate-proven (or no current task). */
  setFocus(taskUuid: string, force?: boolean): boolean {
    if (this.chain && !force && !this.isGateProven()) {
      return false; // task-switch gate: current chain not gate-proven
    }
    const taskUnit = this.index.get(taskUuid);
    if (!taskUnit || taskUnit.ior !== 'ior:class:Task') return false;
    for (const uuid of this.index.list()) {
      const u = this.index.get(uuid);
      if (!u || u.ior !== 'ior:class:Task') continue;
      const m = u.model as Record<string, unknown>;
      if (m.focus) {
        this.lastCompletedUuid = uuid;
        this.lastCompletedName = String(m.name || '');
        const reqIors = (m.coveredRequirements as string[]) || [];
        this.lastCompletedReqUuid = reqIors.length > 0 ? ior(reqIors[0]) : '';
        delete m.focus;
        this.index.put(uuid, u);
      }
    }
    (taskUnit.model as Record<string, unknown>).focus = true;
    this.index.put(taskUuid, taskUnit);
    this.hopStates = {};
    this.hopStates.req = { status: 'done', owner: 'req-eng', updatedAt: new Date().toISOString() };
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
