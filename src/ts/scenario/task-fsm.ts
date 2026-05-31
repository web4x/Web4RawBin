/**
 * T133 — Task state machine: 7 states, 8 transition verbs.
 * tronApprove() is the TRON-ONLY gate — requires explicit commit ref.
 *
 * [impl:uuid:a4133b09-e30a-4d74-b915-9a8fe4c060d8] R17.15
 */
import { type ScenarioUnit } from './types.js';

export type TaskState = 'Planned' | 'Refining' | 'CreatingTestCases' | 'Implementing' | 'Testing' | 'QAReview' | 'Done';

export const TASK_STATES: TaskState[] = ['Planned', 'Refining', 'CreatingTestCases', 'Implementing', 'Testing', 'QAReview', 'Done'];

export const STATE_SYMBOLS: Record<TaskState, string> = {
  Planned: '⏳',
  Refining: '📝',
  CreatingTestCases: '📝🧪',
  Implementing: '🔧',
  Testing: '🧪',
  QAReview: '🔍',
  Done: '🏁',
};

export const TRANSITIONS: Record<string, TaskState[]> = {
  Planned: ['Refining'],
  Refining: ['CreatingTestCases', 'Implementing'],
  CreatingTestCases: ['Implementing'],
  Implementing: ['Testing'],
  Testing: ['QAReview'],
  QAReview: ['Done'],
  Done: [],
};

function guardTransition(current: string, ...allowed: TaskState[]): void {
  if (!allowed.includes(current as TaskState)) {
    throw new Error(`Cannot transition from '${current}' — allowed: ${allowed.join(', ')}`);
  }
}

export function startRefinement(unit: ScenarioUnit): void {
  guardTransition(unit.model.status as string, 'Planned');
  (unit.model as Record<string, unknown>).status = 'Refining';
}

export function startCreatingTestCases(unit: ScenarioUnit): void {
  guardTransition(unit.model.status as string, 'Refining');
  (unit.model as Record<string, unknown>).status = 'CreatingTestCases';
}

export function startImplementing(unit: ScenarioUnit): void {
  guardTransition(unit.model.status as string, 'Refining', 'CreatingTestCases');
  (unit.model as Record<string, unknown>).status = 'Implementing';
}

export function startTesting(unit: ScenarioUnit): void {
  guardTransition(unit.model.status as string, 'Implementing');
  (unit.model as Record<string, unknown>).status = 'Testing';
}

export function requestQAReview(unit: ScenarioUnit): void {
  guardTransition(unit.model.status as string, 'Testing');
  (unit.model as Record<string, unknown>).status = 'QAReview';
}

export function tronApprove(unit: ScenarioUnit, tronCommitRef: string): void {
  guardTransition(unit.model.status as string, 'QAReview');
  if (!tronCommitRef) throw new Error('tronApprove requires a Tron commit ref');
  const m = unit.model as Record<string, unknown>;
  m.status = 'Done';
  m.tronApprovalCommit = tronCommitRef;
}

export function resetToPlanned(unit: ScenarioUnit): void {
  (unit.model as Record<string, unknown>).status = 'Planned';
}

export function canTransition(unit: ScenarioUnit, target: TaskState): boolean {
  const current = unit.model.status as string;
  return (TRANSITIONS[current] || []).includes(target);
}
