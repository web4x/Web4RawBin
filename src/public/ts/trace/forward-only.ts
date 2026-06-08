/**
 * T181 — Forward-only link filter for DetailViews.
 * Filters obj.toJSON().links to only forward keys per LOCKED 7-step chain.
 *
 * [impl:uuid:a3f181b4-c5d6-4e7f-8a90-1b2c3d4e5f81] R-U forward-only display
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
