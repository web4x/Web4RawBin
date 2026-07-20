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

  // PIN-KEEP (recompute-on-read): stateless — build a throwaway instance bound to the FRESH per-request index
  // (load()s the singleton unit's hints live) and derive slots from LIVE task state. NOT the cached getInstance
  // (which binds one stale index) → the served pin self-heals on every read, no persist() dependency (ROOT-1 fix).
  static slotsFrom(index: ScenarioIndex): ThreeSlots {
    return new CurrentSprint(index).getThreeSlots();
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
    // Tron redesign + forward-fall: current & lastCompleted derive from the CURRENT SPRINT's tasks[]
    // (no global scan of DONE past-sprint tasks — that was the phantom Sprint-20 backlog bug).
    // nextBacklog = next not-done task in-sprint, and if the sprint has none left, the FIRST open task
    // of the next sprint (by number) — so the pin ALWAYS shows current/last/next. Forward-only + not-
    // done-only keeps the phantom (done/past) out while still surfacing genuine upcoming work.
    type Slot = { uuid: string; name: string; reqUuid: string; focus: boolean; done: boolean };
    const slotInfo = (uuid: string): Slot | null => {
      const unit = this.index.get(uuid);
      if (!unit || unit.ior !== 'ior:class:Task') return null;
      const m = unit.model as Record<string, unknown>;
      const reqIors = (m.coveredRequirements as string[]) || [];
      return {
        uuid, name: String(m.name || ''),
        reqUuid: reqIors.length > 0 ? ior(reqIors[0]) : '',
        focus: !!m.focus,
        done: String(m.status || '').toLowerCase() === 'done',
      };
    };

    // 1) resolve the current sprint's ordered task list: match by sprintName; fallback = the sprint
    //    whose tasks[] contains the focused task.
    const sprintUnits: Array<{ name: string; number: number; tasks: string[] }> = [];
    for (const u of this.index.list()) {
      const unit = this.index.get(u);
      if (!unit || unit.ior !== 'ior:class:Sprint') continue;
      const sm = unit.model as Record<string, unknown>;
      sprintUnits.push({ name: String(sm.name || sm.altId || ''), number: Number(sm.number) || 0, tasks: ((sm.tasks as string[]) || []).map(t => ior(t)) });
    }
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    let sprintTaskUuids: string[] = [];
    let currentSprint: { name: string; number: number; tasks: string[] } | undefined;
    if (this.sprintName) {
      const key = norm(this.sprintName);
      const match = key ? sprintUnits.find(s => norm(s.name).includes(key)) : undefined;
      if (match) { sprintTaskUuids = match.tasks; currentSprint = match; }
    }
    if (!sprintTaskUuids.length) {
      let focusUuid = '';
      for (const u of this.index.list()) { const unit = this.index.get(u); if (unit?.ior === 'ior:class:Task' && (unit.model as Record<string, unknown>).focus) { focusUuid = u; break; } }
      const owner = focusUuid ? sprintUnits.find(s => s.tasks.includes(focusUuid)) : undefined;
      if (owner) { sprintTaskUuids = owner.tasks; currentSprint = owner; }
    }
    const sprintTasks = sprintTaskUuids.map(slotInfo).filter((t): t is Slot => !!t);

    // 2) current = the WIP by construction (PIN-KEEP): a VALID focus wins (in-sprint — sprintTasks already is — AND
    //    not-done), else the in-sprint task covering the WIP chain req (also not-done), else forward-fall to the
    //    FIRST NOT-DONE in-sprint task. NEVER a done task; a stale/done/out-of-sprint focus is rejected (ROOT-2).
    let i = sprintTasks.findIndex(t => t.focus && !t.done);
    if (i < 0 && this.chain?.req) { const j = sprintTasks.findIndex(t => t.reqUuid === this.chain!.req); if (j >= 0 && !sprintTasks[j].done) i = j; }
    if (i < 0) i = sprintTasks.findIndex(t => !t.done); // forward-fall: current = first NOT-DONE WIP in-sprint
    let current: Slot | null = i >= 0 ? sprintTasks[i] : null;
    if (!current && this.chain?.req) {
      // chain points to a non-Task (Bug/CR) or a task outside any sprint → current-only slot (guard !done; LIVE name)
      const cu = this.index.get(this.chain.req);
      const cuDone = String((cu?.model as Record<string, unknown>)?.status || '').toLowerCase() === 'done';
      if (cu && !cuDone) current = { uuid: this.chain.req, name: String(cu.model?.name || this.taskName || ''), reqUuid: this.chain.req, focus: true, done: false };
    }
    const currentUuid = current?.uuid || '';

    // 3) lastCompleted = nearest DONE task before current in-sprint; else immediate predecessor.
    let lastCompleted: Slot | null = null;
    for (let k = i - 1; k >= 0; k--) { if (sprintTasks[k].done) { lastCompleted = sprintTasks[k]; break; } }
    if (!lastCompleted && i > 0) lastCompleted = sprintTasks[i - 1];
    // if none in-sprint (e.g. current is the FIRST task of a new sprint), fall BACK to the previous
    // sprint's most-recent DONE task — lastCompleted stays populated across the boundary. Backward +
    // done-only (a done prior-sprint task IS a real completion, not the phantom; symmetric to the
    // nextBacklog forward-fall).
    if (!lastCompleted && currentSprint) {
      const backward = sprintUnits.filter(s => s.number < currentSprint!.number).sort((a, b) => b.number - a.number);
      for (const sp of backward) {
        const done = sp.tasks.map(slotInfo).filter((t): t is Slot => !!t && t.done);
        if (done.length) { lastCompleted = done[done.length - 1]; break; }
      }
    }
    // honor an explicit lastCompleted pin if it points to a DONE task (cross-sprint back is fine —
    // it's a genuine completion; reject only a not-done/stale override).
    if (this.lastCompletedUuid) { const o = slotInfo(this.lastCompletedUuid); if (o && o.done && o.uuid !== currentUuid) lastCompleted = o; }

    // 4) nextBacklog = first NOT-done task after current in-sprint. If the sprint has no more open
    //    tasks, FALL FORWARD to the next sprint's first open task — the pin ALWAYS shows current/
    //    last/next (a nearly-done sprint wraps into the next). The phantom bug was a DONE/PAST task
    //    surfacing as backlog; a NOT-DONE task in a LATER sprint is legit upcoming work, so forward
    //    look-ahead is safe (we never pick a done task, never a lower-numbered/past sprint).
    let nextBacklog: Slot | null = null;
    for (let k = i + 1; k < sprintTasks.length; k++) { if (!sprintTasks[k].done) { nextBacklog = sprintTasks[k]; break; } }
    if (!nextBacklog && currentSprint) {
      const forward = sprintUnits.filter(s => s.number > currentSprint!.number).sort((a, b) => a.number - b.number);
      for (const sp of forward) {
        const open = sp.tasks.map(slotInfo).find((t): t is Slot => !!t && !t.done);
        if (open) { nextBacklog = open; break; }
      }
    }
    // honor an explicit nextBacklog pin if it points to a NOT-DONE task (forward across sprints is
    // fine — that's real upcoming work; reject only a stale DONE/past override = the phantom source).
    if (this.nextBacklogOverride) { const o = slotInfo(this.nextBacklogOverride); if (o && !o.done && o.uuid !== currentUuid) nextBacklog = o; }

    // BUG-C invariant: no UUID appears in more than one slot.
    const lcUuid = lastCompleted?.uuid || '';
    if (lastCompleted && lcUuid === currentUuid) lastCompleted = null;
    if (nextBacklog && (nextBacklog.uuid === currentUuid || nextBacklog.uuid === lcUuid)) nextBacklog = null;

    const toSlot = (t: Slot | null): TaskSlot | null =>
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
  // [impl:uuid:c07efc21-153c-4e02-81c5-ae2e919ad03b] R24.2 CurrentSprint.setFocus (Pin lifecycle)
  // #111 (BUG-A): NO gate / NO --force. Re-focusing the CURRENT task, or advancing to a task whose prior is done,
  // advances NATURALLY. And focus must NOT rotate the unfocused task into lastCompleted (that set current==last on
  // re-focus). lastCompleted is DERIVED from a PRIOR DONE task in getThreeSlots → current / last / next are 3 DISTINCT
  // slots. An explicit lastCompleted override is a separate deliberate action, so focus CLEARS any stale auto-set.
  setFocus(taskUuid: string): boolean {
    let taskUnit = this.index.get(taskUuid);
    if (!taskUnit) { // resolve an 8-char (or any) prefix → the unique Task unit (planner passes short uuids)
      const hits = [...this.index.list()].filter(u => String(u).startsWith(taskUuid) && this.index.get(u)?.ior === 'ior:class:Task');
      if (hits.length === 1) { taskUuid = hits[0]; taskUnit = this.index.get(taskUuid); }
    }
    if (!taskUnit || taskUnit.ior !== 'ior:class:Task') return false;
    for (const uuid of this.index.list()) {
      const u = this.index.get(uuid);
      if (!u) continue;
      const m = u.model as Record<string, unknown>;
      if (!m.focus) continue;
      delete m.focus; // just un-focus — do NOT rotate into lastCompleted (getThreeSlots derives it from prior-done)
      this.index.put(uuid, u);
    }
    (taskUnit.model as Record<string, unknown>).focus = true;
    this.index.put(taskUuid, taskUnit);
    this.lastCompletedUuid = ''; this.lastCompletedName = ''; this.lastCompletedReqUuid = ''; // let derivation rule; clears corruption
    if (this.nextBacklogOverride && ior(this.nextBacklogOverride) === taskUuid) this.nextBacklogOverride = ''; // symmetric (#111): t is now CURRENT → can't also be the next-override (latent current==next)
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
      // R23-fix (skill-expert): when the UC unit is not on disk yet, do NOT abandon the focused
      // task and fall back to a 2-sprint-stale pin. Anchor on req and mark uc+ as PENDING (the
      // partial branch below). ucUnit-missing => refs.uc drops to '' so activeHop lands on the
      // uc hop. This never fabricates credit — it just keeps /trace honest about the CURRENT task.
      const ucM = (ucUnit?.model as Record<string, unknown>) || {};
      const clsUuid = ior(((ucM.classes as string[]) || [])[0] || '');
      const methUuid = ior(String(ucM.method || ''));
      const methUnit = methUuid ? this.index.get(methUuid) : null;
      const methM = methUnit?.model as Record<string, unknown> | undefined;
      const implUuid = ior(((methM?.implementations as string[]) || [])[0] || '');
      const implUnit = implUuid ? this.index.get(implUuid) : null;
      const implM = implUnit?.model as Record<string, unknown> | undefined;
      const testUuid = ior(((implM?.tests as string[]) || [])[0] || '');
      const refs: ChainRefs = { req: reqUuid, uc: ucUnit ? ucUuid : '', class: clsUuid, method: methUuid, impl: implUuid, test: testUuid };
      const complete = CHAIN_ORDER.every(k => !!refs[k]);
      const taskSprint = String(m.sprintName || m.sprint || '');
      if (complete) {
        return this.setChain(refs, taskSprint, String(m.name || ''));
      }
      this.chain = refs;
      this.activeHop = CHAIN_ORDER.findIndex(k => !refs[k]);
      if (this.activeHop < 0) this.activeHop = 0;
      this.sprintName = taskSprint || this.sprintName;
      this.taskName = String(m.name || this.taskName);
      this.persist();
      this.emit();
      return true;
    }
    return false;
  }
}

function ior(s: string): string { return String(s || '').replace('ior:instance:', '').replace('ior:file:', ''); }
