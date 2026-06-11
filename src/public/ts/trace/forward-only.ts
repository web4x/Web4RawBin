/**
 * T181 — Forward-only link filter for DetailViews.
 * Filters obj.toJSON().links to only forward keys per LOCKED 7-step chain.
 *
 * [impl:uuid:84e8383c-6b8a-43a5-b725-2c3b1bf833ab] R-U forward-only display
 */
import type { TraceObject } from '../../../ts/shared/TraceModel.js';

const FORWARD_KEYS: Record<string, string[]> = {
  requirement: ['useCases'],
  task: ['useCases'],
  usecase: ['classes'],
  class: ['methods'],
  method: ['implementations'],
  implementation: ['tests'],
  test: [],
};

export function forwardOnly(obj: TraceObject): Record<string, string[]> {
  const all = obj.toJSON().links;
  const allowed = FORWARD_KEYS[obj.type] || [];
  const result: Record<string, string[]> = {};
  for (const key of allowed) {
    if (all[key]) result[key] = all[key];
  }
  return result;
}
