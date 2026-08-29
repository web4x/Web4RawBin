/**
 * R20.13 — CurrentSprint: singleton tracking the active chain hop.
 * Persisted to scenario/index as ior:class:CurrentSprint.
 * Dispatches 'current-sprint-changed' on document when state changes.
 */
import { ScenarioIndex } from './index-store.js';
import { fwdRefs } from '../shared/chain-model.js';
import { bareUuid } from '../shared/bare-uuid.js'; // R40.58 D2: the ONE canonical uuid normaliser (strip prefix+@host) — the designation producer routes through it
import type { ScenarioUnit } from './types.js';
import { deriveStatusEnum, rollupParentStatus, childTaskUuids, type TaskStatusEnum } from './task-status.js'; // R40.1 (d): parent status ROLLS UP from children (weakest-link) — a coordination root derives from its subtasks, not its lying stored status

// R40.18 pin auto-progress (design-r40.18-pin-auto-progress.md): a task has "LEFT current" once it reaches a
// TERMINAL-FOR-CURRENT status — QA-Review or Done (or raw Superseded/Cancelled). Detected via the STATUS ENUM
// (deriveStatusEnum, the single source), NEVER a symbol/glyph. QA-Review leaves *current* by DERIVATION (no hook,
// no stored pin) but is NOT completion — lastCompleted still follows Done only (lastCompleted-follows-DONE-not-QA).
const TERMINAL_FOR_CURRENT: readonly TaskStatusEnum[] = ['QA Review', 'Done'];

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
  inProgress: TaskSlot[]; // R40.18 WIP=N: EVERY In-Progress task (the view marks the whole set — honest multi-current, no arbitrary single-pick); `current` = the max-lastAdvancedAt one for back-compat.
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
  // R40.17 SINGLE-SOURCE: the current SPRINT is resolved by resolveSprintPin (server-side, fs) and passed IN as
  // `resolvedSprint` — this client-bundled class no longer derives the sprint from sprintName (that parallel
  // derivation was the 2nd source; retired, INV-C1-9). `currentTaskUuid` = the owner's task designation (INPUT-ONLY
  // from the singleton) that OVERRIDES chain-activity for the current-task slot.
  // [impl:uuid:e9eb79e0-5258-4416-b97d-4ddd899f2af7] CurrentSprint.slotsFrom — R40.18 pin auto-progress DERIVATION
  // (QA-Review = left-current via the STATUS ENUM not a symbol; explicit-wins-while-valid; lastCompleted-follows-
  // DONE-not-QA; auto-derive-next; no hook / no stored pin — INV-C1-9). Gated by BITEs 1-7 (scripts/r4018-pin-
  // autoprogress-bites.ts + tester's Tests). The 3-slot derivation body lives in getThreeSlots (called here).
  static slotsFrom(index: ScenarioIndex, resolvedSprint?: { number: number; uuid: string; name: string }, currentTaskUuid?: string): ThreeSlots {
    return new CurrentSprint(index).getThreeSlots(resolvedSprint, currentTaskUuid);
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
        // R40.17: no `slots` snapshot persisted — the served pin is recompute-on-read via slotsFrom(resolveSprintPin)
        // (ROOT-1), nothing reads model.slots, and a stored snapshot would be a stale 2nd source of "what is current".
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
  getThreeSlots(resolvedSprint?: { number: number; uuid: string; name: string }, currentTaskUuid?: string): ThreeSlots {
    // Tron redesign + forward-fall: current & lastCompleted derive from the CURRENT SPRINT's tasks[]
    // (no global scan of DONE past-sprint tasks — that was the phantom Sprint-20 backlog bug).
    // nextBacklog = next not-done task in-sprint, and if the sprint has none left, the FIRST open task
    // of the next sprint (by number) — so the pin ALWAYS shows current/last/next. Forward-only + not-
    // done-only keeps the phantom (done/past) out while still surfacing genuine upcoming work.
    type Slot = { uuid: string; name: string; reqUuid: string; focus: boolean; done: boolean; terminal: boolean; status: TaskStatusEnum; lastAdvancedAt: string };
    // R40.1 (d) — DERIVED task status with PARENT ROLLUP (CR 18ebe066, design §3). A task with resolvable subtask
    // children derives the WEAKEST-LINK rollup of the children's derived statuses (children-rollup is AUTHORITATIVE for a
    // parent — its own stored/checklist status is IGNORED). A leaf keeps deriveStatusEnum(checklist), else the declared
    // model.status normalized (no-checklist legacy). Recursive (a child may itself be a parent) with a cycle-guard;
    // READ-side only, no disk write (single-writer intact). So coordination-root 37.4 derives QA-Review from its
    // QA-Review children → terminal-for-current → auto-rejected as the pin, no special case (its lying 'Planned' fixed).
    const leafStatus = (m: Record<string, unknown>): TaskStatusEnum => {
      const checklist = String(m.statusChecklist || '');
      if (checklist) return deriveStatusEnum(checklist);
      const rawStatus = String(m.status || '');
      return (['Planned', 'In Progress', 'QA Review', 'Done'] as TaskStatusEnum[]).find((s) => s.toLowerCase() === rawStatus.toLowerCase()) || 'Planned';
    };
    const rolledStatus = (uuid: string, seen: Set<string> = new Set()): TaskStatusEnum => {
      const key = bareUuid(uuid);
      const unit = this.index.get(key);
      if (!unit || unit.ior !== 'ior:class:Task' || seen.has(key)) return 'Planned';
      const m = unit.model as Record<string, unknown>;
      const childUuids = childTaskUuids(m, key).filter((c) => { const cu = this.index.get(c); return !!cu && cu.ior === 'ior:class:Task'; });
      if (!childUuids.length) return leafStatus(m); // real leaf — unaffected
      const next = new Set(seen); next.add(key);
      const rolled = rollupParentStatus(childUuids.map((c) => rolledStatus(c, next)));
      return rolled ?? leafStatus(m);
    };
    const slotInfo = (uuid: string): Slot | null => {
      const unit = this.index.get(uuid);
      if (!unit || unit.ior !== 'ior:class:Task') return null;
      const m = unit.model as Record<string, unknown>;
      const reqIors = (m.coveredRequirements as string[]) || [];
      // R40.18/R40.1(d): status via the ENUM with PARENT ROLLUP — single-source = rolledStatus (children-rollup for a
      // parent, deriveStatusEnum for a leaf); never a glyph/symbol, never the stored status for a parent.
      const rawStatus = String(m.status || '');
      const status: TaskStatusEnum = rolledStatus(uuid);
      return {
        uuid, name: String(m.name || ''),
        reqUuid: reqIors.length > 0 ? ior(reqIors[0]) : '',
        focus: !!m.focus,
        done: status === 'Done',
        // R40.18 terminal-for-current: QA-Review or Done leaves the current-eligible set (Superseded/Cancelled too,
        // if a raw status carries them — the enum cannot derive those, so match the raw string as a belt-and-braces).
        terminal: TERMINAL_FOR_CURRENT.includes(status) || /^(superseded|cancelled)$/i.test(rawStatus),
        status,
        lastAdvancedAt: String(m.lastAdvancedAt || ''), // R40.18: seam-stamped recency; '' (untimestamped) ranks LAST in the current predicate
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
    // R40.17 SINGLE-SOURCE: the current sprint is the one RESOLVED by resolveSprintPin (passed in by the server as
    // `resolvedSprint`) — NUMBER-matched to the in-memory sprintUnits for its ordered tasks. The old sprintName-derived
    // match + focus-flag fallback are RETIRED (they were the parallel 2nd source of "what is current"; INV-C1-9). If no
    // sprint was resolved (should not happen on the served path — the endpoint always passes the resolver's answer),
    // the slots are honestly empty rather than silently re-derived from a stale hint.
    let sprintTaskUuids: string[] = [];
    let currentSprint: { name: string; number: number; tasks: string[] } | undefined;
    if (resolvedSprint) {
      const match = sprintUnits.find(s => s.number === resolvedSprint.number);
      if (match) { sprintTaskUuids = match.tasks; currentSprint = match; }
    }
    const sprintTasks = sprintTaskUuids.map(slotInfo).filter((t): t is Slot => !!t);

    // 2) current = the WIP by construction (PIN-KEEP): a VALID focus wins (in-sprint — sprintTasks already is — AND
    //    not-done), else the in-sprint task covering the WIP chain req (also not-done), else forward-fall to the
    //    FIRST NOT-DONE in-sprint task. NEVER a done task; a stale/done/out-of-sprint focus is rejected (ROOT-2).
    // R40.17 DESIGNATION OVERRIDES chain-activity: an explicit owner currentTaskUuid (INPUT-ONLY from the singleton)
    // wins for the current slot — authoritative data, honored regardless of focus/done (chain-activity stays the
    // DEFAULT only when no designation exists). Must be in the resolved sprint; a designation elsewhere is ignored here.
    // R40.18 EXPLICIT-WINS-WHILE-VALID: an owner currentTaskUuid designation wins for current ONLY while its task is
    // still current-eligible (non-terminal). Once the steered task reaches QA-Review/Done it is STALE → fall through
    // to auto-derive (the drop-to-auto is logged EVENT-DRIVEN at the R40.10 QA-transition, NOT here — a derive-time
    // log would spam every render and fight idempotency). Auto NEVER clobbers a still-valid manual steer.
    // R40.18 (RE-RULED eb149077e — THE value Tron watches): current = the IN-PROGRESS task with the MAX lastAdvancedAt
    // (work ACTUALLY started), replacing the old first-NON-TERMINAL rule that returned the stale Planned 37.4 = his exact
    // complaint. Untimestamped ('') ranks LAST, never silently first. The stored singleton currentTaskUuid is RETIRED from
    // the derivation (derive from LIVE status, never a stale stored pointer — that pointer to a Planned task is WHY 37.4
    // stuck; R40.17). A genuine owner Set-Current is the separate designatedCurrent OVERRIDE (demote — next increment).
    // WIP=N: the whole inProgress SET is surfaced (below) so multi-current is HONEST — no arbitrary single-pick.
    const inProgressRanked = sprintTasks
      // R40.59 inv-3 (the ONE current-eligibility place): the band is current-able (processing a CR IS working) — it is
      // already non-terminal (TERMINAL_FOR_CURRENT stays ['QA Review','Done']), so accept it here alongside In Progress.
      .filter(t => t.status === 'In Progress' || t.status === 'QA-Review-with-open-CR')
      .sort((a, b) => (b.lastAdvancedAt || '').localeCompare(a.lastAdvancedAt || '')); // max lastAdvancedAt first; untimestamped last
    let i = -1;
    if (inProgressRanked.length) i = sprintTasks.indexOf(inProgressRanked[0]);
    // FALLBACK: nothing In Progress → the first Planned (next-to-start), a REASONED pick (not the arbitrary first-any).
    if (i < 0) i = sprintTasks.findIndex(t => t.status === 'Planned');
    // Fully-COMPLETED sprint (every task terminal — all QA-Review/Done): pin the LAST in-sprint task ("end of Sprint
    // N") rather than going blank. A REASONED pick, not a silent arbitrary one (fail-loud lineage).
    if (i < 0 && sprintTasks.length && sprintTasks.every(t => t.terminal)) i = sprintTasks.length - 1;
    let current: Slot | null = i >= 0 ? sprintTasks[i] : null;
    // R40.49 EXPLICIT-WINS-WHILE-VALID (architect R40.44-REVERSAL 5c330e44d): an owner make-current DESIGNATION
    // (currentTaskUuid) OVERRIDES the derived current, VALIDITY RE-EVALUATED PER READ — wins iff the designated task is in
    // the resolved sprint AND its status is Planned/In-Progress/QA-Review ("reviewing IS working"). It EXPIRES the moment
    // the task reaches Done (or is re-designated / gone) → the derived current stands; the expiry is OBSERVED at the Done
    // transition by StaleSteerLog (BITE-6b, never a silent drop). NOT the retired lying pin — it is EXPLICIT + validity-
    // checked-here-every-read + observable-on-expiry, the 3 properties the silent stuck-on-Planned R40.17 pin lacked.
    if (currentTaskUuid) {
      const desU = bareUuid(currentTaskUuid); // R40.58 D2: canonical strip (prefix+@host) — single-source with the drawer's compare
      const d = sprintTasks.find(t => t.uuid === desU);
      // R40.1 CR#86-4 auto-advance at CLEAN QA: a designated current whose status is clean 'QA Review' has left the
      // being-worked set → its designation EXPIRES here too (not only at Done) → current falls to the derived next, and
      // nextBacklog recalculates off it. The 'QA-Review-with-open-CR' BAND is NOT excluded (processing a CR IS working) →
      // it STAYS current. So: designation wins while status ∈ {Planned, In-Progress, QA-Review-with-open-CR}; expires at
      // clean 'QA Review' / Done / gone (re-checked per read, expiry observed by StaleSteerLog).
      if (d && d.status !== 'Done' && d.status !== 'QA Review') current = d;
    }
    if (!current && this.chain?.req) {
      // chain points to a non-Task (Bug/CR) or a task outside any sprint → current-only slot (guard !done; LIVE name)
      const cu = this.index.get(this.chain.req);
      const cuDone = String((cu?.model as Record<string, unknown>)?.status || '').toLowerCase() === 'done';
      if (cu && !cuDone) current = { uuid: this.chain.req, name: String(cu.model?.name || this.taskName || ''), reqUuid: this.chain.req, focus: true, done: false };
    }
    const currentUuid = current?.uuid || '';

    // 3) lastCompleted = nearest DONE task before current in-sprint. R40.18 lastCompleted-follows-DONE-not-QA:
    // Done ONLY — the old "else immediate predecessor" fallback is REMOVED (it wrongly promoted a QA-Review
    // predecessor to "completed"; QA-Review is not completion — a task becomes lastCompleted only on R40.10 approve).
    let lastCompleted: Slot | null = null;
    for (let k = i - 1; k >= 0; k--) { if (sprintTasks[k].done) { lastCompleted = sprintTasks[k]; break; } }
    // if none in-sprint (e.g. current is the FIRST task of a new sprint), fall BACK to the previous
    // sprint's most-recent DONE task — lastCompleted stays populated across the boundary. Backward +
    // done-only (a done prior-sprint task IS a real completion, not the phantom; symmetric to the
    // nextBacklog forward-fall).
    if (!lastCompleted && currentSprint) {
      // ⚠ R40.50 EXEMPT (lint allow-list): ALGORITHMIC pin-hop ordering (nearest prior sprint for lastCompleted fall-back). NOT a display list; MUST NOT route through bySprintDisplayOrder; reordering breaks pin resolution.
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
    // R40.18: next = the task FOLLOWING current in completion order, SKIPPING TERMINAL (a QA-Review task is not
    // upcoming backlog — it has left the WIP set). Auto-scan uses !terminal; the explicit override below keeps the
    // design's not-Done validation (a steered next may legitimately be anything not yet Done).
    // fact-2 (architect 1c38064c9 REVISED per expert R7-flag) — NEXT is TWO-TIER:
    //  (1) nextBacklogOverride (validity-checked per read at the honor below): holds EITHER the owner explicit designate-next
    //      OR the make-current CAPTURED DISPLACED-PRIOR — the pre-write DERIVED current, written by the make-current handler
    //      from the CORRECT source (NOT the R40.18-retired stored pointer = the old bug). Stored-WITH-revalidation, not silent-stale.
    //  (2) ELSE the forward auto-scan (first not-done after current in-sprint, then fall-forward to the next sprint).
    // ★ Why NOT a read-time "masked-derived" tier: make-current STAMPS the target's lastAdvancedAt=now (task-policy.ts:128) →
    //   the designated task BECOMES the max-lastAdvancedAt derived current (D==R) → a read-time D≠R tier could NEVER fire for a
    //   make-current displacement. The prior identity is DESTROYED by the stamp, so it MUST be captured at make-current time.
    let nextBacklog: Slot | null = null;
    // (1) nextBacklogOverride: owner explicit designate-next OR the captured displaced-prior (validity-checked; reject stale DONE/self; forward across sprints is fine)
    if (this.nextBacklogOverride) { const o = slotInfo(this.nextBacklogOverride); if (o && !o.done && o.uuid !== currentUuid) nextBacklog = o; }
    // (2) ELSE forward auto-scan + fall-forward to the next sprint's first open task
    if (!nextBacklog) {
      for (let k = i + 1; k < sprintTasks.length; k++) { if (!sprintTasks[k].terminal) { nextBacklog = sprintTasks[k]; break; } }
      if (!nextBacklog && currentSprint) {
        // ⚠ R40.50 EXEMPT (lint allow-list): ALGORITHMIC pin-hop ordering (nearest later sprint for nextBacklog fall-forward). NOT a display list; MUST NOT route through bySprintDisplayOrder; reordering breaks pin resolution.
        const forward = sprintUnits.filter(s => s.number > currentSprint!.number).sort((a, b) => a.number - b.number);
        for (const sp of forward) {
          const open = sp.tasks.map(slotInfo).find((t): t is Slot => !!t && !t.terminal);
          if (open) { nextBacklog = open; break; }
        }
      }
    }

    // BUG-C invariant: no UUID appears in more than one slot.
    const lcUuid = lastCompleted?.uuid || '';
    if (lastCompleted && lcUuid === currentUuid) lastCompleted = null;
    if (nextBacklog && (nextBacklog.uuid === currentUuid || nextBacklog.uuid === lcUuid)) nextBacklog = null;

    const toSlot = (t: Slot | null): TaskSlot | null =>
      t ? { taskUuid: t.uuid, taskName: t.name, reqUuid: t.reqUuid } : null;

    return { current: toSlot(current), lastCompleted: toSlot(lastCompleted), nextBacklog: toSlot(nextBacklog), inProgress: inProgressRanked.map((t) => toSlot(t)!) };
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
      // Pin UC->Class via the SHARED fwdRefs reader (unions canonical singular 'class' + legacy plural 'classes').
      const clsUuid = ior(fwdRefs(ucM as Record<string, unknown>, 'UseCase')[0] || '');
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
