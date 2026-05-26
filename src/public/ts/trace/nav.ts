/**
 * T105 — module-level navigation hook. Views (rb-object-item) call `navigate(...)` without
 * holding a TraceRouter reference; the active TraceRouter registers itself via setActiveRouter
 * (in TraceRouter.start). Keeps Views pure — routing stays in the controller.
 *
 * [impl:uuid:105e4f50-6172-4384-895b-e05050505105] AC6 click→navigate
 */
import type { Navigator } from './VerbRegistry.js';

let active: Navigator | null = null;

export function setActiveRouter(router: Navigator | null): void { active = router; }

export function navigate(type: string, verb = 'show', params: Record<string, string> = {}): void {
  active?.navigate(type, verb, params);
}
